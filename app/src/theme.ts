import type { Urgency, Confidence, ChecklistStep } from './types';

export const colors = {
  navy: '#1B4F72',
  navySoft: '#EEF3F8',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  amber: '#F59E0B',
  ink: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  line: '#F3F4F6',
  // method icon circles
  iconBlue: '#E8F0FE',
  iconGreen: '#E6F4EA',
  iconAmber: '#FEF7E0',
};

export const radius = { card: 20, btn: 14, pill: 50 };

/** RTL helpers — apply to text and rows so Arabic mirrors correctly. */
export const rtlText = (rtl: boolean) =>
  ({ textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' } as const);
export const rtlRow = (rtl: boolean) =>
  ({ flexDirection: rtl ? 'row-reverse' : 'row' } as const);

/** Soft shadow used on every card (spec: 0 2px 8px rgba(0,0,0,0.06)). */
export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

interface Pair {
  bg: string;
  text: string;
}
const RED: Pair = { bg: '#FEE2E2', text: '#991B1B' };
const AMBER: Pair = { bg: '#FEF3C7', text: '#92400E' };
const BLUE: Pair = { bg: '#DBEAFE', text: '#1E40AF' };
const GREEN: Pair = { bg: '#DCFCE7', text: '#166534' };
const NAVY: Pair = { bg: '#EEF3F8', text: '#1B4F72' };

export const urgencyMeta: Record<Urgency, { label: string; circle: string } & Pair> = {
  immediate: { label: 'Immediate', circle: '#DC2626', ...RED },
  this_week: { label: 'This Week', circle: '#F59E0B', ...AMBER },
  no_deadline: { label: 'No Deadline', circle: '#16A34A', ...GREEN },
};

/** Document type card color, keyed off the detected type. */
export function docTheme(type: string): Pair {
  const t = String(type).toLowerCase();
  if (/(evict|vacate|lease|writ|detainer|utility|shutoff|disconnect|electric|housing)/.test(t)) return RED;
  if (/(medical|discharge|hospital|health|clinic|surg)/.test(t)) return BLUE;
  if (/(benefit|snap|medicaid|ssi|school|truancy|attendance|food)/.test(t)) return AMBER;
  return NAVY;
}

export function urgencyTag(checklist: ChecklistStep[]): { label: string } & Pair {
  if (checklist.some((s) => s.urgency === 'immediate')) return { label: 'URGENT', ...RED };
  if (checklist.some((s) => s.urgency === 'this_week')) return { label: 'REVIEW', ...AMBER };
  return { label: 'INFO', ...BLUE };
}

export function confPill(confidence: Confidence): { label: string } & Pair {
  if (confidence === 'high') return { label: 'Confident', ...GREEN };
  if (confidence === 'medium') return { label: 'Review recommended', ...AMBER };
  return { label: 'Verify with expert', ...RED };
}

export function countdown(checklist: ChecklistStep[]): string | null {
  const d = checklist.find((s) => s.deadline);
  if (!d || !d.deadline) return null;
  const m = d.deadline.match(/(\d+)\s*day/i);
  return m ? `${m[1]} days left` : d.deadline;
}
