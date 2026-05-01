/**
 * Phase 5 — Developer Wallet & Withdraw.
 *
 *  available  → can withdraw now
 *  pending    → already requested, waiting on admin
 *  withdrawn  → lifetime sent out
 *  earned     → lifetime credited from approved modules
 *
 * Earnings arrive ONLY when client_approve_module flips a module → done.
 * Never from time logs / hours.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, TextInput, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';
import T from '../../src/theme';

type WalletHistoryItem = {
  log_id: string;
  module_id: string;
  project_id?: string;
  amount: number;
  reason: string;
  created_at: string;
};
type Wallet = {
  user_id: string;
  earned_lifetime: number;
  available_balance: number;
  pending_withdrawal: number;
  withdrawn_lifetime: number;
  history: WalletHistoryItem[];
};
type Withdrawal = {
  withdrawal_id: string;
  amount: number;
  status: 'requested' | 'approved' | 'paid' | 'rejected' | string;
  method?: string;
  destination?: string;
  created_at: string;
  paid_at?: string | null;
};

const fmt = (n: number) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const dateStr = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

export default function DeveloperWalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [method, setMethod] = useState<'bank' | 'crypto' | 'manual'>('bank');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, list] = await Promise.all([
        api.get('/developer/wallet'),
        api.get('/developer/withdrawals'),
      ]);
      setWallet(w.data);
      setWithdrawals(Array.isArray(list.data) ? list.data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid amount'); return; }
    if (wallet && amt > wallet.available_balance + 0.001) {
      Alert.alert('Insufficient balance', `Available: ${fmt(wallet.available_balance)}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/developer/withdraw', { amount: amt, method, destination });
      setOpen(false); setAmount(''); setDestination('');
      await load();
      Alert.alert('Withdraw requested', 'Admin will approve and pay out shortly.');
    } catch (e: any) {
      Alert.alert('Request failed', e?.response?.data?.detail || 'Try again');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return <SafeAreaView style={[s.flex, s.center]}><ActivityIndicator color={T.primary} /></SafeAreaView>;
  }
  const w = wallet || { earned_lifetime: 0, available_balance: 0, pending_withdrawal: 0, withdrawn_lifetime: 0, history: [], user_id: '' };

  return (
    <SafeAreaView style={s.flex} edges={['top']} testID="dev-wallet-screen">
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.primary} />}
      >
        <Text style={s.h1}>Wallet</Text>
        <Text style={s.subhead}>You earn when a module is approved by the client.</Text>

        {/* Hero — Available */}
        <View style={s.hero} testID="wallet-hero">
          <Text style={s.heroLabel}>AVAILABLE TO WITHDRAW</Text>
          <Text style={s.heroAmount} testID="wallet-available">{fmt(w.available_balance)}</Text>
          <TouchableOpacity
            disabled={w.available_balance <= 0}
            onPress={() => setOpen(true)}
            style={[s.cta, w.available_balance <= 0 && { opacity: 0.5 }]}
            testID="wallet-withdraw-btn"
          >
            <Ionicons name="arrow-up-circle" size={18} color="#0B0F14" />
            <Text style={s.ctaText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Stats grid */}
        <View style={s.statRow}>
          <Stat label="Pending" value={fmt(w.pending_withdrawal)} sub="In admin queue" testID="wallet-pending" />
          <Stat label="Earned" value={fmt(w.earned_lifetime)} sub="Lifetime" testID="wallet-earned" />
          <Stat label="Withdrawn" value={fmt(w.withdrawn_lifetime)} sub="Lifetime" testID="wallet-withdrawn" />
        </View>

        {/* Withdrawals history */}
        <Text style={s.sectionLabel}>WITHDRAWAL REQUESTS</Text>
        {withdrawals.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>No withdrawals yet</Text></View>
        ) : (
          withdrawals.map((wd) => (
            <View key={wd.withdrawal_id} style={s.row} testID={`withdrawal-row-${wd.withdrawal_id}`}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{fmt(wd.amount)}</Text>
                <Text style={s.rowMeta}>
                  {dateStr(wd.created_at)} · {wd.method || 'manual'}
                </Text>
              </View>
              <Pill status={wd.status} />
            </View>
          ))
        )}

        {/* Earnings history */}
        <Text style={s.sectionLabel}>EARNINGS HISTORY</Text>
        {w.history.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>No earnings yet — finish + approve a module to get paid</Text></View>
        ) : (
          w.history.map((h) => (
            <View key={h.log_id} style={s.row} testID={`earning-row-${h.log_id}`}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>+{fmt(h.amount)}</Text>
                <Text style={s.rowMeta}>{dateStr(h.created_at)} · {h.reason.replace(/_/g, ' ')}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#2FE6A6" />
            </View>
          ))
        )}
      </ScrollView>

      {/* Withdraw modal */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalCard} testID="withdraw-modal">
            <Text style={s.modalTitle}>Withdraw funds</Text>
            <Text style={s.modalSub}>Available: {fmt(w.available_balance)}</Text>

            <Text style={s.inputLabel}>AMOUNT</Text>
            <TextInput
              testID="withdraw-amount-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={T.textMuted}
              style={s.input}
            />

            <Text style={s.inputLabel}>METHOD</Text>
            <View style={s.methodRow}>
              {(['bank', 'crypto', 'manual'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMethod(m)}
                  style={[s.methodChip, method === m && s.methodChipActive]}
                  testID={`withdraw-method-${m}`}
                >
                  <Text style={[s.methodChipText, method === m && s.methodChipTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.inputLabel}>{method === 'crypto' ? 'WALLET ADDRESS' : 'IBAN / DESTINATION'}</Text>
            <TextInput
              testID="withdraw-destination-input"
              value={destination}
              onChangeText={setDestination}
              placeholder={method === 'crypto' ? '0x…' : 'IBAN UA00…'}
              placeholderTextColor={T.textMuted}
              autoCapitalize="characters"
              style={s.input}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={s.btnGhost}
                testID="withdraw-cancel"
              >
                <Text style={s.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submit}
                disabled={submitting}
                style={[s.cta, { flex: 1 }]}
                testID="withdraw-submit"
              >
                {submitting
                  ? <ActivityIndicator color="#0B0F14" />
                  : <Text style={s.ctaText}>Request withdraw</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value, sub, testID }: { label: string; value: string; sub: string; testID?: string }) {
  return (
    <View style={s.statCard} testID={testID}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

function Pill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    requested: { bg: '#F59E0B22', color: '#F59E0B', label: 'Requested' },
    approved:  { bg: '#3B82F622', color: '#3B82F6', label: 'Approved' },
    paid:      { bg: '#2FE6A622', color: '#2FE6A6', label: 'Paid' },
    rejected:  { bg: '#EF444422', color: '#EF4444', label: 'Rejected' },
  };
  const it = map[status] || { bg: T.surface2, color: T.textMuted, label: status };
  return (
    <View style={[s.pill, { backgroundColor: it.bg }]}>
      <Text style={[s.pillText, { color: it.color }]}>{it.label.toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: T.lg, paddingBottom: T.xl * 2 },

  h1: { color: T.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subhead: { color: T.textMuted, fontSize: T.body, marginTop: 4, marginBottom: T.lg },

  hero: {
    backgroundColor: T.surface1, borderRadius: T.radius,
    borderWidth: 1, borderColor: T.border,
    padding: T.lg, marginBottom: T.md, alignItems: 'center',
  },
  heroLabel: { color: T.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  heroAmount: { color: T.text, fontSize: 48, fontWeight: '800', letterSpacing: -1.2, marginVertical: 8 },

  cta: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.primary, borderRadius: T.radiusSm, paddingVertical: 14, paddingHorizontal: 28,
    marginTop: 6,
  },
  ctaText: { color: '#0B0F14', fontWeight: '800', fontSize: T.body },

  statRow: { flexDirection: 'row', gap: 8, marginBottom: T.lg },
  statCard: { flex: 1, backgroundColor: T.surface1, borderRadius: T.radiusSm, padding: T.sm, borderWidth: 1, borderColor: T.border },
  statLabel: { color: T.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  statValue: { color: T.text, fontSize: T.h3, fontWeight: '800', marginTop: 4 },
  statSub: { color: T.textMuted, fontSize: T.tiny, marginTop: 2 },

  sectionLabel: { color: T.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: T.lg, marginBottom: T.sm },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.surface1, borderRadius: T.radiusSm,
    padding: T.sm, marginBottom: 6, borderWidth: 1, borderColor: T.border,
  },
  rowTitle: { color: T.text, fontSize: T.body, fontWeight: '700' },
  rowMeta: { color: T.textMuted, fontSize: T.tiny, marginTop: 2 },

  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  emptyCard: {
    backgroundColor: T.surface1, borderRadius: T.radiusSm, padding: T.md,
    borderWidth: 1, borderColor: T.border, alignItems: 'center',
  },
  emptyText: { color: T.textMuted, fontSize: T.small },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: T.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: T.lg, paddingBottom: T.xl,
    borderTopWidth: 1, borderColor: T.border,
  },
  modalTitle: { color: T.text, fontSize: T.h2, fontWeight: '800' },
  modalSub: { color: T.textMuted, fontSize: T.small, marginTop: 4, marginBottom: T.lg },
  inputLabel: { color: T.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6, marginTop: T.sm },
  input: {
    backgroundColor: T.surface1, color: T.text, fontSize: T.h3, fontWeight: '700',
    borderRadius: T.radiusSm, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: T.border,
  },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodChip: {
    flex: 1, paddingVertical: 10, borderRadius: T.radiusSm,
    backgroundColor: T.surface1, borderWidth: 1, borderColor: T.border, alignItems: 'center',
  },
  methodChipActive: { backgroundColor: T.primary, borderColor: T.primary },
  methodChipText: { color: T.textMuted, fontWeight: '800', fontSize: T.tiny, letterSpacing: 1 },
  methodChipTextActive: { color: '#0B0F14' },

  modalActions: { flexDirection: 'row', gap: 8, marginTop: T.lg },
  btnGhost: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: T.radiusSm, borderWidth: 1, borderColor: T.border },
  btnGhostText: { color: T.text, fontWeight: '700' },
});
