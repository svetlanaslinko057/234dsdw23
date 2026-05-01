import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Developer Intelligence — GROWTH (web projection)
 * Source: GET /api/developer/intelligence/growth
 */
const colorFor = (v, good, warn) =>
  v >= good ? '#2FE6A6' : v >= warn ? '#F5C451' : '#FF6B6B';

export default function DeveloperIntelGrowth() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setErr(null); setLoading(true);
      const r = await axios.get('/api/developer/intelligence/growth', { withCredentials: true });
      setData(r.data);
    } catch (e) { setErr(e?.response?.data?.detail || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Growth</h1>
        <p className="text-[#9FB0C0] text-sm mt-1">How close you are to the next tier</p>

        {loading && <div className="mt-8 text-[#9FB0C0]">Loading…</div>}
        {err && !loading && (
          <div className="mt-6 p-4 rounded-xl bg-red-900/20 border border-red-700 text-red-300">
            {err} <button onClick={load} className="ml-4 underline">Retry</button>
          </div>
        )}

        {data && (
          <>
            <div className="mt-6 p-8 rounded-xl bg-[#0F141B] border border-[#2FE6A6]/35 text-center">
              <div className="text-xs text-[#2FE6A6] font-extrabold tracking-widest">
                {data.tier_label.toUpperCase()}
              </div>
              <div className="text-6xl font-extrabold mt-2">{Math.round(data.score)}</div>
              <div className="text-xs text-[#6B7C8F] font-bold tracking-widest">SCORE</div>
              <div className="mt-5 h-2 bg-[#16202B] rounded-full overflow-hidden">
                <div className="h-full bg-[#2FE6A6]" style={{ width: `${data.progress_pct}%` }} />
              </div>
              <div className="text-sm text-[#9FB0C0] mt-2">
                {data.next_tier_label
                  ? `${data.next_tier_label} in ${data.remaining_to_next} pts`
                  : 'Top tier — keep defending your position'}
              </div>
            </div>

            {data.economics && (
              <div className="mt-4 p-4 rounded-xl bg-[#0F141B] border border-[#2FE6A6]/33">
                <div className="flex items-center gap-2">
                  <span className="text-[#2FE6A6]">$</span>
                  <span className="text-white">
                    You earn <span className="font-extrabold text-[#2FE6A6]">~{data.economics.tier_rate_pct}%</span> per module
                  </span>
                </div>
                {data.economics.avg_module_earning > 0 && (
                  <div className="text-sm text-[#9FB0C0] ml-5 mt-1">
                    Average module earning: ${Math.round(data.economics.avg_module_earning)}
                  </div>
                )}
                <div className="text-xs text-[#6B7C8F] ml-5 mt-1">Higher tier → higher payout</div>
              </div>
            )}

            <div className="mt-6 text-xs font-extrabold tracking-widest text-[#6B7C8F]">COMPONENTS</div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: 'Quality', v: data.components.quality, suffix: '%', good: 85, warn: 70 },
                { label: 'Speed', v: data.components.speed, suffix: '%', good: 85, warn: 70 },
                { label: 'Trust', v: data.components.trust, suffix: '%', good: 80, warn: 60 },
                { label: 'Earnings', v: data.components.earnings, prefix: '$', good: 2000, warn: 500 },
              ].map((c) => (
                <div key={c.label} className="p-4 rounded-xl bg-[#0F141B] border border-white/6">
                  <div className="text-sm text-[#9FB0C0] font-semibold">{c.label}</div>
                  <div className="text-2xl font-extrabold mt-1" style={{ color: colorFor(c.v, c.good, c.warn) }}>
                    {c.prefix || ''}{Math.round(c.v)}{c.suffix || ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs font-extrabold tracking-widest text-[#6B7C8F]">STATS</div>
            <div className="mt-2 p-4 rounded-xl bg-[#0F141B] border border-white/6 space-y-2">
              {[
                ['Completed modules', data.stats.completed_modules],
                ['Active modules', data.stats.active_modules],
                ['QA pass rate', `${data.stats.qa_pass_rate}%`],
                ['Revisions', data.stats.revisions],
                ['Lifetime earned', `$${Math.round(data.stats.earned_lifetime)}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-[#9FB0C0]">{l}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
            </div>

            {data.hints_to_next_tier?.length > 0 && data.next_tier_label && (
              <>
                <div className="mt-6 text-xs font-extrabold tracking-widest text-[#6B7C8F]">
                  TO REACH {data.next_tier_label.toUpperCase()}
                </div>
                <div className="mt-2 p-4 rounded-xl bg-[#2FE6A6]/10 border border-[#2FE6A6]/33 space-y-2">
                  {data.hints_to_next_tier.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[#2FE6A6]">→</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
