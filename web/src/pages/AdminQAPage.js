/**
 * Admin · QA — module QA queue (web twin of mobile /admin/qa).
 *
 * Source:  GET  /api/admin/mobile/qa
 * Actions: POST /api/admin/mobile/qa/{id}/{approve|revision|reject}
 *
 * Item contract v1: { id, title, subtitle, status, created_at, meta,
 *                     primary_action, actions[], web_url }
 *
 * Marketplace Provider QA (different concept) lives at /admin/system → Marketplace Quality.
 */
import { useEffect, useState, useCallback } from 'react';
import { API } from '@/App';
import axios from 'axios';
import {
  ShieldCheck, CheckCircle2, RotateCw, XCircle, AlertTriangle,
  RefreshCw, ExternalLink, ArrowRight,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/Toast';

const STATUS_CHIP = {
  review:       'bg-amber-500/20 text-amber-400 border-amber-500/30',
  qa_pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  submitted:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function AdminQAPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const r = await axios.get(`${API}/admin/mobile/qa`, { withCredentials: true });
      setData(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load QA queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Confirm dialog state for revision/reject (approve = one-tap, like mobile)
  const [pending, setPending] = useState(null); // { item, action, title, description, confirmLabel, variant }
  const { toast } = useToast();

  const runDecision = useCallback(async (item, action) => {
    setBusy(`${item.id}:${action}`);
    try {
      await axios.post(`${API}/admin/mobile/qa/${item.id}/${action}`, {}, { withCredentials: true });
      const verbDone = action === 'approve' ? 'approved' : action === 'revision' ? 'sent to revision' : 'rejected';
      toast.success(`Module ${verbDone}`, { description: item.title });
      await load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (e?.response?.status === 409) {
        const msg = typeof detail === 'object'
          ? `${detail.message || 'Already decided'} (${detail.current_status || ''})`
          : 'Already decided';
        toast.warning('Already decided', { description: msg });
        load();
      } else if (e?.response?.status === 500 && typeof detail === 'string' && detail.includes('Reward')) {
        toast.error('Payment failed', { description: 'Decision was rolled back. Please retry.' });
      } else {
        toast.error('Action failed', { description: typeof detail === 'string' ? detail : 'Please retry.' });
      }
    } finally {
      setBusy(null);
    }
  }, [toast, load]);

  // Approve = one-tap (matches mobile contract).
  const onApprove = (item) => runDecision(item, 'approve');

  const askRevision = (item) => setPending({
    item, action: 'revision',
    title: 'Send module to revision?',
    description: `"${item.title}" will go back to the developer for rework.`,
    confirmLabel: 'Send to revision',
    variant: 'default',
  });

  const askReject = (item) => setPending({
    item, action: 'reject',
    title: 'Reject module?',
    description: `"${item.title}" will be terminally rejected. No reward will be paid.`,
    confirmLabel: 'Reject',
    variant: 'danger',
  });

  const runPending = useCallback(async () => {
    if (!pending) return;
    const { item, action } = pending;
    setPending(null);
    await runDecision(item, action);
  }, [pending, runDecision]);

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="admin-qa">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">QA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pending modules · one-tap decisions
          </p>
        </div>
        <button
          onClick={load}
          data-testid="qa-refresh"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex gap-3" data-testid="qa-error">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm flex-1">{err}</p>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="px-3 py-1 text-xs bg-muted hover:bg-muted/70 rounded"
          >Retry</button>
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-12 text-muted-foreground">Loading QA queue…</div>
      )}

      {data && data.items.length === 0 && (
        <div className="bg-card border border-emerald-500/30 rounded-xl p-10 text-center" data-testid="qa-empty">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-bold">QA queue is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Nothing waiting for review.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="mb-4 text-xs text-muted-foreground">
            {data.summary.pending} pending
            {data.summary.has_more && <span className="ml-1">(truncated)</span>}
          </div>

          <div className="space-y-3">
            {data.items.map((item) => {
              const chip = STATUS_CHIP[item.status] || 'bg-muted text-muted-foreground border-border';
              const isBusyApprove  = busy === `${item.id}:approve`;
              const isBusyRevision = busy === `${item.id}:revision`;
              const isBusyReject   = busy === `${item.id}:reject`;
              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-4"
                  data-testid={`qa-card-${item.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold truncate">{item.title}</h3>
                        <span className={`px-2 py-0.5 text-[11px] rounded border ${chip}`}>
                          {item.status}
                        </span>
                        {item.meta?.revision_count > 0 && (
                          <span className="px-2 py-0.5 text-[11px] rounded bg-amber-500/20 text-amber-400">
                            R{item.meta.revision_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        {item.meta?.client_price > 0 && (
                          <span className="font-bold text-[#2FE6A6]">
                            ${Math.round(item.meta.client_price)}
                          </span>
                        )}
                        {item.created_at && (
                          <span className="text-muted-foreground">
                            {String(item.created_at).slice(0, 19).replace('T', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {item.actions.includes('approve') && (
                        <button
                          onClick={() => onApprove(item)}
                          disabled={busy !== null}
                          data-testid={`qa-approve-${item.id}`}
                          className="px-3 py-1.5 text-xs bg-[#2FE6A6] hover:bg-[#4ef0b6] text-black font-bold rounded disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isBusyApprove ? 'Approving…' : 'Approve'}
                        </button>
                      )}
                      {item.actions.includes('revision') && (
                        <button
                          onClick={() => askRevision(item)}
                          disabled={busy !== null}
                          data-testid={`qa-revision-${item.id}`}
                          className="px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded border border-amber-500/40 disabled:opacity-50 flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          {isBusyRevision ? 'Sending…' : 'Revision'}
                        </button>
                      )}
                      {item.actions.includes('reject') && (
                        <button
                          onClick={() => askReject(item)}
                          disabled={busy !== null}
                          data-testid={`qa-reject-${item.id}`}
                          className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded border border-red-500/40 disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          {isBusyReject ? 'Rejecting…' : 'Reject'}
                        </button>
                      )}
                    </div>
                  </div>

                  {item.web_url && (
                    <a
                      href={item.web_url}
                      className="inline-flex items-center gap-1 mt-3 pt-3 border-t border-border text-xs text-[#2FE6A6] hover:text-[#4ef0b6]"
                      data-testid={`qa-open-${item.id}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open details
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => { if (!v) setPending(null); }}
        title={pending?.title || ''}
        description={pending?.description || ''}
        confirmLabel={pending?.confirmLabel || 'Confirm'}
        variant={pending?.variant || 'default'}
        onConfirm={runPending}
      />
    </div>
  );
}
