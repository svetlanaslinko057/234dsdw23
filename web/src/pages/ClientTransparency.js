import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import {
  Activity, AlertTriangle, RotateCcw, Sparkles, CheckCircle2,
  Clock, TrendingUp, Shield, RefreshCw, FolderKanban, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const SEVERITY_STYLE = {
  low:      { badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',  dot: 'bg-blue-400'    },
  medium:   { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  high:     { badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30', dot: 'bg-orange-400' },
  critical: { badge: 'bg-red-500/15 text-red-300 border-red-500/30',    dot: 'bg-red-400'     },
};
const STATUS_STYLE = {
  pending:  { badge: 'bg-slate-600/20 text-slate-300 border-slate-500/30', label: 'Pending' },
  executed: { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Executed' },
  reverted: { badge: 'bg-zinc-600/20 text-zinc-300 border-zinc-500/30', label: 'Reverted' },
  failed:   { badge: 'bg-red-500/15 text-red-300 border-red-500/30', label: 'Failed' },
};
const CONF_STYLE = {
  High:   { color: 'text-emerald-300', bar: 'bg-emerald-500' },
  Good:   { color: 'text-emerald-400', bar: 'bg-emerald-500' },
  Medium: { color: 'text-amber-300',  bar: 'bg-amber-500' },
  Low:    { color: 'text-slate-400',  bar: 'bg-slate-500' },
};
const IMPACT_TYPE_STYLE = {
  positive: { dot: 'bg-emerald-400', tone: 'text-emerald-300', label: 'System improved' },
  neutral:  { dot: 'bg-slate-500',   tone: 'text-slate-400',   label: 'System adjusted' },
  warning:  { dot: 'bg-amber-400',   tone: 'text-amber-300',   label: 'System flagged' },
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  } catch { return iso; }
};

const ConfidenceBlock = ({ value, label, reason }) => {
  const pct = Math.round((value || 0) * 100);
  const style = CONF_STYLE[label] || CONF_STYLE['Medium confidence'];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${style.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-medium ${style.color}`}>{label} · {pct}%</span>
      </div>
      {reason && <div className="text-xs text-slate-500 italic">Because: {reason}</div>}
    </div>
  );
};

const ClientTransparency = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [since, setSince] = useState(14);
  const [revertingId, setRevertingId] = useState(null);

  const fetchData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true); else setRefreshing(true);
    try {
      const res = await axios.get(`${API}/client/transparency?since_days=${since}`, { withCredentials: true });
      setData(res.data);
    } catch (e) {
      console.error('transparency error:', e);
      setData({ summary: {}, auto_actions: [], system_alerts: [] });
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [since]);

  const onRevert = async (actionId) => {
    if (!window.confirm('Revert this system action?')) return;
    setRevertingId(actionId);
    try { await axios.post(`${API}/auto-actions/${actionId}/revert`, {}, { withCredentials: true }); await fetchData(false); }
    catch (e) { alert('Could not revert: ' + (e.response?.data?.detail || e.message)); }
    finally { setRevertingId(null); }
  };

  if (loading) return (<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-slate-400 text-sm flex items-center gap-2"><Activity className="w-4 h-4 animate-pulse" />Reading system activity…</div></div>);
  const summary = data?.summary || {};
  const actions = data?.auto_actions || [];
  const alerts = data?.system_alerts || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100" data-testid="client-transparency-page">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-[0.2em] mb-2"><Sparkles className="w-3.5 h-3.5" />Block 5.2 · Transparency</div>
            <h1 className="text-3xl font-semibold">What the system is doing for you</h1>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">Autonomous actions, decisions, and warnings across your projects — with the reasons behind them.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={since} onChange={(e) => setSince(parseInt(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500" data-testid="window-select">
              <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
            </select>
            <Button onClick={() => fetchData(false)} variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-white" data-testid="refresh-btn"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SummaryCard icon={<Activity className="w-4 h-4 text-emerald-400" />} label="Auto-actions" value={summary.actions_total || 0} testId="summary-actions" />
          <SummaryCard icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} label="Executed" value={summary.actions_executed || 0} testId="summary-executed" />
          <SummaryCard icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} label="Open alerts" value={summary.alerts_total || 0} testId="summary-alerts" />
          <SummaryCard icon={<Shield className="w-4 h-4 text-red-400" />} label="Need attention" value={summary.alerts_high_severity || 0} testId="summary-high-severity" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <SectionTitle icon={<Activity className="w-4 h-4" />} title="System Activity" count={actions.length} />
            {actions.length === 0 ? (<EmptyState message="No automatic actions in this period" hint="When the system rebalances tasks, flags reviews, or adjusts teams — they will appear here." />) : actions.map((a) => (
              <Card key={a.id} className="bg-slate-900/50 border-slate-800 p-4 hover:border-slate-700 transition-colors" data-testid={`action-${a.id}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl leading-none mt-0.5" aria-hidden>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-100">{a.label}</span>
                      <Badge variant="outline" className={STATUS_STYLE[a.status]?.badge || 'border-slate-700 text-slate-400'}>{STATUS_STYLE[a.status]?.label || a.status}</Badge>
                      <span className="text-xs text-slate-500 ml-auto flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(a.created_at)}</span>
                    </div>
                    {/* CONTEXT: project → module */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <FolderKanban className="w-3 h-3" />
                      <span className="text-slate-300">{a.project_title || 'Project'}</span>
                      <span className="text-slate-600">›</span>
                      <Package className="w-3 h-3" />
                      <span className="text-slate-200">{a.module_title || '—'}</span>
                      {IMPACT_TYPE_STYLE[a.impact_type] && (
                        <span className="ml-auto inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_TYPE_STYLE[a.impact_type].dot}`} />
                          <span className={`${IMPACT_TYPE_STYLE[a.impact_type].tone} uppercase tracking-wider text-[10px]`}>
                            {IMPACT_TYPE_STYLE[a.impact_type].label}
                          </span>
                        </span>
                      )}
                    </div>
                    {/* EXPLAIN */}
                    <div className="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                      <span className="text-slate-500">Reason</span>
                      <span className="text-slate-200">{a.reason || '—'}</span>
                      <span className="text-slate-500">Impact</span>
                      <span className="text-slate-200">{a.impact || '—'}</span>
                      <span className="text-slate-500">Confidence</span>
                      <ConfidenceBlock value={a.confidence} label={a.confidence_label} reason={a.confidence_reason} />
                    </div>
                    {a.status === 'executed' && a.revert_available && (
                      <div className="mt-3 flex justify-end">
                        <Button onClick={() => onRevert(a.id)} size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:text-white" disabled={revertingId === a.id} data-testid={`revert-btn-${a.id}`}>
                          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${revertingId === a.id ? 'animate-spin' : ''}`} />{revertingId === a.id ? 'Reverting…' : 'Undo'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <SectionTitle icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} title="System Alerts" count={alerts.length} />
            {alerts.length === 0 ? (<EmptyState compact message="No active alerts." hint="Everything is on track." />) : alerts.map((s) => {
              const style = SEVERITY_STYLE[s.severity] || SEVERITY_STYLE.medium;
              return (
                <Card key={s.id} className="bg-slate-900/50 border-slate-800 p-4" data-testid={`alert-${s.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <Badge variant="outline" className={style.badge}>{s.severity}</Badge>
                    <span className="text-xs text-slate-500 ml-auto">{fmtTime(s.created_at)}</span>
                  </div>
                  {(s.project_title || s.module_title) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      {s.project_title && (<><FolderKanban className="w-3 h-3" /><span className="text-slate-300">{s.project_title}</span></>)}
                      {s.project_title && s.module_title && <span className="text-slate-600">›</span>}
                      {s.module_title && (<><Package className="w-3 h-3" /><span className="text-slate-200">{s.module_title}</span></>)}
                    </div>
                  )}
                  <div className="text-sm text-slate-100 font-medium mb-1">{s.message}</div>
                  <div className="mt-2 p-2 rounded bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />
                    <span><span className="text-slate-500">Recommended:</span> {s.recommended_action}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-600 text-center">Updated {fmtTime(data?.generated_at)}. Read-only view over the core system.</p>
      </div>
    </div>
  );
};
const SummaryCard = ({ icon, label, value, testId }) => (
  <Card className="bg-slate-900/50 border-slate-800 p-4" data-testid={testId}>
    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider">{icon}{label}</div>
    <div className="text-2xl font-semibold mt-2 text-slate-100">{value}</div>
  </Card>
);
const SectionTitle = ({ icon, title, count }) => (
  <div className="flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider mb-1">{icon}<span>{title}</span><span className="text-slate-600">· {count}</span></div>
);
const EmptyState = ({ message, hint, compact }) => (
  <Card className={`bg-slate-900/30 border-slate-800 border-dashed text-center ${compact ? 'p-4' : 'p-8'}`}>
    <div className="text-sm text-slate-300">{message}</div>
    {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
  </Card>
);
export default ClientTransparency;
