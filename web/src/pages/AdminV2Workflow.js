/**
 * Admin · Workflow — aggregate modules feed (web).
 *
 * Source: GET /api/admin/mobile/workflow?filter=…&q=…&limit=…
 * One request, no N+1. Item contract v1.
 *
 * QA actions reuse the mobile contract:
 *   POST /api/admin/mobile/qa/{id}/{approve|revision|reject}
 */
import { useEffect, useState, useCallback } from 'react';
import { API } from '@/App';
import axios from 'axios';
import {
  Search, RefreshCw, CheckCircle2, RotateCw, XCircle,
  AlertTriangle, User, FolderKanban, ExternalLink,
} from 'lucide-react';

const STATUS_CHIP = {
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pending:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  submitted:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  review:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  qa_pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected:    'bg-red-500/20 text-red-400 border-red-500/30',
  blocked:     'bg-red-500/20 text-red-400 border-red-500/30',
};

const QA_STATUSES = new Set(['review', 'qa_pending', 'submitted']);

const FILTERS = [
  { k: 'all',     l: 'All' },
  { k: 'qa',      l: 'QA queue' },
  { k: 'active',  l: 'Active' },
  { k: 'blocked', l: 'Blocked' },
  { k: 'done',    l: 'Done' },
];

export default function AdminV2Workflow() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const r = await axios.get(
        `${API}/admin/mobile/workflow`,
        {
          params: { filter, q: search, limit: 100 },
          withCredentials: true,
        },
      );
      setData(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const qaAction = async (moduleId, action) => {
    setBusy(`${moduleId}:${action}`);
    try {
      await axios.post(
        `${API}/admin/mobile/qa/${moduleId}/${action}`,
        {},
        { withCredentials: true },
      );
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

  const summary = data?.summary || {};
  const items = data?.items || [];

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="admin-workflow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow</h1>
          <p className="text-sm text-muted-foreground mt-1">All modules · QA · blocks · reassign</p>
        </div>
        <button
          onClick={load}
          data-testid="workflow-refresh"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter + search */}
      <div className="flex gap-3 mb-4" data-testid="workflow-filters">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {FILTERS.map((f) => {
            const count = summary[f.k];
            const showBadge = typeof count === 'number' && f.k !== 'all';
            return (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                data-testid={`filter-${f.k}`}
                className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-2 ${
                  filter === f.k
                    ? 'bg-[#2FE6A6] text-black font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.l}
                {showBadge && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                    filter === f.k ? 'bg-black/20' : 'bg-muted-foreground/20'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, dev, project, module_id…"
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm"
            data-testid="workflow-search"
          />
        </div>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex gap-3" data-testid="workflow-error">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{err}</p>
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-12 text-muted-foreground">Loading modules…</div>
      )}

      {data && items.length === 0 && !loading && (
        <div className="bg-card border border-border rounded-xl p-8 text-center" data-testid="workflow-empty">
          <p className="text-lg font-bold">No modules match</p>
          <p className="text-sm text-muted-foreground mt-1">Try another filter or clear search.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((m) => {
          const isQA = QA_STATUSES.has(m.status);
          const chip = STATUS_CHIP[m.status] || 'bg-muted text-muted-foreground border-border';
          const meta = m.meta || {};
          return (
            <div
              key={m.id}
              className="bg-card border border-border rounded-xl p-4"
              data-testid={`module-card-${m.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold truncate">{m.title}</h3>
                    <span className={`px-2 py-0.5 text-[11px] rounded border ${chip}`}>
                      {m.status}
                    </span>
                    {meta.revision_count > 0 && (
                      <span className="px-2 py-0.5 text-[11px] rounded bg-amber-500/20 text-amber-400">
                        R{meta.revision_count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" /> {meta.project_title || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {meta.developer_name || '—'}
                    </span>
                    {meta.client_price > 0 && (
                      <span className="font-bold text-[#2FE6A6]">
                        ${Math.round(meta.client_price)}
                      </span>
                    )}
                    {m.created_at && (
                      <span>{String(m.created_at).slice(0, 19).replace('T', ' ')}</span>
                    )}
                  </div>
                </div>

                {isQA && m.actions?.includes('approve') && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => qaAction(m.id, 'approve')}
                      disabled={busy !== null}
                      data-testid={`approve-${m.id}`}
                      className="px-3 py-1.5 text-xs bg-[#2FE6A6] hover:bg-[#4ef0b6] text-black font-bold rounded disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => qaAction(m.id, 'revision')}
                      disabled={busy !== null}
                      data-testid={`revision-${m.id}`}
                      className="px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded disabled:opacity-50 flex items-center gap-1 border border-amber-500/40"
                    >
                      <RotateCw className="w-3 h-3" /> Revision
                    </button>
                    <button
                      onClick={() => qaAction(m.id, 'reject')}
                      disabled={busy !== null}
                      data-testid={`reject-${m.id}`}
                      className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded disabled:opacity-50 flex items-center gap-1 border border-red-500/40"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {m.web_url && (
                <a
                  href={m.web_url}
                  className="inline-flex items-center gap-1 mt-3 pt-3 border-t border-border text-xs text-[#2FE6A6] hover:text-[#4ef0b6]"
                  data-testid={`open-${m.id}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open details
                </a>
              )}
            </div>
          );
        })}
      </div>

      {data?.summary?.has_more && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          Showing first {items.length} · refine search to narrow results.
        </p>
      )}
    </div>
  );
}
