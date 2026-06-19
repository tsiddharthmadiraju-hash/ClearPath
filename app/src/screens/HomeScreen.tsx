import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { colors, radius, rtlText, rtlRow } from '../theme';
import { EXAMPLES } from '../examples';
import { useI18n } from '../i18n';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

interface Props {
  onPhoto: () => void;
  onUpload: () => void;
  onText: () => void;
  onExample: (key: string) => void;
  onOpenLang: () => void;
}

const METHODS = [
  { action: 'photo', symbol: '◉', symSize: 24, iconBg: '#EFF6FF', iconColor: '#1B4F72', title: 'take_photo', sub: 'take_photo_sub' },
  { action: 'upload', symbol: '↑', symSize: 24, iconBg: '#F0FDF4', iconColor: '#166534', title: 'upload_doc', sub: 'upload_doc_sub' },
  { action: 'text', symbol: 'Aa', symSize: 20, iconBg: '#FFFBEB', iconColor: '#92400E', title: 'paste_text', sub: 'paste_text_sub' },
] as const;

const CHIP_KEYS: Record<string, string> = {
  eviction: 'chip_eviction', benefits: 'chip_benefits', discharge: 'chip_discharge', school: 'chip_school', utility: 'chip_utility',
};

export function HomeScreen({ onPhoto, onUpload, onText, onExample, onOpenLang }: Props) {
  const { t, rtl, meta } = useI18n();
  const handlers: Record<string, () => void> = { photo: onPhoto, upload: onUpload, text: onText };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.appbar, rtlRow(rtl)]}>
        <Text style={styles.brandName}>ClearPath</Text>
        <Pressable style={[styles.langBtn, rtlRow(rtl)]} onPress={onOpenLang}>
          <View style={styles.globe}><Text style={styles.globeText}>G</Text></View>
          <Text style={styles.langText} numberOfLines={1}>{meta.native}</Text>
          <Text style={styles.langChev}>⌄</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.display, rtlText(rtl)]}>{t('home_headline')}</Text>
        <Text style={[styles.subhead, rtlText(rtl)]}>{t('home_subtitle')}</Text>
      </View>

      <Text style={[styles.sectionLabel, rtlText(rtl)]}>{t('how_start')}</Text>
      <View style={styles.methods}>
        {METHODS.map((m) => (
          <Pressable key={m.action} style={[styles.method, rtlRow(rtl)]} onPress={handlers[m.action]}>
            <View style={[styles.methodIcon, { backgroundColor: m.iconBg }]}>
              <Text style={{ color: m.iconColor, fontSize: m.symSize, fontWeight: '700' }}>{m.symbol}</Text>
            </View>
            <View style={styles.methodText}>
              <Text style={[styles.methodTitle, rtlText(rtl)]}>{t(m.title)}</Text>
              <Text style={[styles.methodSub, rtlText(rtl)]}>{t(m.sub)}</Text>
            </View>
            <Text style={styles.chev}>{rtl ? '‹' : '›'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionLabel, styles.sectionLabelTight, rtlText(rtl)]}>{t('try_example')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {EXAMPLES.map((e) => (
          <Pressable key={e.key} style={styles.chip} onPress={() => onExample(e.key)}>
            <Text style={styles.chipText}>{t(CHIP_KEYS[e.key] || e.key)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.privacy}>
        <Text style={styles.privacyLock}>🔒︎</Text>
        <Text style={styles.privacyText}>{t('no_data_stored')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  appbar: { alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -24, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  brandName: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: colors.navy },
  langBtn: { alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, maxWidth: 175 },
  globe: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  globeText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  langText: { fontSize: 14, fontWeight: '500', color: '#111827', flexShrink: 1 },
  langChev: { fontSize: 12, color: '#9CA3AF' },
  hero: { marginTop: 18 },
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.ink, lineHeight: 36 },
  subhead: { fontSize: 16, color: colors.muted, marginTop: 8, lineHeight: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: '#9CA3AF', marginTop: 24, marginBottom: 12 },
  sectionLabelTight: { marginTop: 20 },
  methods: { gap: 12 },
  method: { alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 18, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  methodIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  methodText: { flex: 1, gap: 2 },
  methodTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  methodSub: { fontSize: 13, color: '#6B7280' },
  chev: { fontSize: 18, color: '#D1D5DB' },
  chipScroll: { marginHorizontal: -24 },
  chipRow: { gap: 8, paddingLeft: 24, paddingRight: 24, paddingVertical: 2 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 10 },
  chipText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  privacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  privacyLock: { fontSize: 12, color: '#9CA3AF' },
  privacyText: { fontSize: 12, color: '#9CA3AF' },
});
