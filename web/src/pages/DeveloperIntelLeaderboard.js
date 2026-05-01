import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Developer Intelligence — LEADERBOARD (web projection)
 * Source: GET /api/developer/intelligence/leaderboard
 */
export default function DeveloperIntelLeaderboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setErr(null); setLoading(true);
      const r = await axios.get('/api/developer/intelligence/leaderboard', { withCredentials: true });
      setData(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-[#9FB0C0] text-sm mt-1">Where you stand among developers</p>

        {loading && <div className="mt-8 text-[#9FB0C0]">Loading…</div>}

        {err && !loading && (
          <div className="mt-6 p-4 rounded-xl bg-red-900/20 border border-red-700 text-red-300">
            {err}
            <button onClick={load} className="ml-4 underline">Retry</button>
          </div>
        )}

        {data && data.status === 'forming' && (
          <div className="mt-8 p-8 rounded-xl bg-[#0F141B] border border-white/6 text-center">
            <div className="text-2xl font-bold mb-2">Leaderboard is forming</div>
            <div className="text-[#9FB0C0]">{data.reason}</div>
            <a href="/developer/work" className="inline-block mt-4 px-6 py-3 rounded-xl bg-[#2FE6A6] text-black font-bold">
              Go to Work →
            </a>
          </div>
        )}

        {data && data.status === 'ready' && (
          <>
            <div className="mt-6 p-5 rounded-xl bg-[#0F141B] border border-[#2FE6A6]/35">
              <div className="text-xs text-[#2FE6A6] font-extrabold tracking-widest">YOU</div>
              <div className="flex items-center gap-5 mt-2">
                <div className="text-5xl font-extrabold">#{data.me.rank ?? '-'}</div>
                <div>
                  <div className="text-lg font-bold">{data.me.tier_label}</div>
                  <div className="text-[#9FB0C0] text-sm">{Math.round(data.me.score)} score</div>
                </div>
                <div className="ml-auto px-3 py-1 rounded-lg bg-[#121A23] text-xs font-bold text-[#9FB0C0]">
                  of {data.total_developers}
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs font-extrabold tracking-widest text-[#6B7C8F]">TOP DEVELOPERS</div>
            <div className="mt-2 space-y-2">
              {data.top.map((row) => (
                <div
                  key={row.rank}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    row.is_me ? 'bg-[#2FE6A6]/10 border-[#2FE6A6]/40' : 'bg-[#0F141B] border-white/6'
                  }`}
                >
                  <div className="w-8 text-center">
                    {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : <span className="text-[#9FB0C0] font-bold">{row.rank}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{row.name}{row.is_me ? ' · you' : ''}</div>
                    <div className="text-xs text-[#9FB0C0]">
                      {row.tier_label} · QA {row.qa_pass_rate}% · {row.completed_modules} modules
                    </div>
                  </div>
                  <div className="text-xl font-extrabold">{Math.round(row.score)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
