import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Analysis } from '../types';
import { docTheme, urgencyTag, radius, rtlText } from '../theme';
import { useI18n } from '../i18n';

export function DocumentTypeBanner({ analysis }: { analysis: Analysis }) {
  const { rtl } = useI18n();
  const theme = docTheme(analysis.document_type);
  const tag = urgencyTag(analysis.action_checklist);
  return (
    <View style={[styles.card, { backgroundColor: theme.bg }]}>
      <View style={[styles.tag, rtl ? { left: 16 } : { right: 16 }]}>
        <Text style={[styles.tagText, { color: theme.text }]}>{tag.label}</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }, rtlText(rtl), rtl ? { paddingLeft: 84 } : { paddingRight: 84 }]}>
        {analysis.document_type}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: 20, marginBottom: 22 },
  tag: { position: 'absolute', top: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 27 },
});
