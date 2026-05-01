/**
 * BLOCK 3 — TEAM LAYER UI component.
 * Shows active team for a module: owner + executors + their share / load.
 * Works for admin/dev/client (read-only for non-admin).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import api from './api';

type Member = {
  assignment_id: string;
  developer_id: string;
  role: 'owner' | 'executor';
  allocation: number;
  responsibility: number;
  developer?: { name?: string; level?: string; rating?: number; skills?: string[] };
};

type TeamResponse = {
  module_id: string;
  module_title?: string;
  module_status?: string;
  module_price?: number;
  team: Member[];
  team_size: number;
  total_allocation: number;
  total_responsibility: number;
  has_owner: boolean;
};

type Props = {
  moduleId: string;
  canEdit?: boolean; // admin only
  onAssignPress?: () => void;
  onRemoveMember?: (assignmentId: string) => Promise<void> | void;
};

export function ModuleTeam({ moduleId, canEdit, onAssignPress, onRemoveMember }: Props) {
  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/modules/${moduleId}/team`);
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.card} testID="module-team-loading">
        <ActivityIndicator color="#2FE6A6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card} testID="module-team-error">
        <Text style={styles.err}>{error}</Text>
      </View>
    );
  }

  if (!data || data.team_size === 0) {
    return (
      <View style={styles.card} testID="module-team-empty">
        <Text style={styles.title}>Team</Text>
        <Text style={styles.empty}>No team assigned yet</Text>
        {canEdit && onAssignPress && (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={onAssignPress}
            testID="assign-team-btn"
          >
            <Text style={styles.btnPrimaryTxt}>Assign team</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card} testID={`module-team-${moduleId}`}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Team · {data.team_size} {data.team_size === 1 ? 'dev' : 'devs'}
        </Text>
        {canEdit && onAssignPress && (
          <TouchableOpacity onPress={onAssignPress} testID="team-reassign-btn">
            <Text style={styles.linkTxt}>Reassign</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sub}>
        Σ allocation {(data.total_allocation * 100).toFixed(0)}%   ·
        Σ share {(data.total_responsibility * 100).toFixed(0)}%
      </Text>

      {data.team.map((m) => (
        <View
          key={m.assignment_id}
          style={styles.row}
          testID={`team-member-${m.developer_id}`}
        >
          <View style={styles.roleChip}>
            <Text style={[
              styles.roleChipTxt,
              m.role === 'owner' && styles.roleChipOwner,
            ]}>
              {m.role === 'owner' ? 'OWNER' : 'EXEC'}
            </Text>
          </View>
          <View style={styles.rowMid}>
            <Text style={styles.name}>
              {m.developer?.name || m.developer_id}
            </Text>
            <Text style={styles.meta}>
              {m.developer?.level || 'dev'}
              {m.developer?.rating ? ` · ★${m.developer.rating}` : ''}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.share}>
              {(m.responsibility * 100).toFixed(0)}%
            </Text>
            <Text style={styles.alloc}>
              load {(m.allocation * 100).toFixed(0)}%
            </Text>
          </View>
          {canEdit && onRemoveMember && (
            <TouchableOpacity
              onPress={() => onRemoveMember(m.assignment_id)}
              style={styles.removeBtn}
              testID={`remove-member-${m.developer_id}`}
            >
              <Text style={styles.removeTxt}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {data.module_price ? (
        <Text style={styles.priceHint}>
          Module pool: ${data.module_price} · distributed across team
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f1b1f',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2FE6A633',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#e5f6f3', fontSize: 16, fontWeight: '700' },
  sub: { color: '#6c7a7a', fontSize: 12, marginTop: 4, marginBottom: 10 },
  empty: { color: '#6c7a7a', fontSize: 13, marginVertical: 10 },
  err: { color: '#ff6b6b', fontSize: 13 },
  linkTxt: { color: '#2FE6A6', fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c2a2e',
  },
  roleChip: {
    backgroundColor: '#1c2a2e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  roleChipTxt: { color: '#6c7a7a', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  roleChipOwner: { color: '#2FE6A6' },
  rowMid: { flex: 1 },
  name: { color: '#e5f6f3', fontSize: 14, fontWeight: '600' },
  meta: { color: '#6c7a7a', fontSize: 11, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', marginRight: 6 },
  share: { color: '#2FE6A6', fontSize: 14, fontWeight: '700' },
  alloc: { color: '#6c7a7a', fontSize: 10, marginTop: 2 },
  removeBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#241313',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  removeTxt: { color: '#ff6b6b', fontSize: 18, lineHeight: 20 },
  btnPrimary: {
    marginTop: 8,
    backgroundColor: '#2FE6A6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryTxt: { color: '#0a1214', fontSize: 14, fontWeight: '700' },
  priceHint: {
    color: '#6c7a7a', fontSize: 11, marginTop: 10, fontStyle: 'italic',
  },
});

export default ModuleTeam;
