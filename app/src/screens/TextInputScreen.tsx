import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, radius, cardShadow, rtlText, rtlRow } from '../theme';
import { useI18n } from '../i18n';

interface Props {
  onBack: () => void;
  onSubmit: (text: string, location: string) => void;
}

export function TextInputScreen({ onBack, onSubmit }: Props) {
  const { t, rtl } = useI18n();
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.topbar, rtlRow(rtl)]}>
          <Pressable style={styles.back} onPress={onBack} hitSlop={8}>
            <Text style={styles.backChev}>{rtl ? '›' : '‹'}</Text>
          </Pressable>
          <Text style={styles.title}>{t('paste_title')}</Text>
        </View>

        <TextInput
          style={[styles.textarea, rtlText(rtl)]}
          multiline
          placeholder={t('textarea_ph')}
          placeholderTextColor={colors.faint}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        <TextInput
          style={[styles.textfield, rtlText(rtl)]}
          placeholder={t('city_ph')}
          placeholderTextColor={colors.faint}
          value={location}
          onChangeText={setLocation}
        />

        <Pressable style={[styles.btn, !text.trim() && styles.btnDisabled]} disabled={!text.trim()} onPress={() => onSubmit(text.trim(), location.trim())}>
          <Text style={styles.btnText}>{t('explain_btn')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  topbar: { alignItems: 'center', gap: 10, paddingVertical: 8, marginBottom: 8 },
  back: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...cardShadow },
  backChev: { fontSize: 22, color: colors.navy, lineHeight: 24 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  textarea: { minHeight: 240, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, fontSize: 16, lineHeight: 22, color: colors.ink, ...cardShadow },
  textfield: { marginTop: 12, backgroundColor: colors.card, borderRadius: radius.btn, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.ink, ...cardShadow },
  btn: { marginTop: 16, backgroundColor: colors.navy, borderRadius: radius.btn, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
