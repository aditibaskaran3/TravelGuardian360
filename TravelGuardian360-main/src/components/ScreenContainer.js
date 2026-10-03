import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from './Header';
import { colors } from '../utils/constants';

export default function ScreenContainer({
  title, subtitle, onBack, right, children, scroll = true, refreshing, onRefresh, tabBar = false, header, contentStyle,
}) {
  const insets = useSafeAreaInsets();
  const bottom = tabBar ? 108 : 28;
  const top = (
    <>
      {header || (title ? <Header title={title} subtitle={subtitle} onBack={onBack} right={right} /> : null)}
    </>
  );
  if (!scroll) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {top}
        <View style={[styles.fill, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[{ paddingBottom: bottom }, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
      >
        {top}
        <View style={[styles.body, contentStyle]}>{children}</View>
      </ScrollView>
    </View>
  );
}

export const Section = ({ children, style }) => <View style={[styles.section, style]}>{children}</View>;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  body: { paddingHorizontal: 20, paddingTop: 6 },
  section: { marginBottom: 22 },
});
