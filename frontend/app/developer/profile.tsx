/**
 * Developer Profile — root tab
 *
 * Strict per-spec layout:
 *   [ Identity: avatar, name/email, role badge ]
 *   [ Roles → switch to client (if multi-role) ]
 *   [ Wallet shortcut: balance + Withdraw ]
 *   [ Account: Settings, Time Logs, Sign out ]
 *
 * No leaderboard, growth, feedback, etc. Those return only when their
 * backend data is real and stable. Until then, profile stays clean.
 */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/theme';
import api from '../../src/api';
import { useMe } from '../../src/use-me';
import { useAuth } from '../../src/auth';

type Wallet = {
  available_balance?: number;
  pending_withdrawal?: number;
  withdrawn_lifetime?: number;
};

const ROLE_META: Record<string, { label: string; color: string; icon: any }> = {
  developer: { label: 'Developer', color: T.primary, icon: 'code-slash' },
  client:    { label: 'Client',    color: T.primary, icon: 'briefcase' },
  admin:     { label: 'Admin',     color: T.role,    icon: 'shield-checkmark' },
};

export default function DeveloperProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const { me, refresh } = useMe();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/developer/wallet');
        setWallet(r.data);
      } catch {
        /* keep null */
      } finally {
        setWalletLoading(false);
      }
    })();
  }, []);

  const switchContext = async (ctx: string) => {
    try {
      setSwitching(ctx);
      await api.post('/me/context', { context: ctx });
      await refresh();
      if (ctx === 'client') router.replace('/client/home' as any);
      else if (ctx === 'admin') router.replace('/admin/home' as any);
    } catch (e: any) {
      Alert.alert('Switch failed', e?.response?.data?.detail || String(e));
    } finally {
      setSwitching(null);
    }
  };

  const doLogout = async () => {
    await logout();
    router.replace('/' as any);
  };

  const initial = (me?.name || me?.email || 'U').trim().charAt(0).toUpperCase();
  const states: string[] = me?.states || [];
  const otherRoles = states.filter((r) => r !== 'developer');
  const available = wallet?.available_balance ?? 0;
  const pending = wallet?.pending_withdrawal ?? 0;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} testID="developer-profile">
      {/* IDENTITY */}
      <View style={s.identityCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <Text style={s.name}>{me?.name || 'You'}</Text>
        {!!me?.email && <Text style={s.email}>{me.email}</Text>}
        <View style={s.roleBadge}>
          <Ionicons name={ROLE_META.developer.icon} size={12} color={T.primary} />
          <Text style={s.roleBadgeText}>Developer</Text>
        </View>
      </View>

      {/* WALLET shortcut */}
      <Text style={s.section}>Wallet</Text>
      <View style={s.walletCard}>
        {walletLoading ? (
          <ActivityIndicator color={T.primary} />
        ) : (
          <>
            <View style={s.walletTop}>
              <View>
                <Text style={s.walletLabel}>Available</Text>
                <Text style={s.walletValue}>${available.toFixed(2)}</Text>
              </View>
              {pending > 0 && (
                <View style={s.pendingPill}>
                  <Text style={s.pendingText}>${pending.toFixed(2)} pending</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              testID="profile-withdraw-btn"
              style={[s.cta, available <= 0 && s.ctaDisabled]}
              onPress={() => router.push('/developer/wallet' as any)}
              disabled={available <= 0}
            >
              <Ionicons name="arrow-down-circle" size={16} color="#0B0F14" />
              <Text style={s.ctaText}>Withdraw</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ROLES — only when user has more than one */}
      {otherRoles.length > 0 && (
        <>
          <Text style={s.section}>Roles</Text>
          {otherRoles.map((r) => {
            const meta = ROLE_META[r];
            if (!meta) return null;
            return (
              <TouchableOpacity
                key={r}
                testID={`profile-switch-${r}`}
                style={s.row}
                onPress={() => switchContext(r)}
                disabled={!!switching}
              >
                <View style={[s.rowIcon, { backgroundColor: `${meta.color}22` }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>Switch to {meta.label}</Text>
                  <Text style={s.rowSub}>You also have access as {meta.label.toLowerCase()}</Text>
                </View>
                {switching === r ? (
                  <ActivityIndicator color={T.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* DEVELOPER INSIGHTS — projection of the economy */}
      <Text style={s.section}>Developer insights</Text>
      <TouchableOpacity
        testID="profile-leaderboard"
        style={s.row}
        onPress={() => router.push('/developer/leaderboard' as any)}
      >
        <View style={s.rowIconNeutral}>
          <Ionicons name="trophy-outline" size={18} color={T.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>Leaderboard</Text>
          <Text style={s.rowSub}>Where you stand among developers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        testID="profile-growth"
        style={s.row}
        onPress={() => router.push('/developer/growth' as any)}
      >
        <View style={s.rowIconNeutral}>
          <Ionicons name="trending-up-outline" size={18} color={T.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>Growth</Text>
          <Text style={s.rowSub}>How close you are to the next tier</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
      </TouchableOpacity>

      {/* ACCOUNT */}
      <Text style={s.section}>Account</Text>
      <TouchableOpacity
        testID="profile-settings"
        style={s.row}
        onPress={() => router.push('/settings' as any)}
      >
        <View style={s.rowIconNeutral}>
          <Ionicons name="settings-outline" size={18} color={T.text} />
        </View>
        <Text style={s.rowLabel}>Settings</Text>
        <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        testID="profile-time-logs"
        style={s.row}
        onPress={() => router.push('/developer/time-logs' as any)}
      >
        <View style={s.rowIconNeutral}>
          <Ionicons name="time-outline" size={18} color={T.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>Time logs</Text>
          <Text style={s.rowSub}>Hours across your tasks</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity
        testID="profile-logout"
        style={s.logoutBtn}
        onPress={doLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={T.danger} />
        <Text style={s.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.lg, paddingBottom: T.xl * 2 },
  section: {
    color: T.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginTop: T.lg, marginBottom: T.sm, paddingHorizontal: 4,
  },
  identityCard: {
    alignItems: 'center',
    paddingVertical: T.xl,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(47,230,166,0.15)',
    borderWidth: 1, borderColor: 'rgba(47,230,166,0.45)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: T.md,
  },
  avatarText: { color: T.primary, fontSize: 32, fontWeight: '900' },
  name: { color: T.text, fontSize: 22, fontWeight: '800' },
  email: { color: T.textMuted, fontSize: 13, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(47,230,166,0.10)',
    borderColor: 'rgba(47,230,166,0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    marginTop: T.sm,
  },
  roleBadgeText: { color: T.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  walletCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1, borderColor: 'rgba(47,230,166,0.30)',
    padding: T.md,
  },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.md },
  walletLabel: { color: T.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  walletValue: { color: T.primary, fontSize: 28, fontWeight: '900', marginTop: 2 },
  pendingPill: {
    backgroundColor: 'rgba(245,196,81,0.10)',
    borderWidth: 1, borderColor: 'rgba(245,196,81,0.35)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  pendingText: { color: T.risk, fontSize: 11, fontWeight: '700' },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: T.primary,
    paddingVertical: 12, borderRadius: T.radius,
  },
  ctaDisabled: { backgroundColor: 'rgba(47,230,166,0.35)' },
  ctaText: { color: '#0B0F14', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: T.md,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1, borderColor: T.border,
    padding: T.md,
    marginBottom: T.sm,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconNeutral: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: T.bg,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { color: T.text, fontSize: 14, fontWeight: '600', flex: 1 },
  rowSub: { color: T.textMuted, fontSize: 12, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: T.lg,
    paddingVertical: 14,
    borderRadius: T.radius,
    borderWidth: 1, borderColor: T.border,
  },
  logoutText: { color: T.danger, fontSize: 14, fontWeight: '700' },
});
