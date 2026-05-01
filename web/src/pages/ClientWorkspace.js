/**
 * Block 9.0 — Client Workspace  (GET /api/client/project/:id/workspace)
 *
 * 1 screen = 1 question: "What is happening with my project right now?"
 *
 * Shows ONLY:
 *   - header     (project + status + 1-line cause)
 *   - KPI        (profit · revenue · cost · paid)
 *   - modules    (status · progress · developer · cost badge)
 *
 * Does NOT show (by design, to avoid mixing concerns):
 *   - system actions    → /client/operator
 *   - opportunities     → /client/opportunities (future)
 *   - earnings breakdown → /client/economics (future rename of /client/costs)
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { API } from "@/App";

const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const STATUS = {
  healthy: { label: "Healthy", dot: "bg-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  watch:   { label: "Watch",   dot: "bg-sky-400",     border: "border-sky-500/30",     glow: "shadow-sky-500/10"     },
  at_risk: { label: "At risk", dot: "bg-amber-400",   border: "border-amber-500/30",   glow: "shadow-amber-500/10"   },
  blocked: { label: "Blocked", dot: "bg-rose-400",    border: "border-rose-500/30",    glow: "shadow-rose-500/10"    },
};

const MOD_BADGE = {
  under_control: { label: "Under control", cls: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
  warning:       { label: "Near limit",    cls: "text-amber-300 border-amber-500/30 bg-amber-500/10"       },
  over_budget:   { label: "Over budget",   cls: "text-rose-300 border-rose-500/30 bg-rose-500/10"          },
};

export default function ClientWorkspace() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setErr(null);
    axios
      .get(`${API}/client/project/${projectId}/workspace`, { withCredentials: true })
      .then((r) => active && setData(r.data))
      .catch((e) => active && setErr(e?.response?.data?.detail || e.message));
    return () => { active = false; };
  }, [projectId]);

  if (err)   return <div className="min-h-screen bg-[#0A0A0A] text-rose-400 p-8">Failed: {String(err)}</div>;
  if (!data) return <div className="min-h-screen bg-[#0A0A0A] text-white/50 p-8">Loading workspace…</div>;

  const status = STATUS[data.status] || STATUS.healthy;
  const profitClass = data.summary.profit >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="text-white/40 text-xs mb-4 flex items-center gap-2">
          <Link to="/client/operator" className="hover:text-white/70">Operator</Link>
          <span>/</span>
          <span className="text-white/60">{data.project.project_title || "Project"}</span>
        </div>

        {/* Header */}
        <div className={`rounded-2xl border ${status.border} bg-white/[0.03] p-6 shadow-xl ${status.glow}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{data.project.project_title || "Untitled project"}</h1>
              <div className="mt-1 text-white/60 text-sm">{data.explanation}</div>
            </div>
            <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border border-white/10 bg-black/40">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {data.status_label}
              {data.cause && <span className="text-white/40">· {data.cause}</span>}
            </span>
          </div>

          {/* KPI */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Profit"  value={money(data.summary.profit)}  color={profitClass} />
            <MiniStat label="Revenue" value={money(data.summary.revenue)} />
            <MiniStat label="Cost"    value={money(data.summary.cost)}    />
            <MiniStat label="Paid"    value={money(data.summary.paid)}    />
          </div>

          <div className="mt-3 text-white/40 text-xs">
            {data.summary.active_modules} active · {data.summary.total_modules} total
            {data.summary.over_budget_count > 0 && (
              <span className="ml-2 text-rose-400">· {data.summary.over_budget_count} over budget</span>
            )}
            {data.summary.paused_by_system_count > 0 && (
              <span className="ml-2 text-amber-400">· {data.summary.paused_by_system_count} paused by system</span>
            )}
          </div>
        </div>

        {/* Modules (full-width, no sidebar — this is a single-purpose screen) */}
        <div className="mt-6">
          <SectionTitle>Modules</SectionTitle>
          {data.modules.length === 0 && (
            <div className="text-white/40 text-sm">No modules yet.</div>
          )}
          <div className="space-y-2">
            {data.modules.map((m) => {
              const badge = MOD_BADGE[m.cost_status] || MOD_BADGE.under_control;
              return (
                <div key={m.module_id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{m.module_title}</div>
                      <div className="text-white/40 text-xs mt-0.5">
                        {m.developer_name ? `Dev: ${m.developer_name}` : "Unassigned"}
                        {" · "}{m.status}{m.paused_by_system ? " (by system)" : ""}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          m.cost_status === "over_budget" ? "bg-rose-400" :
                          m.cost_status === "warning"     ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${m.progress_pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/50 w-10 text-right tabular-nums">
                      {m.progress_pct}%
                    </div>
                  </div>
                  <div className="mt-1 text-white/40 text-xs">
                    Cost {money(m.cost)} · Earned {money(m.earned)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deep links — each answers its own question */}
        <div className="mt-8 pt-4 text-xs space-y-1 text-white/35 border-t border-white/5">
          <div className="uppercase tracking-wider text-white/25 mb-1">Go deeper</div>
          <Link to="/client/operator" className="block hover:text-white/60">Operator — what the system did · what you can do</Link>
          <Link to="/client/costs" className="block hover:text-white/60">Economics — where the money is going</Link>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${color || "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="text-white/50 text-xs uppercase tracking-wider mb-2">{children}</div>
  );
}
