
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
  }
}
