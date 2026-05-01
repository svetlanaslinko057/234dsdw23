import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './auth';
import { useMe } from './use-me';
import { resolveUserEntry } from './resolve-entry';
import AlertsSheet, { useAlerts } from './alerts-sheet';
import T from './theme';

/**
 * AppHeader — context-aware top bar.
 *
 * Visitor & lead screens (index, auth, estimate-*, lead/*):
 *   • brand only (EVA-X wordmark)
 *   • NO screen title (doesn't call itself "Home")
 *   • NO login button (each visitor screen has its own small inline login link)
 *
 * Authed role cabinets (client/*, developer/*, admin/*):
 *   • brand + avatar (account menu entry point)
 *   • screen title in the middle
 *
 * Authed L0 surfaces (hub/workspace/etc):
 *   • brand + avatar + title
 */
const TITLES: Record<string, string> = {
  hub: 'Home',
  work: 'Work',
  activity: 'Activity',
  inbox: 'Inbox',
  profile: 'Profile',
  auth: '',              // intentionally empty — auth is a visitor surface
  gateway: 'Welcome',
  operator: 'Operator',
  workspace: 'Workspace',
  project: 'Project',
  // Role cabinets are shells, not pages. The active tab is the title — header
  // must stay clean (EVA-X · avatar). Do NOT add client/developer/admin here.
  client: '',
  developer: '',
  admin: '',
  lead: '',              // lead workspace has its own big heading
};

// Role cabinets where we also suppress the context badge (CLIENT / DEV / ADMIN).
// The avatar carries the account context — a second badge is duplicate noise.
const ROLE_CABINETS = new Set(['client', 'developer', 'admin']);

// Segments that belong to the unauthed "visitor / lead" surfaces.
// On these we show a bare header: brand only, no title, no Login button.
// The visitor screens each have their own inline login link.
const VISITOR_SEGMENTS = new Set([
  '',          // `/` — index.tsx
  'index',
  'welcome',   // welcome surface — bare header (brand only, no title, no icons)
  'auth',
  'estimate-result',
  'estimate-improve',
  'lead',
]);

function titleFor(seg: string): string {
  if (!seg) return '';
  if (seg in TITLES) return TITLES[seg];
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

function contextBadge(me: any): string | null {
  const active = me?.active_context;
  if (!active) return null;
  return String(active).toUpperCase();
}

export default function AppHeader() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { me } = useMe();

  const firstSeg = (segments[0] || '') as string;
  const isVisitorSurface = !user && VISITOR_SEGMENTS.has(firstSeg);
  const isRoleCabinet = ROLE_CABINETS.has(firstSeg);
  const title = useMemo(() => (isVisitorSurface ? '' : titleFor(firstSeg)), [firstSeg, isVisitorSurface]);
  // Hide the context badge (CLIENT / DEV / ADMIN) on role cabinets — the active
  // tab + avatar already carry that context. Keep it on L0 surfaces (hub, work,
  // activity, inbox) where the user has multiple roles and might forget which
  // hat they're wearing.
  const badge = !isRoleCabinet ? contextBadge(me) : null;

  const onBrand = () => {
    if (user && me) router.push(resolveUserEntry(me) as any);
    else router.push('/' as any);
  };
  // Avatar removed from header. Per spec, the right side carries only the
  // bell + chat icons. Profile lives inside the role's tab bar (one place).
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { count: alertsCount } = useAlerts();

  const onChat = () => router.push('/chat' as any);

  return (
    <View
      testID="app-header"
      style={[s.container, { paddingTop: Math.max(insets.top, 8) }]}
    >
      <View style={s.row}>
        <TouchableOpacity
          testID="app-header-brand"
          style={s.brandWrap}
          onPress={onBrand}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/images/evax-logo.png')}
            style={s.brandImg}
            resizeMode="contain"
            accessibilityLabel="EVA-X"
          />
        </TouchableOpacity>

        <View style={s.titleWrap}>
          {title ? <Text style={s.title} numberOfLines={1}>{title}</Text> : null}
          {badge && !isVisitorSurface ? (
            <View testID="app-header-context-badge" style={s.badge}>
              <Text style={s.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        {/* Right side: bell + chat for authed users. Muted outline style
            to match the bottom tab bar — avoid competing with content. */}
        <View style={s.rightSide}>
          {!isVisitorSurface ? (
            <>
              <TouchableOpacity
                testID="app-header-alerts"
                onPress={() => setAlertsOpen(true)}
                activeOpacity={0.7}
                style={s.iconBtn}
              >
                <Ionicons name="notifications-outline" size={22} color={T.textSecondary} />
                {alertsCount > 0 ? (
                  <View testID="app-header-alerts-badge" style={s.badgeDot}>
                    <Text style={s.badgeDotText}>{alertsCount > 9 ? '9+' : alertsCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                testID="app-header-chat"
                onPress={onChat}
                activeOpacity={0.7}
                style={s.iconBtn}
              >
                <Ionicons name="chatbubble-outline" size={22} color={T.textSecondary} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      <AlertsSheet visible={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(11,15,20,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  row: {
    height: 48,
    paddingHorizontal: T.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: { minWidth: 72, height: 32, justifyContent: 'center' },
  brand: { color: T.primary, fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  brandImg: { width: 100, height: 24 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { color: T.text, fontSize: T.body, fontWeight: '700' },
  badge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: T.primary + '22',
    borderWidth: 1, borderColor: T.primary + '55',
  },
  badgeText: { color: T.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  rightSide: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { padding: 4, position: 'relative' },
  badgeDot: {
    position: 'absolute', top: -2, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: T.danger,
    paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  rightBtn: { minWidth: 72, alignItems: 'flex-end', justifyContent: 'center' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: T.text, fontSize: 13, fontWeight: '800' },
});
