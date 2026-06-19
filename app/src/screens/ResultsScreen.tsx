import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import type { Analysis } from '../types';
import { colors, radius, cardShadow, rtlText, rtlRow } from '../theme';
import { useI18n } from '../i18n';
import { DocumentTypeBanner } from '../components/DocumentTypeBanner';
import { PlainExplanationCard } from '../components/PlainExplanationCard';
import { ActionChecklist } from '../components/ActionChecklist';
import { ResourcesPanel } from '../components/ResourcesPanel';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';

export interface HistoryMeta {
  id: string;
  date_analyzed: string;
  checkedSteps: Record<string, boolean>;
}

interface Props {
  analysis: Analysis;
  onHome: () => void;
  onEscalate: () => void;
  historyMeta?: HistoryMeta;
}

export function ResultsScreen({ analysis, onHome, onEscalate, historyMeta }: Props) {
  const { t, rtl } = useI18n();
  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.top, rtlRow(rtl)]}>
          <Pressable style={styles.back} onPress={onHome} hitSlop={8}>
            <Text style={styles.backChev}>{rtl ? '›' : '‹'}</Text>
          </Pressable>
          <ConfidenceIndicator confidence={analysis.confidence} />
        </View>

        {historyMeta ? (
          <View style={styles.histBanner}>
            <Text style={[styles.histBannerText, rtlText(rtl)]}>{t('analyzed_on').split('{date}').join(historyMeta.date_analyzed)}</Text>
          </View>
        ) : null}

        {analysis.confidence === 'low' ? (
          <View style={styles.lowNote}>
            <Text style={[styles.lowNoteText, rtlText(rtl)]}>{analysis.confidence_reason || t('verify_expert')}</Text>
          </View>
        ) : null}

        <DocumentTypeBanner analysis={analysis} />
        <PlainExplanationCard text={analysis.plain_explanation} />
        <ActionChecklist
          key={historyMeta?.id || 'live'}
          checklist={analysis.action_checklist}
          historyId={historyMeta?.id}
          checkedSteps={historyMeta?.checkedSteps}
        />
        <ResourcesPanel resources={analysis.resources} />

        <Text style={[styles.disclaimer, rtlText(rtl)]}>{analysis.disclaimer}</Text>
      </ScrollView>

      <View style={styles.sticky}>
        <Pressable style={styles.cta} onPress={onEscalate}>
          <Text style={styles.ctaText}>{t('talk_to_person')}</Text>
        </Pressable>
        <Text style={styles.ctaNote}>{t('free_available')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 150 },
  top: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  back: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...cardShadow },
  backChev: { fontSize: 22, color: colors.navy, lineHeight: 24 },
  histBanner: { backgroundColor: '#F3F4F6', borderRadius: radius.card, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
  histBannerText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  lowNote: { backgroundColor: '#FEE2E2', borderRadius: radius.card, padding: 14, marginBottom: 16 },
  lowNoteText: { color: '#991B1B', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  disclaimer: { fontSize: 12, color: colors.faint, lineHeight: 18, marginTop: 12, marginHorizontal: 6 },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12 },
  cta: { backgroundColor: colors.amber, borderRadius: radius.btn, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaNote: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
