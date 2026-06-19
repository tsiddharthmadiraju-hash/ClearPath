import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, radius } from '../theme';
import { useI18n } from '../i18n';

export function ProcessingScreen() {
  const { t } = useI18n();
  const progress = useRef(new Animated.Value(0.1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 0.9, duration: 8000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, pulse]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulse, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.status}>{t('processing_status')}</Text>
      <Text style={styles.sub}>{t('processing_title')}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 60 },
  pulse: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.iconBlue },
  status: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 24, textAlign: 'center' },
  sub: { fontSize: 15, color: colors.muted, marginTop: 12, textAlign: 'center' },
  track: { width: 200, height: 4, backgroundColor: colors.line, borderRadius: radius.pill, marginTop: 24, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.amber, borderRadius: radius.pill },
});
