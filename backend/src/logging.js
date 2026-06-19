/**
 * Anonymous, data-minimized session logging.
 *
 * We store ONLY: timestamp, detected document type, confidence level, input
 * method, and whether the user asked to talk to a real person. No document
 * content, no personal information, no identifiers. If Supabase env vars are
 * absent (or the optional dependency isn't installed), logging is a silent
 * no-op so the app runs anywhere with zero setup.
 */

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const TABLE = process.env.SUPABASE_TABLE || 'sessions';

let supabase = null;
let enabled = false;

export async function initLogging() {
  if (!URL || !KEY) return false;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(URL, KEY);
    enabled = true;
    return true;
  } catch {
    // Optional dependency not installed — stay disabled, don't crash.
    enabled = false;
    return false;
  }
}

export function loggingEnabled() {
  return enabled;
}

export async function logSession({ documentType, confidence, inputMethod, escalated }) {
  if (!enabled || !supabase) return;
  try {
    await supabase.from(TABLE).insert({
      created_at: new Date().toISOString(),
      document_type: documentType ?? null,
      confidence: confidence ?? null,
      input_method: inputMethod ?? null,
      escalated: Boolean(escalated),
    });
  } catch {
    // Never let logging failures affect the user-facing request.
  }
}
