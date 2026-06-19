import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { colors, radius, cardShadow, rtlText, rtlRow } from '../theme';
import { requestEscalation, EscalationResult } from '../api';
import { useI18n } from '../i18n';

function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

export function EscalationModal({
  visible,
  onClose,
  documentType,
}: {
  visible: boolean;
  onClose: () => void;
  documentType?: string;
}) {
  const { t, rtl } = useI18n();
  const [data, setData] = useState<EscalationResult | null>(null);

  useEffect(() => {
    if (visible) {
      setData(null);
      requestEscalation(documentType).then(setData);
    }
  }, [visible, documentType]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={[styles.title, rtlText(rtl)]}>{t('get_human_help')}</Text>
          <Text style={[styles.subtitle, rtlText(rtl)]}>{t('services_free')}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {(data?.resources ?? []).map((r, i) => {
              const target = r.phone ? `tel:${r.phone.replace(/[^0-9+]/g, '')}` : r.website || '#';
              return (
                <Pressable key={i} style={[styles.row, rtlRow(rtl), i === 0 && styles.rowAmber]} onPress={() => open(target)}>
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowName, rtlText(rtl)]}>{r.name}</Text>
                    <Text style={[styles.rowDesc, rtlText(rtl)]}>{r.what_they_do}</Text>
                  </View>
                  <Text style={styles.rowChev}>{rtl ? '‹' : '›'}</Text>
                </Pressable>
              );
            })}
            <Text style={styles.note}>{t('cannot_legal_advice')}</Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', justifyContent: 'flex-end' },
  sheet: { height: '90%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 },
  handle: { width: 40, height: 5, borderRadius: radius.pill, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 14 },
  close: { position: 'absolute', top: 16, right: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 15, color: colors.muted },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 6 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 8 },
  list: { marginTop: 18 },
  row: { alignItems: 'center', gap: 14, minHeight: 72, padding: 14, backgroundColor: colors.card, borderRadius: radius.card, marginBottom: 12, ...cardShadow },
  rowAmber: { backgroundColor: '#FFFAF0' },
  rowMain: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  rowDesc: { fontSize: 13, color: colors.muted, marginTop: 3 },
  rowChev: { fontSize: 24, color: '#C7CCD4' },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 14 },
});
