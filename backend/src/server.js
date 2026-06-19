// PRIVACY: This file processes document content that is never persisted.
// Content is sent to the Claude API and immediately discarded after the response.
// The only things stored server-side are anonymous counts (rate limiting),
// content-free error logs, and health-check timestamps.
import 'dotenv/config';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeDocument, translateAnalysis, MOCK_MODE } from './analyze.js';
import { validateAnalysis } from './validate.js';
import { getDemoResponse } from './demoData.js';
import { sanitizeText, detectInjection, validateImage, MAX_TEXT_LENGTH } from './security.js';
import { initLogging, loggingEnabled, logSession } from './logging.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT || 4000;

const app = express();
app.disable('x-powered-by');

// MEASURE 5: security headers on every response (nosniff, frame-deny, HSTS, etc.).
app.use(helmet({ frameguard: { action: 'deny' }, referrerPolicy: { policy: 'no-referrer' } }));

// MEASURE 5: only allow our own frontends (plus LAN dev origins) to call the API.
const ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'http://localhost:19006',
  'http://localhost:8081',
  'https://clearpath.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = same-origin or a native app (Expo) — allow.
      const ok =
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);
      cb(null, ok);
    },
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
  })
);

// Camera images and PDFs arrive as base64 — allow a generous body size.
app.use(express.json({ limit: '20mb' }));

// MEASURE 2: rate limiting. Global cap, plus stricter per-endpoint caps applied
// on /analyze (real analyses vs. free demo responses are counted separately).
const rl = (windowMs, max, message, skip) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited', message },
    ...(skip ? { skip } : {}),
  });

const isDemoReq = (req) => Boolean(req.body && req.body.demoType && getDemoResponse(req.body.demoType));

const globalLimiter = rl(15 * 60 * 1000, 100, 'Too many requests. Please wait a few minutes before trying again.');
// Real analyses: 10/hour. Demo requests are skipped here and counted separately.
const analyzeLimiter = rl(
  60 * 60 * 1000,
  10,
  'You have analyzed 10 documents this hour. Please wait before analyzing more, or call 211 for immediate human help.',
  (req) => isDemoReq(req)
);
// Free demo responses: 50/hour. Skips anything that is not a demo request.
const demoLimiter = rl(60 * 60 * 1000, 50, 'Too many demo requests. Please wait a little while.', (req) => !isDemoReq(req));

app.use(globalLimiter);

/** Health / status — lets a judge confirm the server and mode at a glance. */
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'clearpath',
    mode: MOCK_MODE ? 'mock' : 'live',
    model: MOCK_MODE ? 'mock' : process.env.CLEARPATH_MODEL || 'claude-haiku-4-5',
    logging: loggingEnabled(),
    time: new Date().toISOString(),
  });
});

