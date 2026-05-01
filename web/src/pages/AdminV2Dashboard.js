/**
 * Admin · Dashboard — web version of mobile home.
 *
 * Single overview screen. Source: GET /api/admin/mobile/home
 * All aggregates come from backend. UI renders JSON.
 */
import { useEffect, useState, useCallback } from 'react';
import { API } from '@/App';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck, Wallet, Layers, Activity, Flame, XCircle, ArrowRight, RefreshCw,
} from 'lucide-react';

export default function AdminV2Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const r = await axios.get(`${API}/admin/mobile/home`, { withCredentials: true });
      setData(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="admin-dashboard">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System pulse · live operations</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm"
          data-testid="refresh-btn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <p className="text-red-400">{err}</p>
        </div>
      )}

      {data && (
        <>
          {/* Alerts — money-actionable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <AlertCard
              icon={<ShieldCheck className="w-5 h-5" />}
              label="QA pending"
              count={data.alerts.qa_pending}
              color="emerald"
              to="/admin/qa"
              testid="alert-qa"
            />
            <AlertCard
              icon={<Wallet className="w-5 h-5" />}
              label="Withdrawals"
              count={data.alerts.withdrawals_pending}
              color="amber"
              to="/admin/finance"
              testid="alert-withdrawals"
            />
            <AlertCard
              icon={<Layers className="w-5 h-5" />}
              label="Payout batches"
              count={data.alerts.payout_batches_pending}
              color="amber"
              to="/admin/finance"
              testid="alert-batches"
            />
          </div>

          {/* Snapshot */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6" data-testid="snapshot">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Snapshot
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <SnapshotItem label="Active developers" value={data.snapshot.active_devs} />
              <SnapshotItem label="Active modules" value={data.snapshot.active_modules} />
              <SnapshotItem label="QA pending" value={data.snapshot.qa_pending} highlight={data.snapshot.qa_pending > 0} />
            </div>
          </div>

          {/* Quick actions */}
          {data.quick_actions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Quick actions
              </h2>
              <div className="space-y-2">
                {data.quick_actions.map((a) => (
                  <Link
                    key={a.key}
                    to={a.route}
                    data-testid={`quick-${a.key}`}
                    className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl px-5 py-4 transition-colors"
                  >
                    <span className="font-bold flex-1">{a.label}</span>
                    {a.count > 0 && (
                      <span className="bg-black/20 px-3 py-1 rounded-full text-sm font-bold">
                        {a.count}
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {data.quick_actions.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center mb-6" data-testid="all-clear">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-lg font-bold">All clear</p>
              <p className="text-sm text-muted-foreground">Nothing pending right now.</p>
            </div>
          )}

          {/* Advanced */}
          <div className="bg-card border border-border rounded-xl p-6" data-testid="advanced">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
              Advanced signals
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <AdvancedItem
                icon={<Flame className="w-4 h-4 text-amber-400" />}
                label="Overloaded devs"
                value={data.advanced.overloaded_devs}
              />
              <AdvancedItem
                icon={<XCircle className="w-4 h-4 text-red-400" />}
                label="Blocked modules"
                value={data.advanced.blocked_modules}
              />
            </div>
            <Link
              to="/admin/workflow"
              className="flex items-center justify-center gap-2 mt-4 text-sm text-emerald-400 hover:text-emerald-300"
            >
              <Activity className="w-4 h-4" />
              Open Workflow
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function AlertCard({ icon, label, count, color, to, testid }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  };
  const c = colorMap[count > 0 ? color : 'emerald'];
  return (
    <Link
      to={to}
      data-testid={testid}
      className={`${c.bg} border ${c.border} rounded-xl p-5 hover:scale-[1.02] transition-transform block`}
    >
      <div className={c.text}>{icon}</div>
      <p className={`text-4xl font-bold mt-3 ${c.text}`}>{count}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </Link>
  );
}

function SnapshotItem({ label, value, highlight }) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-bold ${highlight ? 'text-amber-400' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function AdvancedItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
