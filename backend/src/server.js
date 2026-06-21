import 'dotenv/config';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeDocument, translateAnalysis, expandStep, MOCK_MODE } from './analyze.js';
import { validateAnalysis } from './validate.js';
import { getDemoResponse } from './demoData.js';
import { sanitizeText, detectInjection, validateImage, MAX_TEXT_LENGTH } from './security.js';
import { initLogging, loggingEnabled, logSession } from './logging.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT || 4000;

const app = express();
app.disable('x-powered-by');

app.use(helmet({ frameguard: { action: 'deny' }, referrerPolicy: { policy: 'no-referrer' } }));

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

app.use(express.json({ limit: '20mb' }));

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
const analyzeLimiter = rl(
  60 * 60 * 1000,
  10,
  'You have analyzed 10 documents this hour. Please wait before analyzing more, or call 211 for immediate human help.',
  (req) => isDemoReq(req)
);
const demoLimiter = rl(60 * 60 * 1000, 50, 'Too many demo requests. Please wait a little while.', (req) => !isDemoReq(req));
const expandLimiter = rl(60 * 60 * 1000, 40, 'Too many requests. Please wait a little while before expanding more steps.');

app.use(globalLimiter);

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

async function extractPdfText(pdfBase64) {
  const buffer = Buffer.from(pdfBase64, 'base64');
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

function parseBase64Payload(input) {
  if (typeof input !== 'string') return { data: '', mediaType: null };
  const match = input.match(/^data:([^;,]+)?(?:;[^,]*)*,([\s\S]*)$/);
  if (match) return { data: match[2].trim(), mediaType: match[1] || null };
  return { data: input.trim(), mediaType: null };
}

function looksLikePdf(base64) {
  try {
    return Buffer.from(base64.slice(0, 12), 'base64').subarray(0, 4).toString('latin1') === '%PDF';
  } catch {
    return false;
  }
}

app.post('/analyze', demoLimiter, analyzeLimiter, async (req, res) => {
  const { text, image, pdfBase64, location, language, demoType } = req.body || {};
  let { inputMethod, mediaType } = req.body || {};

  try {
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
      const v = validateImage(imgData);
      if (!v.ok) {
        return res.status(422).json({ error: v.error, message: v.message });
      }
      documentImage = imgData;
      mediaType = v.mediaType;
    } else if (documentText) {
      inputMethod = inputMethod || 'text';
    } else {
      return res.status(400).json({
        error: 'no_document',
        message: 'Send a document as text, an image, or a PDF to analyze.',
      });
    }

    if (documentText) {
      documentText = sanitizeText(documentText);
      if (documentText.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({
          error: 'too_long',
          message: 'This document is too long to analyze at once. Please paste the most important section.',
        });
      }
      if (detectInjection(documentText)) {
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

    if (documentImage && issues.some((i) => i.includes('actionable content missing'))) {
      return res.status(422).json({
        error: 'unreadable_image',
        message:
          'We could not read this photo clearly. Try better lighting or use the text paste option instead.',
      });
    }

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
        ...r,
        type: pick(r.type, tres.type),
        what_they_do: pick(r.what_they_do, tres.what_they_do),
        call_script: pick(r.call_script, tres.call_script),
      };
    }),
  };
}

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

app.post('/expand', expandLimiter, async (req, res) => {
  const { action, detail, documentType, language } = req.body || {};
  const cleanAction = sanitizeText(typeof action === 'string' ? action : '');
  const cleanDetail = sanitizeText(typeof detail === 'string' ? detail : '');
  if (!cleanAction) {
    return res.status(400).json({ error: 'bad_request', message: 'Send the step you want explained.' });
  }
  if (detectInjection(cleanAction) || (cleanDetail && detectInjection(cleanDetail))) {
    return res.status(400).json({ error: 'injection_attempt', message: 'We could not process that step. Please try a different one.' });
  }
  try {
    const { steps, mode, model } = await expandStep({
      action: cleanAction,
      detail: cleanDetail,
      documentType: sanitizeText(typeof documentType === 'string' ? documentType : ''),
      language,
    });
    if (!steps.length) {
      return res.status(502).json({ error: 'expand_failed', message: 'We could not break this step down right now. Please try again.' });
    }
    return res.json({ steps, _meta: { mode, model } });
  } catch (err) {
    console.error('[expand] error:', err?.message || err);
    return res.status(502).json({ error: 'expand_failed', message: 'We could not break this step down right now. Please try again.' });
  }
});

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

app.use(
  express.static(PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
      if (/\.(html|js|css|json)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    },
  })
);

app.use((err, req, res, _next) => {
  console.error('Server error:', err?.message || err);
  if (res.headersSent) return;
  res.status(500).json({
    error: 'server_error',
    message: 'Something went wrong on our end. Please try again or talk to a real person for help.',
    confidence: 'low',
  });
});

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
