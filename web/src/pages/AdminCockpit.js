/**
 * Admin Cockpit · single screen · one source of truth per section.
 *
 * 3 endpoints → 3 sections. UI = render JSON. Nothing else.
 *   · /api/admin/production  → A1 · "state"
 *   · /api/admin/risk        → A3 · "where it hurts"
 *   · /api/admin/actions     → A2 · "what the system is doing"
 *
 * NEVER:
 *   - join endpoints
 *   - derive fields
 *   - re-compute severity / risk / status
 *   - filter or sort beyond the raw arrays we receive
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/App";

const fmtMoney = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const PORTFOLIO_COLORS = {
  healthy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  watch:   "text-sky-400 border-sky-500/30 bg-sky-500/10",
  at_risk: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  blocked: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const SEVERITY_COLOR = {
  critical: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  warning:  "text-amber-400 border-amber-500/40 bg-amber-500/10",
  info:     "text-sky-400 border-sky-500/40 bg-sky-500/10",
};

const TEAM_STATUS_COLOR = {
  overloaded: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  unstable:   "text-amber-400 border-amber-500/40 bg-amber-500/10",
  top:        "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  normal:     "text-neutral-400 border-neutral-800 bg-neutral-950/60",
};

export default function AdminCockpit() {
  const [production, setProduction] = useState(null);
  const [risk, setRisk] = useState(null);
  const [actions, setActions] = useState(null);
  const [team, setTeam] = useState(null);
  const [err, setErr] = useState(null);
  const [bump, setBump] = useState(0);
  const triggerRefresh = () => setBump((b) => b + 1);

  useEffect(() => {
    let active = true;
    const cfg = { withCredentials: true };
    const loadAll = () => Promise.all([
      axios.get(`${API}/admin/production`, cfg),
      axios.get(`${API}/admin/risk`, cfg),
      axios.get(`${API}/admin/actions`, cfg),
      axios.get(`${API}/admin/team`, cfg),
    ])
      .then(([p, r, a, t]) => {
        if (!active) return;
        setProduction(p.data);
        setRisk(r.data);
        setActions(a.data);
        setTeam(t.data);
      })
      .catch((e) => active && setErr(e?.response?.data?.detail || e.message));

    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [bump]);

  if (err) {
    return <div className="p-8 text-rose-400">Failed to load cockpit: {String(err)}</div>;
  }
  if (!production || !risk || !actions) {
    return <div className="p-8 text-neutral-400">Loading cockpit…</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold">Admin Cockpit</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Production state · risks · system activity — one screen, three truths.
        </p>
      </header>

      {/* ── A1 · PRODUCTION ──────────────────────────────────────── */}
      <section data-testid="section-production" className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <SectionTitle
          left="Production"
          right={`as of ${fmtTime(production.generated_at)}`}
        />

        {/* Portfolio */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(production.portfolio).map(([k, v]) => (
            <PortfolioCell key={k} label={k.replace("_", " ")} value={v} tone={k} />
          ))}
        </div>

        {/* Money */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <MoneyCell label="Revenue" value={fmtMoney(production.money.revenue)} />
          <MoneyCell label="Cost"    value={fmtMoney(production.money.cost)} />
          <MoneyCell
            label="Profit"
            value={fmtMoney(production.money.profit)}
            color={production.money.profit >= 0 ? "text-emerald-400" : "text-rose-400"}
          />
          <MoneyCell label="Paid" value={fmtMoney(production.money.paid)} />
          <MoneyCell
            label="At risk"
            value={fmtMoney(production.money.profit_at_risk)}
            color={production.money.profit_at_risk > 0 ? "text-amber-400" : "text-neutral-400"}
          />
        </div>

        {/* Work */}
        <div className="mt-4 text-xs text-neutral-400 flex flex-wrap gap-x-4">
          <span><b className="text-neutral-100 tabular-nums">{production.work.active_modules}</b> active modules</span>
          <span><b className="text-amber-400 tabular-nums">{production.work.paused_by_system}</b> paused by system</span>
          <span><b className="text-rose-400 tabular-nums">{production.work.over_budget}</b> over budget</span>
          <span className="ml-auto">
            System last 24h:
            &nbsp;<b className="text-neutral-100 tabular-nums">{production.system.auto_actions_24h}</b> actions
            &nbsp;(<b className="tabular-nums">{production.system.guardian_actions}</b> guardian
            · <b className="tabular-nums">{production.system.operator_actions}</b> operator)
          </span>
        </div>
      </section>

      {/* ── A3 · RISK MAP ────────────────────────────────────────── */}
      <section data-testid="section-risk" className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <SectionTitle
          left="Risk map"
          right={`as of ${fmtTime(risk.generated_at)}`}
        />

        {/* severity counts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(risk.by_severity).map(([sev, n]) => (
            <span key={sev}
              className={`text-xs px-2.5 py-1 rounded-md border tabular-nums ${SEVERITY_COLOR[sev] || "text-neutral-400 border-neutral-800"}`}>
              {sev.toUpperCase()} · {n}
            </span>
          ))}
        </div>

        {/* type counts (secondary) */}
        <div className="mt-2 text-[11px] text-neutral-400 flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(risk.by_type).map(([t, n]) => (
            <span key={t} className="tabular-nums">{t} · {n}</span>
          ))}
        </div>

        {/* top risks */}
        <div className="mt-4 space-y-2">
          {risk.top_risks.length === 0 && (
            <div className="text-sm text-emerald-400">No recurring risks detected.</div>
          )}
          {risk.top_risks.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums ${SEVERITY_COLOR[r.severity] || "text-neutral-400"}`}>
                {r.severity?.toUpperCase() || "—"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.project_title || r.project_id || "—"}</div>
                <div className="text-xs text-neutral-400">{r.headline}</div>
                {r.project_id && (
                  <ProjectActions
                    projectId={r.project_id}
                    projectTitle={r.project_title}
                    onActionDone={triggerRefresh}
                  />
                )}
              </div>
              <div className="text-xs text-neutral-400 tabular-nums whitespace-nowrap">
                {r.count}× · {fmtTime(r.last_seen_at)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── A5 · TEAM ────────────────────────────────────────────── */}
      {team && (
        <section data-testid="section-team" className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <SectionTitle
            left={`Team · ${team.summary.total}`}
            right={`as of ${fmtTime(team.generated_at)}`}
          />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 tabular-nums">
              TOP · {team.summary.top_performers}
            </span>
            <span className="px-2.5 py-1 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-300 tabular-nums">
              OVERLOADED · {team.summary.overloaded}
            </span>
            <span className="px-2.5 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 tabular-nums">
              UNSTABLE · {team.summary.unstable}
            </span>
            <span className="px-2.5 py-1 rounded-md border border-neutral-800 bg-neutral-950/60 text-neutral-400 tabular-nums">
              NORMAL · {team.summary.normal}
            </span>
          </div>

          <div className="mt-4 divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            {team.developers.length === 0 && (
              <div className="p-4 text-sm text-neutral-400">No developers.</div>
            )}
            {team.developers.map((d) => (
              <div key={d.developer_id} className="px-3 py-3 flex items-center gap-3 hover:bg-neutral-950/60">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums ${TEAM_STATUS_COLOR[d.status] || "text-neutral-400 border-neutral-800"}`}>
                  {d.status.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-neutral-400">{d.note}</div>
                </div>
                <div className="text-[10px] text-neutral-400 text-right tabular-nums whitespace-nowrap">
                  <div>score {Math.round(d.combined_score * 100)}</div>
                  <div>load {Math.round(d.load * 100)}% · {d.active_modules} active</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── A2 · ACTIONS FEED ────────────────────────────────────── */}
      <section data-testid="section-actions" className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <SectionTitle
          left={`System actions · ${actions.actions.length}`}
          right={`as of ${fmtTime(actions.generated_at)}`}
        />

        <div className="mt-2 text-[11px] text-neutral-400 flex flex-wrap gap-x-3">
          {Object.entries(actions.filters.by_source || {}).map(([s, n]) => (
            <span key={s} className="tabular-nums">source:{s} · {n}</span>
          ))}
          {Object.entries(actions.filters.by_severity || {}).map(([s, n]) => (
            <span key={s} className="tabular-nums">sev:{s} · {n}</span>
          ))}
        </div>

        <div className="mt-4 divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
          {actions.actions.length === 0 && (
            <div className="p-4 text-sm text-neutral-400">No system activity recorded.</div>
          )}
          {actions.actions.map((a) => (
            <div key={a.id} className="px-3 py-3 flex items-start gap-3 hover:bg-neutral-950/60">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums ${SEVERITY_COLOR[a.severity] || "text-neutral-400"}`}>
                {(a.severity || "info").toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{labelForType(a.type)}</span>
                  {a.count > 1 && <span className="ml-1 text-amber-400 tabular-nums">({a.count}×)</span>}
                  {a.is_project_level
                    ? <span className="text-neutral-400"> · project-level</span>
                    : a.module_title && <span className="text-neutral-400"> · {a.module_title}</span>}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {a.project_title || a.project_id || "—"}
                  {a.reason ? <> — <span className="italic">{a.reason}</span></> : null}
                </div>
              </div>
              <div className="text-[10px] text-neutral-400 text-right whitespace-nowrap">
                <div>{a.source}</div>
                <div className="tabular-nums">{fmtTime(a.last_seen_at || a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-[10px] text-neutral-400 pt-2">
        One screen · three truths · no derived data. Backend is the source of truth.
      </footer>
    </div>
  );
}

/* ── Primitives (stateless render helpers — NOT logic) ─────────── */

function SectionTitle({ left, right }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-sm uppercase tracking-wider text-neutral-400 font-semibold">{left}</h2>
      <span className="text-[10px] text-neutral-400">{right}</span>
    </div>
  );
}

function PortfolioCell({ label, value, tone }) {
  const cls = PORTFOLIO_COLORS[tone] || "text-neutral-100 border-neutral-800 bg-neutral-950/60";
  return (
    <div className={`rounded-lg border px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function MoneyCell({ label, value, color }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${color || "text-neutral-100"}`}>{value}</div>
    </div>
  );
}

function ProjectActions({ projectId, projectTitle, onActionDone }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const fire = async (action) => {
    setErr(null);
    setBusy(action);
    try {
      const r = await axios.post(
        `${API}/admin/project/${projectId}/action`,
        { action },
        { withCredentials: true }
      );
      onActionDone?.(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message);
    } finally {
      setBusy(null);
    }
  };

  const Btn = ({ act, label, tone }) => (
    <button
      disabled={busy !== null}
      onClick={() => fire(act)}
      data-testid={`admin-action-${act}-${projectId}`}
      className={`text-[11px] px-2 py-1 rounded border transition
        ${tone === "danger"  ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
        : tone === "warning" ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
        :                      "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"}
        ${busy === act ? "opacity-60 cursor-wait" : ""}
      `}
    >
      {busy === act ? "…" : label}
    </button>
  );

  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <Btn act="pause"        label="Pause project"  tone="danger" />
      <Btn act="resume"       label="Resume"         tone="ok" />
      <Btn act="force_review" label="Force review"   tone="warning" />
      {err && <span className="text-[10px] text-rose-400">{err}</span>}
    </div>
  );
}

function labelForType(t) {
  // Cosmetic labels only — backend still owns the semantic `type` field.
  const m = {
    auto_project_pause: "Project auto-paused",
    auto_pause:         "Module auto-paused",
    auto_rebalance:     "Team rebalanced",
    auto_review_flag:   "Flagged for QA",
    auto_add_support:   "Support added",
    auto_escalate:      "Escalated",
  };
  return m[t] || t;
}

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 1)   return "just now";
    if (diff < 60)  return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  } catch { return "—"; }
}
