import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ChecklistStep } from '../types';
import { colors, radius, cardShadow, urgencyMeta, countdown, rtlText, rtlRow } from '../theme';
import { useI18n } from '../i18n';
import { setChecked as persistChecked } from '../services/historyService';

export function ActionChecklist({
  checklist,
  historyId,
  checkedSteps,
}: {
  checklist: ChecklistStep[];
  historyId?: string;
  checkedSteps?: Record<string, boolean>;
}) {
  const { t, rtl } = useI18n();
  const [done, setDone] = useState<Record<string, boolean>>(() => ({ ...(checkedSteps || {}) }));
  if (!checklist.length) return null;
  const cd = countdown(checklist);
  const label = (u: string) => (u === 'immediate' ? t('immediate') : u === 'this_week' ? t('this_week') : t('no_deadline'));
  const keyFor = (i: number) => `step_${i + 1}`;

  return (
    <View style={styles.section}>
      <View style={[styles.head, rtlRow(rtl)]}>
        <Text style={styles.label}>{t('what_to_do')}</Text>
        {cd ? <Text style={styles.countdown}>{cd}</Text> : null}
      </View>

      {checklist.map((step, i) => {
        const meta = urgencyMeta[step.urgency] ?? urgencyMeta.no_deadline;
        const k = keyFor(i);
        const isDone = !!done[k];
        const toggle = () => {
          const next = !done[k];
          setDone((d) => ({ ...d, [k]: next }));
          // Persist checked state back to this history item (court-date use case).
          if (historyId) persistChecked(historyId, k, next).catch(() => {});
        };
        return (
          <Pressable key={i} style={[styles.card, rtlRow(rtl), isDone && styles.cardDone]} onPress={toggle}>
            <View style={[styles.num, { backgroundColor: meta.circle }]}>
              <Text style={styles.numText}>{step.step ?? i + 1}</Text>
            </View>
            <View style={styles.main}>
              <Text style={[styles.action, rtlText(rtl), isDone && styles.actionDone]}>{step.action}</Text>
              {step.detail ? <Text style={[styles.detail, rtlText(rtl)]}>{step.detail}</Text> : null}
              <View style={[styles.tags, rtlRow(rtl)]}>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.badgeText, { color: meta.text }]}>{label(step.urgency)}</Text>
                </View>
                {step.deadline ? <Text style={styles.deadline}>{step.deadline}</Text> : null}
              </View>
            </View>
            <View style={[styles.check, isDone && styles.checkOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  head: { alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 2 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  countdown: { fontSize: 12, fontWeight: '800', color: '#991B1B' },
  card: { alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, marginBottom: 12, ...cardShadow },
  cardDone: { opacity: 0.55 },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  main: { flex: 1, minWidth: 0 },
  action: { fontSize: 16, fontWeight: '700', color: colors.ink },
  actionDone: { textDecorationLine: 'line-through' },
  detail: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  tags: { alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  deadline: { fontSize: 12, color: '#374151', fontWeight: '600' },
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: '#D1D5DB' },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
});
