// PRIVACY: stores ONLY the analysis result on this device (AsyncStorage). It never
// stores the original document text or image. Mirrors the web history.js API.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Analysis } from '../types';

const KEY = 'cp_history';
const MAX_ITEMS = 10;

export type InputType = 'camera' | 'upload' | 'paste';

export interface HistoryItem {
  id: string;
  document_type: string;
  date_analyzed: string;
  ts: number;
  confidence: string;
  language: string;
  plain_explanation: string;
  full_result: Analysis;
  input_type: InputType;
  checkedSteps: Record<string, boolean>;
}

async function load(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // corrupted storage — degrade gracefully
  }
}

async function persist(items: HistoryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function formatDate(d: Date): string {
  try {
    const date = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${date} at ${time}`;
  } catch {
    return d.toISOString();
  }
}

export async function saveAnalysis(result: Analysis, inputType: InputType, language: string): Promise<HistoryItem | null> {
  if (!result) return null;
  const now = new Date();
  const explanation = result.plain_explanation || '';
  const item: HistoryItem = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    document_type: result.document_type || 'Document',
    date_analyzed: formatDate(now),
    ts: now.getTime(),
    confidence: result.confidence || 'low',
    language: language || 'English',
    plain_explanation: explanation.slice(0, 120) + (explanation.length > 120 ? '…' : ''),
    full_result: result,
    input_type: inputType || 'paste',
    checkedSteps: {},
  };
  const items = await load();
  items.unshift(item);
  await persist(items.slice(0, MAX_ITEMS));
  return item;
}

export async function getHistory(): Promise<HistoryItem[]> {
  return load();
}

export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  return (await load()).find((x) => x.id === id) || null;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await persist((await load()).filter((x) => x.id !== id));
}

export async function clearAllHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export async function setChecked(id: string, stepKey: string, checked: boolean): Promise<void> {
  const items = await load();
  const item = items.find((x) => x.id === id);
  if (!item) return;
  item.checkedSteps = { ...(item.checkedSteps || {}), [stepKey]: checked };
  await persist(items);
}

export async function historyCount(): Promise<number> {
  return (await load()).length;
}
