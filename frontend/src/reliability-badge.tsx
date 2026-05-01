/**
 * BLOCK 4.2 — Dev reliability badge.
 * Reads from same /intelligence/me or /developers/{id} endpoint
 * (reliability_score fields added in Block 4.2).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import api from './api';

type Score = {
  reliability_score: number;
  reliability_band: 'reliable' | 'normal' | 'unstable' | 'unreliable';
  consistency_score: number;
  stability_score: number;
  reassignment_penalty: number;
  responsiveness_score: number;
  active_days: number;
  idle_days: number;
  reassigned_count: number;
  assignments_count: number;
  avg_response_hours: number | null;
  response_samples: number;
  combined_score: number;
  quality_score: number;
};

const BAND: Record<string, { bg: string; fg: string; label: string }> = {
  reliable:   { bg: '#0d3a2f', fg: '#2FE6A6', label: 'RELIABLE' },
  normal:     { bg: '#1b3020', fg: '#6fd67a', label: 'NORMAL' },
  unstable:   { bg: '#3a2f1b', fg: '#f5b93a', label: 'UNSTABLE' },
  unreliable: { bg: '#3a1b1b', fg: '#ff6b6b', label: 'UNRELIABLE' },
};

function responseLabel(hours: number | null): string {
  if (hours == null) return 'no data';
  if (hours <= 1) return `fast (${hours}h)`;
  if (hours <= 6) return `prompt (${hours}h)`;
  if (hours <= 24) return `slow (${hours}h)`;
  return `delayed (${hours}h)`;
}

type Props = { developerId?: string };

export function ReliabilityBadge({ developerId }: Props) {
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const path = developerId
          ? `/intelligence/developers/${developerId}`
          : '/intelligence/me';
        const res = await api.get(path);
        setScore(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || e?.message || 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [developerId]);

  if (loading) {
    return <View style={styles.card}><ActivityIndicator color="#2FE6A6" /></View>;
  }
  // Quietly hide for non-developers (403 "Developer only") — admins/clients
  // shouldn't see a red badge in the developer surface.
  if (error || !score) {
    return null;
  }

  const band = BAND[score.reliability_band] || BAND.unstable;

  return (
    <View style={styles.card} testID="reliability-card">
      <View style={styles.header}>
        <View>
          <Text style={styles.h}>Reliability</Text>
          <Text style={styles.sub}>Behavioural predictability · 14-day window</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: band.bg }]}>
          <Text style={[styles.pillScore, { color: band.fg }]}>
            {score.reliability_score.toFixed(0)}
          </Text>
          <Text style={[styles.pillBand, { color: band.fg }]}>{band.label}</Text>
        </View>
      </View>

      <View style={styles.rows}>
        <Row label="Consistency · 35%" value={score.consistency_score}
             note={`${score.active_days}/14 days active`} />
        <Row label="Stability · 25%" value={score.stability_score}
             note={`${score.idle_days} idle days`} />
        <Row label="No reassigns · 20%" value={score.reassignment_penalty}
             note={`${score.reassigned_count}/${score.assignments_count || '—'}`} />
        <Row label="Responsiveness · 20%" value={score.responsiveness_score}
             note={responseLabel(score.avg_response_hours)} />
      </View>

      <View style={styles.combinedRow}>
        <Text style={styles.combinedLbl}>Combined score (Q×0.6 + R×0.4)</Text>
        <Text style={styles.combinedVal}>
          {score.combined_score?.toFixed(0) ?? '—'}
        </Text>
      </View>

      {score.reliability_band === 'unreliable' && (
        <Text style={styles.warn}>
          You're flagged as UNRELIABLE · likely excluded from future team suggestions.
        </Text>
      )}
      {score.reliability_band === 'reliable' && (
        <Text style={styles.good}>
          You're predictable · system trusts you with OWNER roles.
        </Text>
      )}
    </View>
  );
}

function Row({ label, value, note }: { label: string; value: number; note?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowVal}>{(pct * 100).toFixed(0)}%</Text>
      </View>
      <View style={styles.bar}>
        <View style={[
          styles.barFill,
          { width: `${pct * 100}%`,
            backgroundColor: pct > 0.7 ? '#2FE6A6' : pct > 0.4 ? '#f5b93a' : '#ff6b6b' },
        ]} />
      </View>
      {note && <Text style={styles.rowNote}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f1b1f', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2FE6A633', marginVertical: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  h: { color: '#e5f6f3', fontSize: 16, fontWeight: '700' },
  sub: { color: '#6c7a7a', fontSize: 11, marginTop: 2 },
  err: { color: '#ff6b6b', fontSize: 13 },

  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    alignItems: 'center', flexDirection: 'row', gap: 6,
  },
  pillScore: { fontSize: 20, fontWeight: '800' },
  pillBand: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  rows: { marginTop: 14, gap: 12 },
  row: {},
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowLabel: { color: '#e5f6f3', fontSize: 12, fontWeight: '600' },
  rowVal: { color: '#2FE6A6', fontSize: 12, fontWeight: '700' },
  bar: { height: 4, backgroundColor: '#1c2a2e', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4 },
  rowNote: { color: '#6c7a7a', fontSize: 10, marginTop: 3 },

  combinedRow: {
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1c2a2e',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  combinedLbl: { color: '#6c7a7a', fontSize: 11, fontWeight: '600' },
  combinedVal: { color: '#2FE6A6', fontSize: 22, fontWeight: '800' },

  warn: {
    color: '#ff6b6b', fontSize: 11, marginTop: 12, fontStyle: 'italic', lineHeight: 16,
  },
  good: { color: '#2FE6A6', fontSize: 11, marginTop: 12, fontWeight: '600' },
});

export default ReliabilityBadge;
