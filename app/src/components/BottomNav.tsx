import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useI18n } from '../i18n';

export type Tab = 'home' | 'history' | 'help';

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'home', labelKey: 'nav_home' },
  { key: 'history', labelKey: 'nav_history' },
  { key: 'help', labelKey: 'nav_help' },
];

export function BottomNav({
  active,
  dimmed,
  onChange,
  historyCount = 0,
}: {
  active: Tab;
  dimmed?: boolean;
  onChange: (tab: Tab) => void;
  historyCount?: number;
}) {
  const { t } = useI18n();
  return (
    <View style={[styles.bar, dimmed && styles.dimmed]} pointerEvents={dimmed ? 'none' : 'auto'}>
      {TABS.map((tab) => {
        const on = tab.key === active;
        const showBadge = tab.key === 'history' && historyCount > 0;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            {on ? <View style={styles.indicator} /> : null}
            <View style={styles.labelRow}>
              <Text style={[styles.label, on ? styles.labelActive : styles.labelInactive]}>{t(tab.labelKey)}</Text>
              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{historyCount > 9 ? '9+' : String(historyCount)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 64, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dimmed: { opacity: 0.4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', top: 8, width: 20, height: 3, borderRadius: 50, backgroundColor: colors.navy },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13 },
  labelActive: { color: colors.navy, fontWeight: '600' },
  labelInactive: { color: '#9CA3AF', fontWeight: '400' },
  badge: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
