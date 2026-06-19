import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { LANGUAGES, STRINGS, useI18n, setLang } from '../i18n';

export function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {/* Title in the current language, English below — so anyone can find it. */}
          <Text style={styles.title}>{t('choose_language')}</Text>
          <Text style={styles.subtitle}>{STRINGS.en.choose_language}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((L) => {
              const selected = L.code === lang;
              return (
                <Pressable
                  key={L.code}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => {
                    setLang(L.code, true);
                    onClose();
                  }}
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.native}>{L.native}</Text>
                    <Text style={styles.english}>{L.english}</Text>
                  </View>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
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
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 6 },
  list: { marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.btn, paddingVertical: 14, paddingHorizontal: 12 },
  rowSelected: { backgroundColor: colors.navySoft },
  rowMain: { gap: 2 },
  native: { fontSize: 17, fontWeight: '700', color: colors.ink },
  english: { fontSize: 13, color: colors.muted },
  check: { color: colors.navy, fontSize: 18, fontWeight: '800' },
});
