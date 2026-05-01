/**
 * Admin · Finance — single point for money control.
 *
 * Tabs: Earnings · Withdrawals · Payout Batches · Summary
 * Source: GET /api/admin/mobile/finance + existing AdminEarningsControl/Withdrawals
 *
 * Actions respect v1 semantics (no money move on withdrawal approve).
 */
import { useEffect, useState, useCallback } from 'react';
import { API } from '@/App';
import axios from 'axios';
import { DollarSign, Wallet, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import AdminEarningsControl from './AdminEarningsControl';
import AdminWithdrawalsPage from './AdminWithdrawalsPage';

export default function AdminV2Finance() {
  const [tab, setTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const r = await axios.get(`${API}/admin/mobile/finance`, { withCredentials: true });
      setSummary(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (url, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(url);
    try {
      await axios.post(url, {}, { withCredentials: true });
      await load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (e?.response?.status === 409) {
        const msg = typeof detail === 'object'
          ? `${detail.message} (${detail.current_status})`
          : 'Already processed';
        alert(`Already processed: ${msg}`);
        load();
      } else {
        alert(`Failed: ${typeof detail === 'string' ? detail : 'error'}`);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="admin-finance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">Earnings · withdrawals · payout batches</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary band — always visible */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            icon={<Wallet className="w-5 h-5" />}
            label="Withdrawals pending"
            value={summary.summary.withdrawals_pending}
            tone="amber"
          />
          <SummaryCard
            icon={<Layers className="w-5 h-5" />}
            label="Batches pending"
            value={summary.summary.batches_pending}
            tone="amber"
          />
          <SummaryCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Total pending"
            value={`$${Math.round(summary.summary.total_pending_amount).toLocaleString()}`}
            tone="emerald"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-6 w-fit" data-testid="finance-tabs">
        {[
          { k: 'summary', l: 'Summary', icon: <DollarSign className="w-4 h-4" /> },
          { k: 'withdrawals', l: 'Withdrawals', icon: <Wallet className="w-4 h-4" /> },
          { k: 'earnings', l: 'Earnings', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            data-testid={`tab-${t.k}`}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
              tab === t.k ? 'bg-[#2FE6A6] text-black font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.l}
          </button>
        ))}
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{err}</p>
        </div>
      )}

      {/* Summary tab */}
      {tab === 'summary' && summary && (
        <div className="space-y-6" data-testid="finance-summary">
          {summary.withdrawals.length === 0 && summary.payout_batches.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-lg font-bold">No pending finance actions</p>
            </div>
          )}

          {summary.withdrawals.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Withdrawals · approve = allowed into next batch, no funds move
              </h2>
              <div className="space-y-2">
                {summary.withdrawals.map((w) => (
                  <div key={w.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4" data-testid={`wd-${w.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{w.title}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">{w.subtitle}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => action(`${API}/admin/mobile/withdrawals/${w.id}/approve`, `Allow "${w.title}" into next batch?`)}
                        disabled={busy !== null}
                        data-testid={`wd-approve-${w.id}`}
                        className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => action(`${API}/admin/mobile/withdrawals/${w.id}/reject`, `Reject "${w.title}"?`)}
                        disabled={busy !== null}
                        data-testid={`wd-reject-${w.id}`}
                        className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded border border-red-500/40 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {summary.payout_batches.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Payout batches · approving dispatches REAL money
              </h2>
              <div className="space-y-2">
                {summary.payout_batches.map((b) => (
                  <div key={b.id} className="bg-card border border-red-500/30 rounded-xl p-4" data-testid={`batch-${b.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{b.title}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-1">{b.subtitle}</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-2">
                          ${Math.round(b.meta?.amount_total || 0).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => action(
                          `${API}/admin/mobile/payout-batches/${b.id}/approve`,
                          `⚠ REAL PAYOUT\n\nDispatch $${Math.round(b.meta?.amount_total).toLocaleString()} to ${b.meta?.developer_count} developers?\n\nThis moves real money.`
                        )}
                        disabled={busy !== null}
                        data-testid={`batch-approve-${b.id}`}
                        className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded disabled:opacity-50"
                      >
                        Approve & dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Embedded existing pages as deeper tabs */}
      {tab === 'withdrawals' && (
        <div data-testid="finance-withdrawals-embed">
          <AdminWithdrawalsPage />
        </div>
      )}
      {tab === 'earnings' && (
        <div data-testid="finance-earnings-embed">
          <AdminEarningsControl />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }) {
  const colors = {
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[tone]}`}>
      <div>{icon}</div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
