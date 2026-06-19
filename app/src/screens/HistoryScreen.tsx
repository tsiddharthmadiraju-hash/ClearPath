import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { colors, radius, cardShadow, rtlText, rtlRow } from '../theme';
import { useI18n } from '../i18n';
import { getHistory, deleteHistoryItem, clearAllHistory, HistoryItem } from '../services/historyService';

interface Props {
  onHome: () => void;
  onOpen: (item: HistoryItem) => void;
  onChanged?: () => void;
}

const dotColor: Record<string, string> = { high: '#16A34A', medium: '#D97706', low: '#DC2626' };

export function HistoryScreen({ onHome, onOpen, onChanged }: Props) {
  const { t, rtl } = useI18n();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    getHistory().then((x) => { setItems(x); setLoaded(true); });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const confLabel = (c: string) => (c === 'high' ? t('confident') : c === 'medium' ? t('review_recommended') : t('verify_expert'));
  const inputLabel = (it: string) => (it === 'camera' ? t('take_photo') : it === 'upload' ? t('upload_doc') : t('paste_text'));

  const confirmDelete = (item: HistoryItem) =>
    Alert.alert(t('remove_one'), undefined, [
      { text: t('keep'), style: 'cancel' },
      { text: t('confirm_remove'), style: 'destructive', onPress: async () => { await deleteHistoryItem(item.id); reload(); onChanged?.(); } },
    ]);

  const confirmClear = () =>
    Alert.alert(t('remove_all').split('{n}').join(String(items.length)), undefined, [
      { text: t('keep'), style: 'cancel' },
      { text: t('confirm_remove'), style: 'destructive', onPress: async () => { await clearAllHistory(); reload(); onChanged?.(); } },
    ]);

  if (loaded && items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>▢</Text>
        <Text style={styles.emptyTitle}>{t('history_empty_title')}</Text>
        <Text style={styles.emptyBody}>{t('history_empty_body')}</Text>
        <Pressable style={styles.cta} onPress={onHome}>
          <Text style={styles.ctaText}>{t('history_empty_cta')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.head, rtlRow(rtl)]}>
        <Text style={styles.headTitle}>{t('history_recent')}</Text>
        <Pressable onPress={confirmClear} hitSlop={8}>
          <Text style={styles.clear}>{t('clear_all')}</Text>
        </Pressable>
      </View>
      <View style={[styles.subRow, rtlRow(rtl)]}>
        <Text style={styles.lock}>🔒︎</Text>
        <Text style={styles.sub}>{t('history_stored_local')}</Text>
      </View>

      {items.map((item) => (
        <Pressable key={item.id} style={styles.card} onPress={() => onOpen(item)} onLongPress={() => confirmDelete(item)}>
          <View style={[styles.cardTop, rtlRow(rtl)]}>
            <Text style={[styles.type, rtlText(rtl)]} numberOfLines={2}>{item.document_type}</Text>
            <Text style={styles.date}>{item.date_analyzed}</Text>
          </View>
          <Text style={[styles.preview, rtlText(rtl)]} numberOfLines={2}>{item.plain_explanation}</Text>
          <View style={[styles.cardBottom, rtlRow(rtl)]}>
            <View style={[styles.conf, rtlRow(rtl)]}>
              <View style={[styles.dot, { backgroundColor: dotColor[item.confidence] || colors.muted }]} />
              <Text style={styles.confText}>{confLabel(item.confidence)}</Text>
            </View>
            <View style={[styles.meta, rtlRow(rtl)]}>
              <Text style={styles.metaText}>{item.language}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{inputLabel(item.input_type)}</Text>
            </View>
          </View>
          <Pressable style={styles.del} onPress={() => confirmDelete(item)} hitSlop={8}>
            <Text style={styles.delText}>{t('delete')}</Text>
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  head: { alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 },
  headTitle: { fontSize: 22, fontWeight: '700', color: colors.navy },
  clear: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  subRow: { alignItems: 'center', gap: 6, marginBottom: 16 },
  lock: { fontSize: 12, color: colors.faint },
  sub: { fontSize: 13, color: colors.faint },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, ...cardShadow },
  cardTop: { alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  type: { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1 },
  date: { fontSize: 12, color: colors.faint },
  preview: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: 8, marginBottom: 12 },
  cardBottom: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  conf: { alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  confText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  meta: { alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.faint },
  metaDot: { fontSize: 12, color: colors.faint },
  del: { alignSelf: 'flex-start', marginTop: 12 },
  delText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  hint: { fontSize: 12, color: colors.faint, textAlign: 'center', marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 44, color: '#D1D5DB' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 16, marginBottom: 6 },
  emptyBody: { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 20 },
  cta: { backgroundColor: colors.navy, borderRadius: radius.btn, paddingVertical: 14, paddingHorizontal: 28 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
