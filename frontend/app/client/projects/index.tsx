// Client → Projects tab — Operator Console redesign
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/api';
import T from '../../../src/theme';
import { ScreenTitle, StatusPill, MiniProgress, EmptyState } from '../../../src/ui-client';
import { PressScale, FadeSlideIn } from '../../../src/ui';

type Project = {
  project_id: string;
  name?: string;
  title?: string;
  status?: string;
  current_stage?: string;
  progress?: number;
  production_mode?: string;
  created_at?: string;
};

type ModuleSummary = { module_id: string; project_id: string; status: string; title?: string };

const STAGE: Record<string, { label: string; tone: 'success' | 'risk' | 'info' | 'neutral' | 'danger' }> = {
  development: { label: 'In development', tone: 'info' },
  delivered:   { label: 'Delivered',      tone: 'success' },
  review:      { label: 'In review',      tone: 'risk' },
  paused:      { label: 'Paused',         tone: 'danger' },
  draft:       { label: 'Planning',       tone: 'neutral' },
};

const MODE: Record<string, string> = {
  ai:     'AI Build',
  hybrid: 'AI + Engineering',
  dev:    'Full Engineering',
};

export default function ClientProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [modulesByProject, setModulesByProject] = useState<Record<string, ModuleSummary[]>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/projects/mine');
      const list: Project[] = Array.isArray(r.data) ? r.data : [];
      setProjects(list);
      const next: Record<string, ModuleSummary[]> = {};
      await Promise.all(list.map(async (p) => {
        try {
          const w = await api.get(`/client/project/${p.project_id}/workspace`);
          next[p.project_id] = (w.data?.modules || []).map((m: any) => ({
            module_id: m.module_id,
            project_id: p.project_id,
            status: m.status,
            title: m.module_title || m.title,
          }));
        } catch { next[p.project_id] = []; }
      }));
      setModulesByProject(next);
    } catch { /* silent */ }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.primary} />}
      >
        <ScreenTitle
          title="Projects"
          subtitle={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
          testID="projects-title"
        />

        <PressScale onPress={() => router.push('/project/wizard' as any)} testID="projects-new-cta" style={s.cta}>
          <Ionicons name="add-circle" size={20} color={T.bg} />
          <Text style={s.ctaText}>Start new project</Text>
        </PressScale>

        {projects.length === 0 && (
          <EmptyState
            icon="folder-open-outline"
            title="No projects yet"
            sub='Tap "Start new project" — 4 questions, ready in 10 seconds.'
            testID="projects-empty"
          />
        )}

        {projects.map((p, i) => {
          const mods = modulesByProject[p.project_id] || [];
          const total = mods.length;
          const done = mods.filter(m => m.status === 'done' || m.status === 'completed').length;
          const inProgress = mods.filter(m => m.status === 'in_progress').length;
          const review = mods.filter(m => m.status === 'review').length;
          const paused = mods.filter(m => m.status === 'paused').length;
          const progress = p.progress ?? (total > 0 ? Math.round((done / total) * 100) : 0);
          const stage = STAGE[p.current_stage || ''] || { label: p.status || '—', tone: 'neutral' as const };
          const mode = MODE[p.production_mode || ''] || p.production_mode || '';

          return (
            <FadeSlideIn key={p.project_id} delay={i * 60}>
              <PressScale
                testID={`projects-card-${p.project_id}`}
                onPress={() => router.push(`/client/projects/${p.project_id}` as any)}
                style={s.card}
              >
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle} numberOfLines={1}>{p.name || p.title || 'Untitled project'}</Text>
                  <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
                </View>

                <View style={s.metaRow}>
                  <StatusPill tone={stage.tone} label={stage.label} dot />
                  {mode ? <Text style={s.mode}>{mode}</Text> : null}
                </View>

                <View style={{ marginTop: T.md }}>
                  <MiniProgress pct={progress} />
                </View>
                <View style={s.statsRow}>
                  <Text style={s.statsLabel}>{progress}% complete</Text>
                  <Text style={s.statsLabel}>{done}/{total} modules</Text>
                </View>

                {(inProgress + review + paused) > 0 && (
                  <View style={s.chipsRow}>
                    {inProgress > 0 && <StatusPill tone="info"   label={`${inProgress} in progress`} />}
                    {review > 0     && <StatusPill tone="risk"   label={`${review} in review`} />}
                    {paused > 0     && <StatusPill tone="danger" label={`${paused} paused`} />}
                  </View>
                )}
              </PressScale>
            </FadeSlideIn>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: T.bg },
  container: { padding: T.md, paddingBottom: 100 },

  cta: {
    backgroundColor: T.primary,
    borderRadius: T.radiusLg,
    padding: T.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    marginBottom: T.md,
  },
  ctaText: { color: T.bg, fontSize: T.body, fontWeight: '800' },

  card: {
    backgroundColor: T.surface1,
    borderWidth: 1, borderColor: T.border,
    borderRadius: T.radiusLg,
    padding: T.md,
    marginBottom: T.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: T.text, fontSize: T.h3, fontWeight: '700', flex: 1, marginRight: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  mode: { color: T.textMuted, fontSize: T.tiny, fontWeight: '600', letterSpacing: 0.4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  statsLabel: { color: T.textMuted, fontSize: T.tiny, fontWeight: '600' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: T.sm },
});
