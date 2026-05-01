/**
 * Admin · Workflow — operational core.
 *
 * Shows ALL active/pending modules with status, risk, developer, project.
 * Admin can review, approve, send to revision, reject, or open deep detail.
 *
 * Source: GET /api/admin/modules  (existing endpoint)
 * Fallback: GET /api/modules
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { API } from '@/App';
import axios from 'axios';
import {
  Search, RefreshCw, CheckCircle2, RotateCw, XCircle, AlertTriangle, User, FolderKanban, Filter,
} from 'lucide-react';

const STATUS_COLORS = {
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  qa_pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function AdminV2Workflow() {
  const [modules, setModules] = useState([]);
  const [devs, setDevs] = useState({});
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      // Load projects + users for enrichment
      const [projectsR, usersR] = await Promise.all([
        axios.get(`${API}/admin/projects`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/users`, { withCredentials: true }).catch(() => ({ data: [] })),
      ]);
      const projectsList = Array.isArray(projectsR.data) ? projectsR.data : projectsR.data?.projects || [];
      const usersList = Array.isArray(usersR.data) ? usersR.data : usersR.data?.users || [];

      const projMap = {};
      projectsList.forEach((p) => { projMap[p.project_id] = p.name || p.title || 'Project'; });
      const devMap = {};
      usersList.forEach((u) => { devMap[u.user_id] = u.name || u.email || 'User'; });

      // Fetch modules per project in parallel
      const moduleResponses = await Promise.all(
        projectsList.map((p) =>
          axios
            .get(`${API}/admin/projects/${p.project_id}/modules`, { withCredentials: true })
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.modules || []))
            .catch(() => [])
        )
      );
      const mods = moduleResponses.flat();

      setDevs(devMap);
      setProjects(projMap);
      setModules(mods);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((m) => {
      if (filter === 'qa' && !['review', 'qa_pending'].includes(m.status)) return false;
      if (filter === 'active' && !['in_progress', 'pending'].includes(m.status)) return false;
      if (filter === 'blocked' && m.status !== 'blocked') return false;
      if (filter === 'done' && !['completed', 'rejected'].includes(m.status)) return false;
      if (!q) return true;
      const dev = devs[m.assigned_to] || '';
      const proj = projects[m.project_id] || '';
      return [m.title, m.module_id, dev, proj].filter(Boolean).some(
        (s) => s.toLowerCase().includes(q)
      );
    });
  }, [modules, filter, search, devs, projects]);

  const qaAction = async (moduleId, action) => {
    setBusy(`${moduleId}:${action}`);
    try {
      await axios.post(`${API}/admin/mobile/qa/${moduleId}/${action}`, {}, { withCredentials: true });
      await load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (e?.response?.status === 409) {
        const msg = typeof detail === 'object'
          ? `${detail.message} (${detail.current_status})`
          : 'Already decided';
        alert(`Already decided: ${msg}`);
        load();
      } else {
        alert(`Action failed: ${typeof detail === 'string' ? detail : 'error'}`);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="admin-workflow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow</h1>
          <p className="text-sm text-muted-foreground mt-1">All modules · QA · blocks · reassign</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter + search */}
      <div className="flex gap-3 mb-4" data-testid="workflow-filters">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {[
            { k: 'all', l: 'All' },
            { k: 'qa', l: 'QA queue' },
            { k: 'active', l: 'Active' },
            { k: 'blocked', l: 'Blocked' },
            { k: 'done', l: 'Done' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              data-testid={`filter-${f.k}`}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                filter === f.k ? 'bg-emerald-500 text-black font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, dev, project…"
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm"
            data-testid="workflow-search"
          />
        </div>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{err}</p>
        </div>
      )}

      {loading && <div className="text-center py-12 text-muted-foreground">Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-lg font-bold">No modules match</p>
          <p className="text-sm text-muted-foreground mt-1">Try another filter or clear search.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((m) => {
          const isQA = ['review', 'qa_pending'].includes(m.status);
          const dev = devs[m.assigned_to] || '—';
          const proj = projects[m.project_id] || '—';
          const statusClass = STATUS_COLORS[m.status] || 'bg-muted text-muted-foreground border-border';
          return (
            <div
              key={m.module_id}
              className="bg-card border border-border rounded-xl p-4"
              data-testid={`module-card-${m.module_id}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{m.title || 'Module'}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded border ${statusClass}`}>
                      {m.status}
                    </span>
                    {(m.revision_count > 0) && (
                      <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">
                        R{m.revision_count}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" /> {proj}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {dev}
                    </span>
                    {m.client_price > 0 && (
                      <span className="text-emerald-400 font-bold">
                        ${Math.round(m.client_price)}
                      </span>
                    )}
                  </div>
                </div>

                {isQA && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => qaAction(m.module_id, 'approve')}
                      disabled={busy === `${m.module_id}:approve`}
                      data-testid={`approve-${m.module_id}`}
                      className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => qaAction(m.module_id, 'revision')}
                      disabled={busy === `${m.module_id}:revision`}
                      data-testid={`revision-${m.module_id}`}
                      className="px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded disabled:opacity-50 flex items-center gap-1 border border-amber-500/40"
                    >
                      <RotateCw className="w-3 h-3" /> Revision
                    </button>
                    <button
                      onClick={() => qaAction(m.module_id, 'reject')}
                      disabled={busy === `${m.module_id}:reject`}
                      data-testid={`reject-${m.module_id}`}
                      className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded disabled:opacity-50 flex items-center gap-1 border border-red-500/40"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
