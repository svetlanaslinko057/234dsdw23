// AdminUsersPage — Phase 1 Step B (Identity Control Panel).
//
// Two-pane layout: searchable user list on the left, detail panel on the right.
// All mutations write an admin_audit_log entry server-side; we surface the
// entries as a "Recent activity" feed inside the detail.
//
// Endpoints: see /app/backend/admin_users_layer.py.

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { API } from "@/App";

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
  { value: "deleted", label: "Deleted" },
];
const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "client", label: "Client" },
  { value: "developer", label: "Developer" },
  { value: "tester", label: "Tester" },
  { value: "admin", label: "Admin" },
];

function fmtMoney(n) {
  const v = Number(n || 0);
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
}
function fmtDate(s) {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return s; }
}
function StatusPill({ status }) {
  const map = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    blocked: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    deleted: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${map[status] || map.active}`}>
      {status}
    </span>
  );
}
function RolePill({ role }) {
  const map = {
    admin: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    client: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    developer: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    tester: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${map[role] || map.client}`}>
      {role}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionInFlight, setActionInFlight] = useState(false);
  const [confirm, setConfirm] = useState(null); // { kind, label, exec }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      params.set("limit", "200");
      const r = await axios.get(`${API}/admin/users-v2?${params.toString()}`, { withCredentials: true });
      setUsers(r.data.users || []);
      setTotal(r.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, role, status]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (uid) => {
    if (!uid) return;
    setDetailLoading(true);
    try {
      const r = await axios.get(`${API}/admin/users-v2/${uid}`, { withCredentials: true });
      setDetail(r.data);
    } catch (e) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { loadDetail(selectedId); }, [selectedId, loadDetail]);

  const runAction = async (fn, refresh = true) => {
    setActionInFlight(true);
    try {
      await fn();
      if (refresh) {
        await load();
        if (selectedId) await loadDetail(selectedId);
      }
    } catch (e) {
      alert(e.response?.data?.detail || e.message || "Action failed");
    } finally {
      setActionInFlight(false);
      setConfirm(null);
    }
  };

  const block = (u) => setConfirm({
    kind: "block",
    label: `Block ${u.email}? They will be signed out and unable to use the system until unblocked.`,
    exec: () => runAction(async () => {
      const reason = window.prompt("Reason (optional):") || "";
      await axios.post(`${API}/admin/users-v2/${u.user_id}/block`, { reason }, { withCredentials: true });
    }),
  });
  const unblock = (u) => runAction(async () => {
    await axios.post(`${API}/admin/users-v2/${u.user_id}/unblock`, {}, { withCredentials: true });
  });
  const changeRole = (u) => {
    const next = window.prompt(`New role for ${u.email}? (client | developer | admin | tester)`, u.role);
    if (!next || next === u.role) return;
    runAction(async () => {
      await axios.post(`${API}/admin/users-v2/${u.user_id}/role`, { role: next.trim() }, { withCredentials: true });
    });
  };
  const logoutAll = (u) => runAction(async () => {
    await axios.post(`${API}/admin/users-v2/${u.user_id}/logout-all`, {}, { withCredentials: true });
  });
  const softDelete = (u) => setConfirm({
    kind: "delete",
    label: `Soft-delete ${u.email}? Their email/name will be scrambled. This cannot be undone.`,
    exec: () => runAction(async () => {
      await axios.delete(`${API}/admin/users-v2/${u.user_id}`, { withCredentials: true });
      setSelectedId(null);
    }),
  });

  const counts = useMemo(() => ({
    total,
    active: users.filter(u => u.status === "active").length,
    blocked: users.filter(u => u.status === "blocked").length,
  }), [users, total]);

  const selectedUser = detail?.user;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-xs text-white/50 mt-1 font-medium">Identity Control Panel · {counts.total} total · {counts.blocked} blocked</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <input
            data-testid="users-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email or name…"
            className="flex-1 max-w-md bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          />
          <select
            data-testid="users-filter-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          >
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            data-testid="users-filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Body — split */}
      <div className="grid lg:grid-cols-[1fr_500px] gap-0">
        {/* List */}
        <div className="border-r border-white/5">
          {loading ? (
            <div className="p-12 text-center text-white/40">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-white/40">No users match your filters.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((u) => {
                const sel = u.user_id === selectedId;
                return (
                  <button
                    key={u.user_id}
                    data-testid={`user-row-${u.user_id}`}
                    onClick={() => setSelectedId(u.user_id)}
                    className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition ${sel ? "bg-white/[0.04]" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                      {u.avatar_url
                        ? <img alt="" src={u.avatar_url.startsWith("http") ? u.avatar_url : `${API.replace(/\/api$/, "")}${u.avatar_url}`} className="w-full h-full object-cover" />
                        : (u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    {/* Identity */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{u.name || u.email}</span>
                        <RolePill role={u.role} />
                        <StatusPill status={u.is_deleted ? "deleted" : u.status} />
                        {u.two_factor_enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-bold">2FA</span>
                        )}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">{u.email}</div>
                    </div>
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-right text-xs text-white/60 flex-shrink-0">
                      <div><div className="font-bold text-white">{u.projects_count}</div><div className="text-[10px] uppercase tracking-wider">Projects</div></div>
                      <div><div className="font-bold text-white">{fmtMoney(u.total_spent)}</div><div className="text-[10px] uppercase tracking-wider">Spent</div></div>
                      <div><div className="font-bold text-white">{u.referrals_count}</div><div className="text-[10px] uppercase tracking-wider">Refs</div></div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-[#070707] min-h-[calc(100vh-130px)]">
          {!selectedId && (
            <div className="p-12 text-center text-white/40">
              <div className="text-3xl mb-2">👤</div>
              <div className="text-sm">Select a user to view details</div>
            </div>
          )}

          {selectedId && detailLoading && (
            <div className="p-12 text-center text-white/40">Loading…</div>
          )}

          {selectedId && !detailLoading && selectedUser && (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold overflow-hidden">
                  {selectedUser.avatar_url
                    ? <img alt="" src={selectedUser.avatar_url.startsWith("http") ? selectedUser.avatar_url : `${API.replace(/\/api$/, "")}${selectedUser.avatar_url}`} className="w-full h-full object-cover" />
                    : (selectedUser.name || selectedUser.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold truncate">{selectedUser.name || selectedUser.email}</h2>
                  <div className="text-xs text-white/50 truncate">{selectedUser.email}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <RolePill role={selectedUser.role} />
                    <StatusPill status={selectedUser.is_deleted ? "deleted" : selectedUser.status} />
                    {selectedUser.two_factor_enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-bold">2FA</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity rows */}
              <div className="py-5 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <Row label="Phone" value={selectedUser.phone || "—"} />
                <Row label="Company" value={selectedUser.company || "—"} />
                <Row label="Timezone" value={selectedUser.timezone || "—"} />
                <Row label="Subscription" value={selectedUser.subscription} />
                <Row label="Created" value={fmtDate(selectedUser.created_at)} />
                <Row label="Last login" value={fmtDate(selectedUser.last_login_at)} />
                <Row label="Projects" value={selectedUser.projects_count} />
                <Row label="Total spent" value={fmtMoney(selectedUser.total_spent)} />
                <Row label="Referrals" value={selectedUser.referrals_count} />
                <Row label="Sessions" value={detail.sessions?.length || 0} />
              </div>

              {/* Actions */}
              <div className="border-t border-white/5 pt-5">
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Actions</div>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.status === "blocked" ? (
                    <button
                      data-testid="user-action-unblock"
                      onClick={() => unblock(selectedUser)}
                      disabled={actionInFlight}
                      className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >Unblock</button>
                  ) : (
                    <button
                      data-testid="user-action-block"
                      onClick={() => block(selectedUser)}
                      disabled={actionInFlight || selectedUser.is_deleted}
                      className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >Block</button>
                  )}
                  <button
                    data-testid="user-action-role"
                    onClick={() => changeRole(selectedUser)}
                    disabled={actionInFlight || selectedUser.is_deleted}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >Change role</button>
                  <button
                    data-testid="user-action-logout-all"
                    onClick={() => logoutAll(selectedUser)}
                    disabled={actionInFlight || (detail.sessions || []).length === 0}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >Logout all sessions</button>
                  <button
                    data-testid="user-action-delete"
                    onClick={() => softDelete(selectedUser)}
                    disabled={actionInFlight || selectedUser.is_deleted}
                    className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >Delete</button>
                </div>
              </div>

              {/* Sessions */}
              {(detail.sessions || []).length > 0 && (
                <div className="border-t border-white/5 pt-5 mt-5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Active sessions ({detail.sessions.length})</div>
                  <div className="space-y-1">
                    {detail.sessions.slice(0, 6).map(s => (
                      <div key={s.session_id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/[0.02]">
                        <span className="font-mono text-white/60">{s.token_preview}</span>
                        <span className="text-white/40">{fmtDate(s.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {(detail.projects || []).length > 0 && (
                <div className="border-t border-white/5 pt-5 mt-5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Projects ({detail.projects.length})</div>
                  <div className="space-y-1">
                    {detail.projects.slice(0, 8).map(p => (
                      <div key={p.project_id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/[0.02]">
                        <span className="text-white/80 truncate flex-1">{p.name || p.title || p.project_id}</span>
                        <span className="text-white/40 ml-2">{p.status || p.current_stage || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent admin activity */}
              {(detail.activity || []).length > 0 && (
                <div className="border-t border-white/5 pt-5 mt-5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Recent admin activity</div>
                  <div className="space-y-1">
                    {detail.activity.slice(0, 8).map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/[0.02]">
                        <span className="text-white/80">{a.action}</span>
                        <span className="text-white/40">{fmtDate(a.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0E0E0E] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Confirm</h3>
            <p className="text-sm text-white/70 mb-5">{confirm.label}</p>
            <div className="flex justify-end gap-2">
              <button
                data-testid="confirm-cancel"
                onClick={() => setConfirm(null)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider"
              >Cancel</button>
              <button
                data-testid="confirm-execute"
                onClick={confirm.exec}
                disabled={actionInFlight}
                className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >{actionInFlight ? "Working…" : `Yes, ${confirm.kind}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{label}</div>
      <div className="text-sm text-white/90 mt-0.5 truncate">{value}</div>
    </div>
  );
}
