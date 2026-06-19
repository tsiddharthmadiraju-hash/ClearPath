/**
 * Validate and normalize the JSON object Claude returns so the frontend can
 * trust its shape. The model is instructed to return clean JSON, but we never
 * render un-validated model output to a stressed user — if anything is missing
 * or malformed we degrade safely (and to LOW confidence, never false high).
 */

import { getResourcesForDocumentType, UNIVERSAL_211 } from './resources.js';

const URGENCIES = new Set(['immediate', 'this_week', 'no_deadline']);
const CONFIDENCES = new Set(['high', 'medium', 'low']);

const FALLBACK_211 = {
  name: '211',
  type: 'Community resource hotline',
  what_they_do:
    'Free, confidential 24/7 service that connects you to local help with housing, benefits, legal aid, and more.',
  phone: '211',
  website: 'https://www.211.org',
  call_script:
    'Hi, I received a document I do not fully understand and I need help figuring out my next steps and who can help me locally.',
};

const DEFAULT_DISCLAIMER =
  'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.';

function str(value, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function nullableStr(value) {
  if (value === null || value === undefined) return null;
  const s = str(value);
  return s.length ? s : null;
}

function normalizeUrgency(value) {
  const v = str(value).toLowerCase().replace(/\s+/g, '_');
  return URGENCIES.has(v) ? v : 'no_deadline';
}

function normalizeChecklist(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      step: Number.isFinite(item.step) ? item.step : index + 1,
      action: str(item.action, 'Review this document carefully.'),
      deadline: nullableStr(item.deadline),
      urgency: normalizeUrgency(item.urgency),
      detail: str(item.detail, ''),
    }))
    .filter((item) => item.action.length > 0);
}

function normalizeResources(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      name: str(item.name, 'Local support'),
      type: str(item.type, ''),
      what_they_do: str(item.what_they_do, ''),
      phone: nullableStr(item.phone),
      website: nullableStr(item.website),
      call_script: str(item.call_script, ''),
    }))
    .filter((item) => item.name.length > 0);
}

function nameKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Responsible-AI rule: the verified 211 helpline is ALWAYS the first resource so
 * the user always has a human fallback with a phone number that works. We then
 * keep Claude's (often location-specific) resources and supplement them with
 * verified national organizations for the document type — and if Claude returned
 * too few, the verified database fully backs up the list. Capped so it stays
 * scannable for a stressed reader.
 */
function mergeWithVerified(claudeResources, documentType) {
  const verified = getResourcesForDocumentType(documentType); // [211, ...category]
  const result = [UNIVERSAL_211];
  const seen = new Set([nameKey(UNIVERSAL_211.name)]);

  // Keep Claude's resources (dropping any duplicate 211 — the verified one wins).
  for (const r of claudeResources) {
    if (/\b211\b/.test(r.name)) continue;
    const key = nameKey(r.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(r);
  }

  // Supplement with verified, real-phone-number national orgs not already present.
  for (const v of verified.slice(1)) {
    if (result.length >= 5) break;
    const key = nameKey(v.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(v);
  }

  return result.slice(0, 5);
}

export function validateAnalysis(raw) {
  const issues = [];
  const obj = raw && typeof raw === 'object' ? raw : {};

  const checklist = normalizeChecklist(obj.action_checklist);
  let resources = normalizeResources(obj.resources);

  let confidence = str(obj.confidence).toLowerCase();
  if (!CONFIDENCES.has(confidence)) {
    confidence = 'low';
    issues.push('confidence missing or invalid; defaulted to low');
  }

  const documentType = str(obj.document_type, 'Unrecognized document');
  const plainExplanation = str(obj.plain_explanation);

  // If the model gave us nothing meaningful, force low confidence — a wrong
  // answer delivered with false confidence is worse than an honest "unsure".
  if (!plainExplanation || (checklist.length === 0 && resources.length === 0)) {
    confidence = 'low';
    issues.push('explanation or actionable content missing; forced low confidence');
  }

  resources = mergeWithVerified(resources, documentType);

  return {
    analysis: {
      document_type: documentType,
      plain_explanation:
        plainExplanation ||
        'We could not clearly read this document. Please call 211 so a real person can help you understand it.',
      action_checklist: checklist,
      resources,
      confidence,
      confidence_reason: str(
        obj.confidence_reason,
        confidence === 'low'
          ? 'The document was unclear or could not be fully analyzed.'
          : 'Analysis completed.'
      ),
      disclaimer: str(obj.disclaimer, DEFAULT_DISCLAIMER),
    },
    issues,
  };
}

export { FALLBACK_211, DEFAULT_DISCLAIMER };