/** Lazy PDF text extraction. Imported from lib/ to skip pdf-parse's debug shim. */
async function extractPdfText(pdfBase64) {
  const buffer = Buffer.from(pdfBase64, 'base64');
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

/**
 * Browsers' FileReader.readAsDataURL (and some pickers) produce a full data URL
 * like "data:image/jpeg;base64,XXXX". Claude's vision API and pdf-parse both need
 * the RAW base64 only, so strip the prefix and recover the media type from it.
 */
function parseBase64Payload(input) {
  if (typeof input !== 'string') return { data: '', mediaType: null };
  const match = input.match(/^data:([^;,]+)?(?:;[^,]*)*,([\s\S]*)$/);
  if (match) return { data: match[2].trim(), mediaType: match[1] || null };
  return { data: input.trim(), mediaType: null };
}

/** True if this raw base64 decodes to bytes starting with the %PDF magic number. */
function looksLikePdf(base64) {
  try {
    return Buffer.from(base64.slice(0, 12), 'base64').subarray(0, 4).toString('latin1') === '%PDF';
  } catch {
    return false;
  }
}

/**
 * POST /analyze
 * Body (one of): { text } | { image, mediaType } | { pdfBase64 }
 * Optional: { location, inputMethod }
 */
// PRIVACY: /analyze processes document content that is never persisted. Content
// is sanitized, sent to Claude, and discarded after the response.
app.post('/analyze', demoLimiter, analyzeLimiter, async (req, res) => {
  const { text, image, pdfBase64, location, language, demoType } = req.body || {};
  let { inputMethod, mediaType } = req.body || {};

  try {
    // Demo safety net: a pre-built response returns instantly, bypassing the API
    // so example chips can never fail during a live demo or recorded video.
    if (demoType) {
      const demo = getDemoResponse(demoType);
      if (demo) {
        const { analysis, issues } = validateAnalysis(demo);
        logSession({
          documentType: analysis.document_type,
          confidence: analysis.confidence,
          inputMethod: 'demo',
          escalated: false,
        });
        return res.json({ ...analysis, _meta: { mode: 'demo', model: 'pre-built', inputMethod: 'demo', issues } });
      }
    }

    let documentText = typeof text === 'string' ? text : '';
    let documentImage = null;

    // A PDF can arrive as pdfBase64, OR mislabeled as an image — mobile file
    // pickers frequently hand over a PDF with an empty/octet-stream MIME type,
    // which lands in the `image` field. Sniff the magic bytes so either path works.
    let pdfData = pdfBase64 ? parseBase64Payload(pdfBase64).data : null;
    let imgData = image ? parseBase64Payload(image).data : null;
    if (!pdfData && imgData && looksLikePdf(imgData)) {
      pdfData = imgData;
      imgData = null;
    }

    if (pdfData) {
      inputMethod = 'pdf';
      try {
        documentText = await extractPdfText(pdfData);
      } catch {
        return res.status(422).json({
          error: 'unreadable_pdf',
          message:
            'We could not read text from that PDF. Try the "Type or Paste Text" option instead.',
        });
      }
      if (!documentText) {
        return res.status(422).json({
          error: 'empty_pdf',
          message:
            'That PDF did not contain readable text (it may be a scan). Try taking a photo instead.',
        });
      }
    } else if (imgData) {
      inputMethod = inputMethod || 'camera';
      // MEASURE 1: validate it is a real jpeg/png/webp under 10 MB.
      const v = validateImage(imgData);
      if (!v.ok) {
        return res.status(422).json({ error: v.error, message: v.message });
      }
      documentImage = imgData;
      mediaType = v.mediaType; // trust the sniffed type, not the client's claim
    } else if (documentText) {
      inputMethod = inputMethod || 'text';
    } else {
      return res.status(400).json({
        error: 'no_document',
        message: 'Send a document as text, an image, or a PDF to analyze.',
      });
    }

    // MEASURE 1 + 4: sanitize text, enforce the length limit, and block prompt
    // injection before anything reaches Claude. Applies to pasted and PDF text.
    if (documentText) {
      documentText = sanitizeText(documentText);
      if (documentText.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({
          error: 'too_long',
          message: 'This document is too long to analyze at once. Please paste the most important section.',
        });
      }
      if (detectInjection(documentText)) {
        // Log the attempt (timestamp + IP only) — never the content.
        console.warn(`[security] prompt-injection attempt blocked at ${new Date().toISOString()} from ${req.ip}`);
        return res.status(400).json({
          error: 'injection_attempt',
          message: 'We detected unusual content in this submission. Please paste only the text from your document.',
        });
      }
    }

    const { raw, mode, model } = await analyzeDocument({
      text: documentText,
      image: documentImage,
      mediaType,
      location,
      language,
    });

    const { analysis, issues } = validateAnalysis(raw);

    // Photo-specific failure: if we analyzed an image but the model could not
    // extract anything meaningful, guide the user rather than show an empty result.
    if (documentImage && issues.some((i) => i.includes('actionable content missing'))) {
      return res.status(422).json({
        error: 'unreadable_image',
        message:
          'We could not read this photo clearly. Try better lighting or use the text paste option instead.',
      });
    }

    // Anonymous, content-free logging.
    logSession({
      documentType: analysis.document_type,
      confidence: analysis.confidence,
      inputMethod,
      escalated: false,
    });

    res.json({ ...analysis, _meta: { mode, model, inputMethod, issues } });
  } catch (err) {
    console.error('[analyze] error:', err?.message || err);
    res.status(502).json({
      error: 'analysis_failed',
      message:
        'We had trouble analyzing this document. Your data was not stored. Please try again, or call 211 for help.',
    });
  }
});

/**
 * Overlay translated text onto the ORIGINAL structure so names, phones, URLs,
 * enums and step numbers are always preserved even if the model drops a field.
 */
function applyTranslation(original, translated) {
  const tr = translated && typeof translated === 'object' ? translated : {};
  const pick = (a, b) => (typeof b === 'string' && b.trim() ? b : a);
  const list = (key) => (Array.isArray(tr[key]) ? tr[key] : []);
  return {
    ...original,
    document_type: pick(original.document_type, tr.document_type),
    plain_explanation: pick(original.plain_explanation, tr.plain_explanation),
    confidence_reason: pick(original.confidence_reason, tr.confidence_reason),
    disclaimer: pick(original.disclaimer, tr.disclaimer),
    action_checklist: (original.action_checklist || []).map((step, i) => {
      const ts = list('action_checklist')[i] || {};
      return {
        ...step,
        action: pick(step.action, ts.action),
        detail: pick(step.detail, ts.detail),
        deadline: typeof ts.deadline === 'string' && ts.deadline.trim() ? ts.deadline : step.deadline,
      };
    }),
    resources: (original.resources || []).map((r, i) => {
      const tres = list('resources')[i] || {};
      return {
        ...r, // name, phone, website preserved
        type: pick(r.type, tres.type),
        what_they_do: pick(r.what_they_do, tres.what_they_do),
        call_script: pick(r.call_script, tres.call_script),
      };
    }),
  };
}

/**
 * POST /translate — re-translate an existing analysis into a new language.
 * Body: { analysis, language }. No document content is stored.
 */
app.post('/translate', async (req, res) => {
  const { analysis, language } = req.body || {};
  if (!analysis || typeof analysis !== 'object' || !language) {
    return res.status(400).json({ error: 'bad_request', message: 'Send an analysis and a target language.' });
  }
  try {
    const { raw, mode, model } = await translateAnalysis(analysis, language);
    const merged = applyTranslation(analysis, raw);
    return res.json({ ...merged, _meta: { mode, model, inputMethod: 'translate', issues: [] } });
  } catch (err) {
    console.error('[translate] error:', err?.message || err);
    return res.status(502).json({ error: 'translate_failed', message: 'We could not translate this result. Please try again.' });
  }
});

/**
 * POST /escalation — records (anonymously) that a user asked for a real person.
 * Returns the always-available human resources shown in the escalation panel.
 */
app.post('/escalation', (req, res) => {
  const { documentType } = req.body || {};
  logSession({ documentType, confidence: null, inputMethod: null, escalated: true });
  res.json({
    resources: [
      {
        name: '211',
        what_they_do: 'Call or text for free, 24/7 community support navigation.',
        phone: '211',
        website: 'https://www.211.org',
      },
      {
        name: 'Legal Aid (jurisdiction-specific)',
        what_they_do: 'Free legal help for income-eligible residents.',
        phone: null,
        website: 'https://www.lawhelp.org',
      },
    ],
    note: 'ClearPath cannot give legal advice. These organizations can.',
  });
});

// Serve the vanilla web client (an immediately-runnable demo of the same flow).
app.use(express.static(PUBLIC_DIR));

// MEASURE 7: safe catch-all error handler — never leak stack traces, internal
// paths, or raw errors to the client. (Must be the last middleware registered.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Server error:', err?.message || err);
  if (res.headersSent) return;
  res.status(500).json({
    error: 'server_error',
    message: 'Something went wrong on our end. Please try again or talk to a real person for help.',
    confidence: 'low',
  });
});

// MEASURE 3: warn (never throw, never print the key) if the API key has somehow
// leaked into a frontend file that gets served to the browser.
function checkKeyNotExposed() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return;
  try {
    for (const file of fs.readdirSync(PUBLIC_DIR)) {
      if (!/\.(js|html|css|json)$/.test(file)) continue;
      if (fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8').includes(key)) {
        console.warn(`[security] WARNING: API key found in frontend file public/${file} — remove it immediately.`);
      }
    }
  } catch {
    /* non-fatal */
  }
}

initLogging().then((on) => {
  checkKeyNotExposed();
  app.listen(PORT, () => {
    console.log(`ClearPath backend listening on http://localhost:${PORT}`);
    console.log(`  mode:    ${MOCK_MODE ? 'MOCK (no ANTHROPIC_API_KEY)' : 'LIVE (Claude)'}`);
    console.log(`  logging: ${on ? 'Supabase enabled' : 'disabled (no Supabase env)'}`);
    console.log(`  web demo: http://localhost:${PORT}/`);
  });
});
