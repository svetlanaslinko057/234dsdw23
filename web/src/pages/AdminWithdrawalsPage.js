/**
 * Phase 5 — Admin Withdrawals queue.
 *
 *  requested → approve → paid    (or → rejected)
 *
 * Approving doesn't move money — it just gates payout. Mark-paid is what
 * drains pending → withdrawn_lifetime on the dev's wallet. Reject returns
 * the funds to the developer's available balance.
 */
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const TONE = {
  requested: { label: "Requested", bg: "#f59e0b22", color: "#f59e0b", border: "#f59e0b55" },
  approved:  { label: "Approved",  bg: "#3b82f622", color: "#3b82f6", border: "#3b82f655" },
  paid:      { label: "Paid",      bg: "#2FE6A622", color: "#2FE6A6", border: "#2FE6A655" },
  rejected:  { label: "Rejected",  bg: "#ef444422", color: "#ef4444", border: "#ef444455" },
};

const fmt = (n) => `$${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const dt  = (iso) => iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("requested");
  const [busy, setBusy] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all"
        ? `${API}/admin/withdrawals`
        : `${API}/admin/withdrawals?status=${filter}`;
      const r = await axios.get(url, { withCredentials: true });
      setRows(r.data?.withdrawals || []);
      setStats(r.data?.stats || null);
    } catch (e) {
      setToast({ kind: "error", text: e?.response?.data?.detail || "Could not load withdrawals" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (wd, action) => {
    if (action === "reject" && !window.confirm(`Reject ${fmt(wd.amount)} from ${wd.developer_email}?\n\nFunds will be returned to their available balance.`)) return;
    if (action === "mark-paid" && !window.confirm(`Confirm payment of ${fmt(wd.amount)} sent out-of-band to ${wd.developer_email}?`)) return;

    setBusy((b) => ({ ...b, [wd.withdrawal_id]: action }));
    try {
      await axios.post(
        `${API}/admin/withdrawals/${wd.withdrawal_id}/${action}`,
        action === "reject" ? { reason: "rejected_by_admin" } : {},
        { withCredentials: true },
      );
      setToast({ kind: "success", text: `Withdrawal ${action}d.` });
      load();
    } catch (e) {
      setToast({ kind: "error", text: e?.response?.data?.detail || `${action} failed` });
    } finally {
      setBusy((b) => { const c = { ...b }; delete c[wd.withdrawal_id]; return c; });
    }
  };

  const FILTERS = [
    { k: "requested", l: "Requested" },
    { k: "approved", l: "Approved" },
    { k: "paid", l: "Paid" },
    { k: "rejected", l: "Rejected" },
    { k: "all", l: "All" },
  ];

  return (
    <div style={st.page} data-testid="admin-withdrawals-page">
      <div style={st.header}>
        <div>
          <h1 style={st.h1}>Withdrawals</h1>
          <p style={st.subhead}>Phase 5 — Developer payout queue</p>
        </div>
        <button onClick={load} style={st.refreshBtn} data-testid="admin-withdrawals-refresh">↻ Refresh</button>
      </div>

      {stats ? (
        <div style={st.statRow}>
          <Stat label="Requested" value={stats.requested} accent="#f59e0b" sub={fmt(stats.requested_amount)} />
          <Stat label="Approved"  value={stats.approved}  accent="#3b82f6" />
          <Stat label="Paid"      value={stats.paid}      accent="#2FE6A6" />
          <Stat label="Rejected"  value={stats.rejected}  accent="#ef4444" />
        </div>
      ) : null}

      <div style={st.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            style={{ ...st.chip, ...(filter === f.k ? st.chipActive : {}) }}
            data-testid={`admin-withdrawals-filter-${f.k}`}
          >{f.l}</button>
        ))}
      </div>

      {toast ? (
        <div
          style={{
            ...st.toast,
            background: toast.kind === "error" ? "#ef444422" : "#2FE6A622",
            borderColor: toast.kind === "error" ? "#ef444455" : "#2FE6A655",
            color: toast.kind === "error" ? "#fca5a5" : "#86efac",
          }}
          onClick={() => setToast(null)}
          data-testid="admin-withdrawals-toast"
        >{toast.text}</div>
      ) : null}

      <div style={st.tableWrap}>
        {loading ? <div style={st.empty}>Loading…</div> :
         rows.length === 0 ? <div style={st.empty} data-testid="admin-withdrawals-empty">No withdrawals in this filter.</div> :
        <table style={st.table}>
          <thead>
            <tr>
              <th style={st.th}>Developer</th>
              <th style={st.th}>Amount</th>
              <th style={st.th}>Method</th>
              <th style={st.th}>Destination</th>
              <th style={st.th}>Status</th>
              <th style={st.th}>Requested</th>
              <th style={st.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((wd) => {
              const tone = TONE[wd.status] || TONE.requested;
              const b = busy[wd.withdrawal_id];
              return (
                <tr key={wd.withdrawal_id} data-testid={`admin-withdrawals-row-${wd.withdrawal_id}`}>
                  <td style={st.td}>
                    <div style={{ fontWeight: 600 }}>{wd.developer_name || "—"}</div>
                    <div style={st.meta}>{wd.developer_email}</div>
                  </td>
                  <td style={{ ...st.td, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(wd.amount)}</td>
                  <td style={st.td}><span style={st.chipMini}>{(wd.method || "manual").toUpperCase()}</span></td>
                  <td style={{ ...st.td, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                    {wd.destination ? (wd.destination.length > 32 ? wd.destination.slice(0, 30) + "…" : wd.destination) : "—"}
                  </td>
                  <td style={st.td}>
                    <span style={{ ...st.statusChip, background: tone.bg, color: tone.color, borderColor: tone.border }}>
                      {tone.label}
                    </span>
                    {wd.paid_at ? <div style={st.meta}>paid {dt(wd.paid_at)}</div> : null}
                  </td>
                  <td style={{ ...st.td, color: "#9ca3af", fontSize: 12 }}>{dt(wd.created_at)}</td>
                  <td style={st.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {wd.status === "requested" ? (
                        <>
                          <button
                            onClick={() => act(wd, "approve")}
                            disabled={!!b}
                            style={st.btnPrimary}
                            data-testid={`admin-withdrawals-approve-${wd.withdrawal_id}`}
                          >{b === "approve" ? "…" : "Approve"}</button>
                          <button
                            onClick={() => act(wd, "reject")}
                            disabled={!!b}
                            style={st.btnDanger}
                            data-testid={`admin-withdrawals-reject-${wd.withdrawal_id}`}
                          >{b === "reject" ? "…" : "Reject"}</button>
                        </>
                      ) : null}
                      {wd.status === "approved" ? (
                        <button
                          onClick={() => act(wd, "mark-paid")}
                          disabled={!!b}
                          style={st.btnSuccess}
                          data-testid={`admin-withdrawals-mark-paid-${wd.withdrawal_id}`}
                        >{b === "mark-paid" ? "…" : "Mark paid"}</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        }
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div style={st.statCard}>
      <div style={st.statLabel}>{label}</div>
      <div style={{ ...st.statValue, color: accent || "#fff" }}>{value}</div>
      {sub ? <div style={st.statSub}>{sub}</div> : null}
    </div>
  );
}

const st = {
  page: { padding: "24px 32px", color: "#e5e7eb", minHeight: "100vh", background: "#0a0a0a" },
  header: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 },
  h1: { fontSize: 28, fontWeight: 800, margin: 0, color: "#fff" },
  subhead: { color: "#6b7280", fontSize: 13, margin: "4px 0 0", letterSpacing: 0.3 },
  refreshBtn: { background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600 },

  statRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 },
  statCard: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 16 },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" },
  statValue: { fontSize: 28, fontWeight: 800, marginTop: 6, letterSpacing: -0.5 },
  statSub: { color: "#9ca3af", fontSize: 12, marginTop: 4 },

  filters: { display: "flex", gap: 8, marginBottom: 16 },
  chip: { background: "#111827", color: "#9ca3af", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  chipActive: { background: "#3b82f6", color: "#fff", borderColor: "#3b82f6" },
  chipMini: { background: "#1f2937", color: "#e5e7eb", borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.8 },

  toast: { padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12, border: "1px solid", cursor: "pointer" },

  tableWrap: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, overflow: "auto" },
  empty: { padding: 40, textAlign: "center", color: "#6b7280" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "10px 14px", color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", borderBottom: "1px solid #1f2937", background: "#0f172a" },
  td: { padding: "12px 14px", borderBottom: "1px solid #1f2937", verticalAlign: "top" },
  meta: { color: "#6b7280", fontSize: 11, marginTop: 2 },

  statusChip: { display: "inline-block", border: "1px solid", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" },

  btnPrimary: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnDanger:  { background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnSuccess: { background: "#2FE6A6", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
};
