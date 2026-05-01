import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import api from '../../src/api';
import T from '../../src/theme';

export default function DevEarnings() {
  const [summary, setSummary] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { try { const [s, t] = await Promise.all([api.get('/developer/earnings/summary'), api.get('/developer/earnings/tasks')]); setSummary(s.data); setTasks(t.data.earnings || []); } catch {} };
  useEffect(() => { load(); }, []);

  const statusColor = (s: string) => ({ reserved: T.textMuted, pending_qa: T.risk, approved: T.success, held: T.risk, flagged: T.danger, batched: T.info, paid: T.primary }[s] || T.textMuted);

  const blocks = [
    { label: 'Pending QA', key: 'pending_qa', color: T.risk },
    { label: 'Approved', key: 'approved', color: T.success },
    { label: 'Held', key: 'held', color: T.risk },
    { label: 'Flagged', key: 'flagged', color: T.danger },
    { label: 'Batched', key: 'batched', color: T.info },
    { label: 'Paid', key: 'paid', color: T.primary },
  ];

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={T.primary} />}>
      <View testID="developer-earnings" style={s.content}>
        <Text style={s.title}>Earnings</Text>
        <View style={s.pipeline}>
          {blocks.map(b => (
            <View key={b.key} style={[s.block, { borderLeftColor: b.color }]}>
              <Text style={s.blockVal}>${summary[b.key] || 0}</Text>
              <Text style={s.blockLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
        <Text style={s.sectionTitle}>By Task</Text>
        {tasks.map((e: any) => (
          <View key={e.earning_id} style={s.taskRow}>
            <View style={s.taskInfo}>
              <Text style={s.taskName}>{e.task_title}</Text>
              <Text style={[s.taskStatus, { color: statusColor(e.status) }]}>{e.status}</Text>
            </View>
            <Text style={s.taskAmount}>${e.amount}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.md },
  title: { color: T.text, fontSize: T.h1, fontWeight: '800', marginBottom: T.lg },
  pipeline: { flexDirection: 'row', flexWrap: 'wrap', gap: T.sm, marginBottom: T.lg },
  block: { width: '48%', backgroundColor: T.surface1, borderRadius: T.radiusSm, padding: T.md, borderLeftWidth: 3, borderWidth: 1, borderColor: T.border },
  blockVal: { color: T.text, fontSize: T.h3, fontWeight: '700' },
  blockLabel: { color: T.textMuted, fontSize: T.tiny, marginTop: 2 },
  sectionTitle: { color: T.textMuted, fontSize: T.small, textTransform: 'uppercase', letterSpacing: 2, marginBottom: T.sm },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.surface1, borderRadius: T.radiusSm, padding: T.md, marginBottom: T.sm, borderWidth: 1, borderColor: T.border },
  taskInfo: { flex: 1 },
  taskName: { color: T.text, fontSize: T.body, fontWeight: '600' },
  taskStatus: { fontSize: T.tiny, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  taskAmount: { color: T.text, fontSize: T.h3, fontWeight: '700' },
});
