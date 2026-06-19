import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Analysis, AnalyzeInput } from './types';

/**
 * Base URL of the ClearPath backend.
 *
 * A phone running Expo Go cannot reach "localhost" on your laptop, so we
 * auto-detect the laptop's LAN address from the Expo dev server host
 * (e.g. "192.168.1.4:8081") and point at the backend on port 4000.
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_API_BASE env var (set this to your deployed URL in prod).
 *   2. extra.apiBaseUrl in app.json, if it's not localhost.
 *   3. The Expo dev host IP with port 4000 (physical device / LAN).
 *   4. http://localhost:4000 (iOS Simulator, Android emulator via adb, web).
 */
const BACKEND_PORT = 4000;

function resolveApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (fromExtra && !/localhost|127\.0\.0\.1/.test(fromExtra)) return fromExtra.replace(/\/$/, '');

  // hostUri looks like "192.168.1.4:8081" or "192.168.1.4:8081/..." on a device.
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).expoGoConfig?.debuggerHost;
  const host = hostUri?.split('/')[0]?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${BACKEND_PORT}`;
  }

  // Android emulator reaches the host machine via 10.0.2.2, not localhost.
  if (Platform.OS === 'android') return `http://10.0.2.2:${BACKEND_PORT}`;
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE = resolveApiBase();

export class AnalyzeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

export async function analyze(input: AnalyzeInput): Promise<Analysis> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new AnalyzeError(
      'We could not reach the server. Your data was not stored. Please try again.',
      'network'
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AnalyzeError(
      data.message || 'We had trouble reading this document.',
      data.error
    );
  }
  return data as Analysis;
}

/** Re-translate an existing analysis result into a new language. */
export async function translateAnalysis(analysis: Analysis, language: string): Promise<Analysis> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis, language }),
    });
  } catch {
    throw new AnalyzeError('We could not reach the server to translate. Please try again.', 'network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AnalyzeError(data.message || 'We could not translate this result.', data.error);
  }
  return data as Analysis;
}

export interface EscalationResult {
  resources: { name: string; what_they_do: string; phone: string | null; website: string | null }[];
  note: string;
}

export async function requestEscalation(documentType?: string): Promise<EscalationResult> {
  try {
    const res = await fetch(`${API_BASE}/escalation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType }),
    });
    if (res.ok) return (await res.json()) as EscalationResult;
  } catch {
    /* fall through to offline default */
  }
  return {
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
  };
}
