import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, locationHint, languageInstructions } from './systemPrompt.js';
import { pickMock } from './mockData.js';

const MODEL = process.env.CLEARPATH_MODEL || 'claude-haiku-4-5';
const VISION_MODEL = process.env.CLEARPATH_VISION_MODEL || 'claude-sonnet-4-6';
const MAX_TOKENS = 2000;

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
const forceMock = process.env.CLEARPATH_MOCK === '1' || process.env.CLEARPATH_MOCK === 'true';

export const MOCK_MODE = forceMock || !hasKey;

let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

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

export async function analyzeDocument({ text, image, mediaType, location, language } = {}) {
  const hint = locationHint(location);

  if (MOCK_MODE) {
    const basis = text || (image ? 'image of a document' : '');
    return { raw: pickMock(basis), mode: 'mock', model: 'mock' };
  }

  const system = SYSTEM_PROMPT + languageInstructions(language);
  const model = image ? VISION_MODEL : MODEL;

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
        'Read this photo of a document very carefully. First transcribe ALL visible text — including small ' +
        'print, fine print, handwriting, dates, deadlines, dollar amounts, account/case numbers, addresses, ' +
        'and names. If any part is blurry, glare-washed, or cut off, work only from what you can actually read ' +
        'and lower your confidence accordingly rather than guessing. Then return ONLY the JSON object described ' +
        'in your instructions.' +
        hint,
    });
  } else {
    userContent.push({
      type: 'text',
      text: `Here is the document:\n\n${text}${hint}`,
    });
  }

  const response = await getClient().messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = extractJson(textBlock ? textBlock.text : '');
  return { raw, mode: 'live', model };
}

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

export async function expandStep({ action, detail, documentType, language } = {}) {
  const cleanAction = (typeof action === 'string' ? action : '').trim().slice(0, 600);
  if (!cleanAction) return { steps: [], mode: MOCK_MODE ? 'mock' : 'live', model: 'none' };

  if (MOCK_MODE) {
    return {
      steps: [
        `Read this step slowly again: “${cleanAction}”.`,
        'Gather what you need first — your letter, your ID, and any date or amount it mentions.',
        'If there is a deadline, write it on your calendar today so you do not miss it.',
        'Do the action above. If anything is unclear, call 211 (free) and read them this step — they will help you.',
      ],
      mode: 'mock',
      model: 'mock',
    };
  }

  const langLine = language && language !== 'English' ? ` Write every step in ${language}.` : '';
  const system =
    'A person who is worried and is NOT a lawyer is stuck on ONE step of a to-do list for a confusing ' +
    'government or legal document. Break that single step into 3 to 6 very small, concrete sub-steps they can ' +
    'do one at a time. Use plain, calm words at a 6th-grade reading level and short sentences. Be practical: ' +
    'what to gather, who to call, what to say, what to write down. Do NOT invent facts, names, phone numbers, ' +
    'or deadlines that are not given. Do NOT give legal advice. Return ONLY JSON: {"steps":["...","..."]}.' +
    langLine;

  const ctx =
    `Document type: ${documentType || 'unknown'}\nStep to break down: ${cleanAction}` +
    (detail ? `\nExisting note: ${String(detail).slice(0, 600)}` : '');

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 700,
    system,
    messages: [{ role: 'user', content: `Break this step into simple sub-steps:\n\n${ctx}` }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  const parsed = extractJson(textBlock ? textBlock.text : '');
  const steps = Array.isArray(parsed.steps)
    ? parsed.steps.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()).slice(0, 6)
    : [];
  return { steps, mode: 'live', model: MODEL };
}
