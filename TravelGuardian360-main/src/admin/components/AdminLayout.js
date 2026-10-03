import { t } from '../../i18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Avatar } from '../../components/Header';
import Icon from '../../components/Icon';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminService';
import { colors, radius } from '../../utils/constants';
import { ADMIN_ROUTES } from '../routes';
import { NARROW_BREAKPOINT, usePolling } from './ui';

const SIDEBAR_WIDTH = 248;
const SOS_POLL_MS = 20000;
let lastAlertCount = 0;

function useAlertCount() {
  const [count, setCount] = useState(lastAlertCount);
  const alive = useRef(true);
  const refresh = useCallback(async () => {
    try {
      const data = await adminApi.dashboard();
      lastAlertCount = data?.emergency_alerts || 0;
      if (alive.current) setCount(lastAlertCount);
    } catch {
      // The indicator keeps its previous value when the poll fails.
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  usePolling(refresh, SOS_POLL_MS);
  return count;
}

function NavItem({ route, active, badge, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ hovered }) => [styles.navItem, active && styles.navItemActive, hovered && !active && styles.navItemHover]}
    >
      <Icon name={route.icon} size={18} color={active ? colors.accent : colors.muted} />
      <Text style={[styles.navText, active && styles.navTextActive]} numberOfLines={1}>{route.title}</Text>
      {badge ? (
        <View style={styles.navBadge}>
          <Text style={styles.navBadgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Sidebar({ activeName, alertCount, onNavigate, onLogout, user }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Logo size={34} />
        <Text style={styles.brandSub}>{t('Administrator Console')}</Text>
      </View>
      <ScrollView style={styles.flex1} contentContainerStyle={styles.navList}>
        {ADMIN_ROUTES.map((route) => (
          <NavItem
            key={route.name}
            route={route}
            active={route.name === activeName}
            badge={route.name === 'AdminSOS' ? alertCount : 0}
            onPress={() => onNavigate(route.name)}
          />
        ))}
      </ScrollView>
      <View style={styles.sidebarFoot}>
        <View style={styles.adminRow}>
          <Avatar name={user?.full_name} size={34} />
          <View style={styles.flex1}>
            <Text style={styles.adminName} numberOfLines={1}>{user?.full_name || t('Administrator')}</Text>
            <Text style={styles.adminMail} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>
        <Pressable onPress={onLogout} accessibilityRole="button" style={({ hovered }) => [styles.navItem, hovered && styles.navItemHover]}>
          <Icon name="log-out" size={18} color={colors.muted} />
          <Text style={styles.navText}>{t('Logout')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminLayout({ title, subtitle, actions, children, maxWidth = 1280 }) {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const { user, logout } = useAuth();
  const alertCount = useAlertCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const narrow = width < NARROW_BREAKPOINT;

  const go = (name) => {
    setMenuOpen(false);
    if (name !== route.name) navigation.navigate(name);
  };
  const sidebar = (
    <Sidebar activeName={route.name} alertCount={alertCount} onNavigate={go} onLogout={logout} user={user} />
  );

  return (
    <View style={[styles.root, { height }]}>
      {!narrow ? sidebar : null}
      <View style={styles.main}>
        {narrow ? (
          <View style={styles.topBar}>
            <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton} accessibilityLabel={t('Open menu')}>
              <Icon name="menu" size={20} />
              {alertCount ? <View style={styles.menuDot} /> : null}
            </Pressable>
            <Logo size={28} />
            <View style={styles.flex1} />
            <Avatar name={user?.full_name} size={32} />
          </View>
        ) : null}
        <ScrollView style={styles.flex1} contentContainerStyle={[styles.content, narrow && styles.contentNarrow]}>
          <View style={[styles.inner, { maxWidth }]}>
            <View style={styles.pageHead}>
              <View style={styles.flex1}>
                <Text style={[styles.title, narrow && styles.titleNarrow]}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              {actions ? <View style={styles.actions}>{actions}</View> : null}
              {!narrow ? (
                <View style={styles.adminChip}>
                  <Avatar name={user?.full_name} size={28} />
                  <Text style={styles.adminChipText} numberOfLines={1}>{user?.full_name}</Text>
                </View>
              ) : null}
            </View>
            {children}
          </View>
        </ScrollView>
      </View>
      {narrow && menuOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} accessibilityLabel={t('Close menu')} />
          <View style={styles.drawer}>{sidebar}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', backgroundColor: colors.bg },
  flex1: { flex: 1 },
  main: { flex: 1, minWidth: 0 },
  sidebar: { width: SIDEBAR_WIDTH, alignSelf: 'stretch', backgroundColor: colors.bgDeep, borderRightWidth: 1, borderRightColor: colors.border },
  brand: { padding: 18, paddingBottom: 14, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  brandSub: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  navList: { padding: 12, gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, minHeight: 42, borderRadius: radius.sm, cursor: 'pointer' },
  navItemActive: { backgroundColor: colors.accentSoft },
  navItemHover: { backgroundColor: colors.card },
  navText: { flex: 1, color: colors.textSoft, fontSize: 14, fontWeight: '600' },
  navTextActive: { color: colors.accent },
  navBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  navBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sidebarFoot: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 },
  adminRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, paddingBottom: 6 },
  adminName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  adminMail: { color: colors.muted, fontSize: 11 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56,
    backgroundColor: colors.bgDeep, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuButton: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  menuDot: { position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger },

  content: { padding: 24, alignItems: 'center', flexGrow: 1 },
  contentNarrow: { padding: 16 },
  inner: { width: '100%' },
  pageHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  titleNarrow: { fontSize: 20 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  adminChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 200, paddingVertical: 4, paddingLeft: 4, paddingRight: 12,
    borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  adminChipText: { color: colors.textSoft, fontSize: 12, fontWeight: '600', flexShrink: 1 },

  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 50 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  drawer: { width: SIDEBAR_WIDTH, maxWidth: '85%' },
});
