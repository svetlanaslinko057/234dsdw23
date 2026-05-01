// Block 10.1 — Developer Acceptance Queue
// Минимальный экран: показать ожидающие ответа задания и принять/отклонить.
// После accept → router.push('/developer/work').

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/api';
import T from '../../src/theme';

type AcceptanceTask = {
  unit_id: string;
  title: string;
  module_id?: string;
  project_id?: string;
  project_name?: string;
  description?: string;
  estimated_hours?: number;
  reward_amount?: number;
  why_you?: string;
  deadline_minutes_remaining?: number;
  is_overdue?: boolean;
};

export default function AcceptanceQueue() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AcceptanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/developer/tasks/awaiting-response');
      setTasks(r.data?.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (t: AcceptanceTask) => {
    setBusyId(t.unit_id);
    try {
      await api.post(`/developer/tasks/${t.unit_id}/accept`);
      router.replace('/developer/work');
    } catch (e: any) {
      Alert.alert('Cannot accept', e?.response?.data?.detail || 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const decline = (t: AcceptanceTask) => {
    Alert.alert(
      'Decline task?',
      `"${t.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Overload',
          onPress: () => doDecline(t.unit_id, 'overload'),
        },
        {
          text: 'Skill mismatch',
          onPress: () => doDecline(t.unit_id, 'skill_mismatch'),
        },
        {
          text: 'Other',
          style: 'destructive',
          onPress: () => doDecline(t.unit_id, 'other'),
        },
      ],
    );
  };

  const doDecline = async (unitId: string, reasonType: string) => {
    setBusyId(unitId);
    try {
      await api.post(
        `/developer/tasks/${unitId}/decline?reason_type=${reasonType}`,
      );
      await load();
    } catch (e: any) {
      Alert.alert('Cannot decline', e?.response?.data?.detail || 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const askClarification = (t: AcceptanceTask) => {
    Alert.prompt?.(
      'Ask a question',
      `About "${t.title}"`,
      async (text) => {
        if (!text || !text.trim()) return;
        setBusyId(t.unit_id);
        try {
          await api.post(`/developer/tasks/${t.unit_id}/clarification`, {
            question: text.trim(),
          });
          await load();
          Alert.alert('Sent', 'Admin will respond shortly.');
        } catch (e: any) {
          Alert.alert(
            'Cannot send',
            e?.response?.data?.detail || 'Failed',
          );
        } finally {
          setBusyId(null);
        }
      },
    ) ?? Alert.alert('Not supported', 'Clarification works in mobile build only.');
  };

  if (loading) {
    return (
      <View style={[s.flex, s.center]}>
        <ActivityIndicator color={T.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={T.primary}
          />
        }
      >
        <View style={s.header}>
          <Text style={s.title}>Acceptance</Text>
          <View style={s.countPill} testID="acceptance-count">
            <Text style={s.countText}>{tasks.length}</Text>
          </View>
        </View>
        <Text style={s.subtitle}>
          Tasks waiting for your response
        </Text>

        {tasks.length === 0 && (
          <View style={s.empty} testID="acceptance-empty">
            <Ionicons
              name="checkmark-done-outline"
              size={32}
              color={T.textMuted}
            />
            <Text style={s.emptyText}>Nothing pending.</Text>
            <Text style={s.emptySub}>
              When admin assigns you a task, it will appear here.
            </Text>
          </View>
        )}

        {tasks.map((t) => (
          <View
            key={t.unit_id}
            style={[
              s.card,
              t.is_overdue && { borderColor: T.danger },
            ]}
            testID={`acceptance-card-${t.unit_id}`}
          >
            <View style={s.cardHeader}>
              <Text style={s.cardTitle} numberOfLines={2}>
                {t.title}
              </Text>
              {typeof t.reward_amount === 'number' && t.reward_amount > 0 && (
                <Text style={s.reward}>${t.reward_amount}</Text>
              )}
            </View>
            {t.project_name ? (
              <Text style={s.project}>{t.project_name}</Text>
            ) : null}
            {t.description ? (
              <Text style={s.desc} numberOfLines={3}>
                {t.description}
              </Text>
            ) : null}
            <View style={s.metaRow}>
              {typeof t.estimated_hours === 'number' && t.estimated_hours > 0 && (
                <Text style={s.meta}>{t.estimated_hours}h est</Text>
              )}
              {typeof t.deadline_minutes_remaining === 'number' && (
                <Text
                  style={[
                    s.meta,
                    t.is_overdue && { color: T.danger, fontWeight: '700' },
                  ]}
                >
                  {t.is_overdue
                    ? `Overdue ${Math.abs(t.deadline_minutes_remaining)}m`
                    : `Respond in ${t.deadline_minutes_remaining}m`}
                </Text>
              )}
            </View>
            {t.why_you ? (
              <Text style={s.why} numberOfLines={2}>
                Why you: {t.why_you}
              </Text>
            ) : null}

            <View style={s.actions}>
              <TouchableOpacity
                testID={`accept-btn-${t.unit_id}`}
                style={[s.btn, s.acceptBtn, busyId === t.unit_id && s.disabled]}
                disabled={busyId === t.unit_id}
                onPress={() => accept(t)}
                activeOpacity={0.85}
              >
                <Text style={s.acceptText}>
                  {busyId === t.unit_id ? '…' : 'Accept'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`decline-btn-${t.unit_id}`}
                style={[s.btn, s.declineBtn]}
                disabled={busyId === t.unit_id}
                onPress={() => decline(t)}
                activeOpacity={0.85}
              >
                <Text style={s.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`ask-btn-${t.unit_id}`}
                style={[s.btn, s.askBtn]}
                disabled={busyId === t.unit_id}
                onPress={() => askClarification(t)}
                activeOpacity={0.85}
              >
                <Text style={s.askText}>Ask</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: T.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: T.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { color: T.text, fontSize: T.h2 ?? 24, fontWeight: '800' },
  subtitle: { color: T.textMuted, fontSize: 12, marginBottom: T.lg },
  countPill: {
    backgroundColor: T.primary,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  countText: { color: '#000', fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', padding: 32, marginTop: 32 },
  emptyText: { color: T.text, marginTop: 12, fontWeight: '700' },
  emptySub: { color: T.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: T.surface1,
    borderRadius: 12,
    padding: T.md,
    marginBottom: T.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { color: T.text, fontWeight: '700', fontSize: 15, flex: 1 },
  reward: { color: T.primary, fontWeight: '800', fontSize: 14 },
  project: { color: T.textSecondary, fontSize: 12, marginTop: 2 },
  desc: { color: T.textMuted, fontSize: 12, marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  meta: { color: T.textMuted, fontSize: 11 },
  why: { color: T.info, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  disabled: { opacity: 0.5 },
  acceptBtn: { backgroundColor: T.primary, borderColor: T.primary },
  acceptText: { color: '#000', fontWeight: '800', fontSize: 13 },
  declineBtn: { backgroundColor: 'transparent', borderColor: T.danger },
  declineText: { color: T.danger, fontWeight: '700', fontSize: 13 },
  askBtn: { backgroundColor: T.surface3, borderColor: T.border },
  askText: { color: T.text, fontWeight: '700', fontSize: 13 },
});
