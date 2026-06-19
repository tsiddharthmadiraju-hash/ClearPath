import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, locationHint, languageInstructions } from './systemPrompt.js';
import { pickMock } from './mockData.js';

/**
 * claude-haiku-4-5 — fastest + lowest cost, reliable structured JSON. Chosen for
 * snappy demos and cheap per-call pricing. Override with CLEARPATH_MODEL to swap
 * (e.g. claude-sonnet-4-6 for harder documents).
 */
const MODEL = process.env.CLEARPATH_MODEL || 'claude-haiku-4-5';
const MAX_TOKENS = 2000;

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
const forceMock = process.env.CLEARPATH_MOCK === '1' || process.env.CLEARPATH_MOCK === 'true';

export const MOCK_MODE = forceMock || !hasKey;

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

/**
 * Pull a JSON object out of the model's text, tolerating accidental code fences
 * or a stray sentence even though the prompt asks for pure JSON.
 */
function extractJson(text) {
  if (!text) throw new Error('Empty model response');
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('Model did not return valid JSON');
  }
}

/**
 * Analyze a document.
 *
 * @param {object} input
 * @param {string} [input.text]      Pasted or PDF-extracted document text
 * @param {string} [input.image]     base64 image data (no data: prefix)
 * @param {string} [input.mediaType] e.g. image/jpeg, image/png
 * @param {string} [input.location]  optional location hint for local resources
 * @param {string} [input.language]  user's preferred output language (display name)
 * @returns {Promise<{ raw: object, mode: 'mock'|'live', model: string }>}
 */
export async function analyzeDocument({ text, image, mediaType, location, language } = {}) {
  const hint = locationHint(location);

  if (MOCK_MODE) {
    // No key configured — return a deterministic English sample so the full UX
    // still works offline. Live mode (with a key) returns the chosen language.
    const basis = text || (image ? 'image of a document' : '');
    return { raw: pickMock(basis), mode: 'mock', model: 'mock' };
  }

  const system = SYSTEM_PROMPT + languageInstructions(language);

  const userContent = [];
  if (image) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType || 'image/jpeg',
        data: image,
      },
    });
    userContent.push({
      type: 'text',
      text:
        'Analyze the document in this image and return ONLY the JSON object described in your instructions.' +
        hint,
    });
  } else {
    userContent.push({
      type: 'text',
      text: `Here is the document:\n\n${text}${hint}`,
    });
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = extractJson(textBlock ? textBlock.text : '');
  return { raw, mode: 'live', model: MODEL };
}

/**
 * Re-translate an EXISTING analysis result into a new language. We never store
 * the original document, so when the user switches languages we translate the
 * result itself rather than re-analyzing. Names, phone numbers, URLs, and the
 * urgency/confidence enums are preserved; only human-readable text changes.
 *
 * @returns {Promise<{ raw: object, mode: 'mock'|'live', model: string }>}
 */
export async function translateAnalysis(analysis, language) {
  if (MOCK_MODE || !language) {
    return { raw: analysis, mode: MOCK_MODE ? 'mock' : 'live', model: MOCK_MODE ? 'mock' : MODEL };
  }
  const system =
    `You translate ClearPath analysis JSON into ${language}. Return ONLY one JSON object with the EXACT same keys and array order as the input. ` +
    `Translate these human-readable fields into ${language}: "document_type", "plain_explanation", "confidence_reason", "disclaimer", each action_checklist item's "action", "detail" and "deadline", and each resources item's "type", "what_they_do" and "call_script". ` +
    `Do NOT change or translate: every "name", "phone", "website", numeric "step", and the enum values of "urgency" (immediate/this_week/no_deadline) and "confidence" (high/medium/low) — copy them exactly. ` +
    `Keep "211" as 211. Output valid JSON only, no commentary.`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: `Translate this analysis into ${language}:\n\n${JSON.stringify(analysis)}` }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return { raw: extractJson(textBlock ? textBlock.text : ''), mode: 'live', model: MODEL };
}
