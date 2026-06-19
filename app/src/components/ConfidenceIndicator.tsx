import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Confidence } from '../types';
import { radius } from '../theme';
import { useI18n } from '../i18n';

const META: Record<Confidence, { bg: string; text: string; key: string }> = {
  high: { bg: '#DCFCE7', text: '#166534', key: 'confident' },
  medium: { bg: '#FEF3C7', text: '#92400E', key: 'review_recommended' },
  low: { bg: '#FEE2E2', text: '#991B1B', key: 'verify_expert' },
};

export function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const { t } = useI18n();
  const meta = META[confidence] ?? META.low;
  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.text }]}>{t(meta.key)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  text: { fontSize: 12, fontWeight: '700' },
});
