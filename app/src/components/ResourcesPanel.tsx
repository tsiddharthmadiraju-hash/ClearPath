import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import type { Resource } from '../types';
import { colors, radius, cardShadow, rtlText, rtlRow } from '../theme';
import { useI18n } from '../i18n';

function dial(phone: string) {
  Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {});
}

function ResourceCard({ r }: { r: Resource }) {
  const { t, rtl } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.card}>
      <Text style={[styles.name, rtlText(rtl)]}>{r.name}</Text>
      {r.what_they_do ? <Text style={[styles.desc, rtlText(rtl)]}>{r.what_they_do}</Text> : null}
      {r.phone ? (
        <Pressable onPress={() => dial(r.phone as string)} hitSlop={6}>
          <Text style={[styles.phone, rtlText(rtl)]}>{r.phone}</Text>
        </Pressable>
      ) : null}
      {r.call_script ? (
        <>
          <Pressable style={[styles.toggle, rtlRow(rtl)]} onPress={() => setOpen((o) => !o)}>
            <Text style={styles.toggleText}>{t('what_to_say')}</Text>
            <Text style={styles.toggleChev}>{open ? '⌄' : rtl ? '‹' : '›'}</Text>
          </Pressable>
          {open ? <Text style={[styles.script, rtlText(rtl)]}>“{r.call_script}”</Text> : null}
        </>
      ) : null}
    </View>
  );
}

export function ResourcesPanel({ resources }: { resources: Resource[] }) {
  const { t, rtl } = useI18n();
  if (!resources.length) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.label, rtlText(rtl)]}>{t('who_can_help')}</Text>
      {resources.map((r, i) => (
        <ResourceCard key={i} r={r} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginBottom: 12, marginHorizontal: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, marginBottom: 12, ...cardShadow },
  name: { fontSize: 16, fontWeight: '800', color: colors.ink },
  desc: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  phone: { fontSize: 19, fontWeight: '800', color: colors.navy, paddingTop: 12, paddingBottom: 6 },
  toggle: { alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.navySoft, borderRadius: radius.btn, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  toggleText: { fontSize: 14, fontWeight: '700', color: colors.navy },
  toggleChev: { fontSize: 16, fontWeight: '800', color: colors.navy },
  script: { fontSize: 15, color: '#1F2937', fontStyle: 'italic', lineHeight: 23, paddingTop: 12, paddingHorizontal: 4 },
});
