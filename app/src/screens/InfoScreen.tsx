import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function InfoScreen({ title, body, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.state}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {ctaLabel && onCta ? (
          <Pressable style={styles.cta} onPress={onCta}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.ink, paddingVertical: 8 },
  state: { alignItems: 'center', paddingTop: 70 },
  stateTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 16, color: colors.muted, marginTop: 10, lineHeight: 24, textAlign: 'center' },
  cta: { backgroundColor: colors.amber, borderRadius: radius.btn, paddingVertical: 16, paddingHorizontal: 28, marginTop: 24 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
