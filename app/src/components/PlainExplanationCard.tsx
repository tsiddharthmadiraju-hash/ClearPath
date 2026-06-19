import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, cardShadow, rtlText } from '../theme';
import { useI18n } from '../i18n';

export function PlainExplanationCard({ text }: { text: string }) {
  const { t, rtl } = useI18n();
  return (
    <View style={styles.section}>
      <Text style={[styles.label, rtlText(rtl)]}>{t('what_this_means')}</Text>
      <View style={[styles.card, rtl ? styles.cardRtl : styles.cardLtr]}>
        <Text style={[styles.body, rtlText(rtl), rtl && { lineHeight: 29 }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginBottom: 12, marginHorizontal: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, ...cardShadow },
  cardLtr: { borderLeftWidth: 4, borderLeftColor: colors.navy },
  cardRtl: { borderRightWidth: 4, borderRightColor: colors.navy },
  body: { fontSize: 16, lineHeight: 27, color: '#1F2937' },
});
