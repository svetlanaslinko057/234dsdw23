/**
 * Phase 4 — Admin Billing Panel.
 *
 * Renders /api/admin/billing/invoices as-is (no client-side aggregation).
 * Filter chips drive the `?status=` query. Two row-level actions:
 *   - Resend payment link (calls POST /admin/billing/invoices/{id}/resend)
 *   - Mark paid manually (calls POST /admin/billing/invoices/{id}/mark-paid)
 */
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const STATUS_TONE = {
  pending_payment: { label: "Pending", bg: "#f59e0b22", color: "#f59e0b", border: "#f59e0b55" },
  paid:            { label: "Paid",    bg: "#2FE6A622", color: "#2FE6A6", border: "#2FE6A655" },
  failed:          { label: "Failed",  bg: "#ef444422", color: "#ef4444", border: "#ef444455" },
  cancelled:       { label: "Cancelled", bg: "#6b728022", color: "#9ca3af", border: "#6b728055" },
  draft:           { label: "Draft",   bg: "#3b82f622", color: "#3b82f6", border: "#3b82f655" },
};

function fmtMoney(n, ccy = "USD") {
  const v = Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return ccy === "USD" ? `$${v}` : `${v} ${ccy}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all"
        ? `${API}/admin/billing/invoices`
        : `${API}/admin/billing/invoices?status=${filter}`;
      const r = await axios.get(url, { withCredentials: true });
      setInvoices(r.data?.invoices || []);
      setStats(r.data?.stats || null);
    } catch (e) {
      setToast({ kind: "error", text: e?.response?.data?.detail || "Could not load invoices" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const resend = async (inv) => {
    setBusy((b) => ({ ...b, [inv.invoice_id]: "resend" }));
    try {
      const r = await axios.post(
        `${API}/admin/billing/invoices/${inv.invoice_id}/resend`,
        {},
        { withCredentials: true },
      );
      setToast({
        kind: "success",
        text: `Payment link regenerated (${r.data?.provider}).`,
        link: r.data?.payment_url,
      });
      load();
    } catch (e) {
      setToast({ kind: "error", text: e?.response?.data?.detail || "Resend failed" });
    } finally {
      setBusy((b) => { const c = { ...b }; delete c[inv.invoice_id]; return c; });
    }
  };

  const markPaid = async (inv) => {
    if (!window.confirm(`Mark "${inv.title}" (${fmtMoney(inv.amount, inv.currency)}) as paid?\n\nThis will activate the project and trigger referral payout.`)) return;
    setBusy((b) => ({ ...b, [inv.invoice_id]: "mark" }));
    try {
      await axios.post(
        `${API}/admin/billing/invoices/${inv.invoice_id}/mark-paid`,
        {},
        { withCredentials: true },
      );
      setToast({ kind: "success", text: "Invoice marked as paid. Project unlocked." });
      load();
    } catch (e) {
      setToast({ kind: "error", text: e?.response?.data?.detail || "Mark-paid failed" });
    } finally {
      setBusy((b) => { const c = { ...b }; delete c[inv.invoice_id]; return c; });
    }
  };

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "pending_payment", label: "Pending" },
    { key: "paid", label: "Paid" },
    { key: "failed", label: "Failed" },
  ];

  return (
    <div style={st.page} data-testid="admin-billing-page">
      <div style={st.header}>
        <div>
          <h1 style={st.h1}>Billing</h1>
          <p style={st.subhead}>Phase 4 — Payment Lock · WayForPay</p>
        </div>
        <button
          onClick={load}
          style={st.refreshBtn}
          data-testid="admin-billing-refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats strip */}
      {stats ? (
        <div style={st.statRow}>
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending" value={stats.pending_payment_count} accent="#f59e0b"
                sub={fmtMoney(stats.pending_payment_amount)} />
          <Stat label="Paid" value={stats.paid_count} accent="#2FE6A6"
                sub={fmtMoney(stats.paid_amount)} />
          <Stat label="Failed" value={stats.failed_count} accent="#ef4444" />
        </div>
      ) : null}

      {/* Filter chips */}
      <div style={st.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ ...st.filterChip, ...(filter === f.key ? st.filterChipActive : {}) }}
            data-testid={`admin-billing-filter-${f.key}`}
          >
            {f.label}
          </button>
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
          data-testid="admin-billing-toast"
        >
          {toast.text}
          {toast.link ? (
            <a href={toast.link} target="_blank" rel="noreferrer" style={st.toastLink}>
              {" "}→ open
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Table */}
      <div style={st.tableWrap}>
        {loading ? (
          <div style={st.empty}>Loading…</div>
        ) : invoices.length === 0 ? (
          <div style={st.empty} data-testid="admin-billing-empty">
            No invoices in this filter.
          </div>
        ) : (
          <table style={st.table}>
            <thead>
              <tr>
                <th style={st.th}>Invoice</th>
                <th style={st.th}>Project</th>
                <th style={st.th}>Client</th>
                <th style={st.th}>Amount</th>
                <th style={st.th}>Provider</th>
                <th style={st.th}>Status</th>
                <th style={st.th}>Created</th>
                <th style={st.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const tone = STATUS_TONE[inv.status] || STATUS_TONE.draft;
                const b = busy[inv.invoice_id];
                const canPay = inv.status === "pending_payment" || inv.status === "failed";
                return (
                  <tr key={inv.invoice_id} data-testid={`admin-billing-row-${inv.invoice_id}`}>
                    <td style={st.td}>
                      <div style={st.invTitle}>{inv.title || "Invoice"}</div>
                      <div style={st.invMeta}>
                        {inv.kind ? `${inv.kind} · ` : ""}
                        <code style={st.code}>{inv.invoice_id}</code>
                      </div>
                    </td>
                    <td style={st.td}>
                      <div>{inv.project_title || "—"}</div>
                      <div style={st.invMeta}>{inv.project_status || ""}</div>
                    </td>
                    <td style={st.td}>
                      <div>{inv.client_name || "—"}</div>
                      <div style={st.invMeta}>{inv.client_email || ""}</div>
                    </td>
                    <td style={{ ...st.td, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {fmtMoney(inv.amount, inv.currency)}
                    </td>
                    <td style={st.td}>
                      <span style={st.providerChip}>{inv.provider || "—"}</span>
                    </td>
                    <td style={st.td}>
                      <span
                        style={{
                          ...st.statusChip,
                          background: tone.bg,
                          color: tone.color,
                          borderColor: tone.border,
                        }}
                      >
                        {tone.label}
                      </span>
                    </td>
                    <td style={{ ...st.td, color: "#9ca3af", fontSize: 12 }}>
                      {fmtDate(inv.created_at)}
                      {inv.paid_at ? <div style={st.invMeta}>paid {fmtDate(inv.paid_at)}</div> : null}
                    </td>
                    <td style={st.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {inv.payment_url ? (
                          <a
                            href={inv.payment_url}
                            target="_blank"
                            rel="noreferrer"
                            style={st.btnGhost}
                            data-testid={`admin-billing-open-${inv.invoice_id}`}
                          >
                            Open
                          </a>
                        ) : null}
                        {canPay ? (
                          <button
                            onClick={() => resend(inv)}
                            disabled={!!b}
                            style={st.btnPrimary}
                            data-testid={`admin-billing-resend-${inv.invoice_id}`}
                          >
                            {b === "resend" ? "…" : "Resend link"}
                          </button>
                        ) : null}
                        {canPay ? (
                          <button
                            onClick={() => markPaid(inv)}
                            disabled={!!b}
                            style={st.btnSuccess}
                            data-testid={`admin-billing-mark-paid-${inv.invoice_id}`}
                          >
                            {b === "mark" ? "…" : "Mark paid"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
  refreshBtn: {
    background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151",
    borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600,
  },

  statRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 },
  statCard: {
    background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 16,
  },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" },
  statValue: { fontSize: 28, fontWeight: 800, marginTop: 6, letterSpacing: -0.5 },
  statSub: { color: "#9ca3af", fontSize: 12, marginTop: 4 },

  filters: { display: "flex", gap: 8, marginBottom: 16 },
  filterChip: {
    background: "#111827", color: "#9ca3af", border: "1px solid #1f2937",
    borderRadius: 999, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600,
  },
  filterChipActive: { background: "#3b82f6", color: "#fff", borderColor: "#3b82f6" },

  toast: {
    padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12,
    border: "1px solid", cursor: "pointer",
  },
  toastLink: { color: "#fff", textDecoration: "underline", fontWeight: 700 },

  tableWrap: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, overflow: "auto" },
  empty: { padding: 40, textAlign: "center", color: "#6b7280" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left", padding: "10px 14px", color: "#9ca3af", fontSize: 11,
    fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
    borderBottom: "1px solid #1f2937", background: "#0f172a",
  },
  td: { padding: "12px 14px", borderBottom: "1px solid #1f2937", verticalAlign: "top" },
  invTitle: { fontWeight: 600, color: "#e5e7eb" },
  invMeta: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  code: { fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#9ca3af" },

  providerChip: {
    background: "#1f2937", color: "#e5e7eb", borderRadius: 6,
    padding: "3px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statusChip: {
    display: "inline-block",
    border: "1px solid", borderRadius: 999,
    padding: "3px 10px", fontSize: 11, fontWeight: 800, letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  btnPrimary: {
    background: "#3b82f6", color: "#fff", border: "none",
    borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
  },
  btnSuccess: {
    background: "#2FE6A6", color: "#fff", border: "none",
    borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
  },
  btnGhost: {
    background: "transparent", color: "#e5e7eb",
    border: "1px solid #374151", borderRadius: 6,
    padding: "4px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    textDecoration: "none",
  },
};
