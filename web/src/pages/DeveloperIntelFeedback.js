import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';

/**
 * Developer Intelligence — FEEDBACK (web projection)
 * Source: GET /api/developer/feedback
 */
export default function DeveloperIntelFeedback() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setErr(null); setLoading(true);
      const r = await axios.get('/api/developer/feedback', { withCredentials: true });
      setData(r.data);
    } catch (e) { setErr(e?.response?.data?.detail || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const needsRev = useMemo(
    () => (data?.items || []).filter((i) => i.status === 'needs_revision'),
    [data]
  );
  const resolved = useMemo(
    () => (data?.items || []).filter((i) => i.status === 'resolved'),
    [data]
  );

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">QA feedback</h1>
        <p className="text-[#9FB0C0] text-sm mt-1">What's blocking your growth</p>

        {loading && <div className="mt-8 text-[#9FB0C0]">Loading…</div>}
        {err && !loading && (
          <div className="mt-6 p-4 rounded-xl bg-red-900/20 border border-red-700 text-red-300">
            {err} <button onClick={load} className="ml-4 underline">Retry</button>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-4 rounded-xl bg-[#0F141B] border border-[#F5C451]/40">
                <div className="text-sm text-[#9FB0C0] font-semibold">Needs revision</div>
                <div className="text-3xl font-extrabold mt-1 text-[#F5C451]">{data.summary.open_issues}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0F141B] border border-[#2FE6A6]/40">
                <div className="text-sm text-[#9FB0C0] font-semibold">Resolved</div>
                <div className="text-3xl font-extrabold mt-1 text-[#2FE6A6]">{data.summary.resolved}</div>
              </div>
            </div>

            {data.summary.total === 0 && (
              <div className="mt-6 p-8 rounded-xl bg-[#0F141B] border border-white/6 text-center">
                <div className="text-2xl font-bold mb-2">No QA feedback yet</div>
                <div className="text-[#9FB0C0]">
                  Complete a module and QA will leave actionable notes here.
                </div>
                <a href="/developer/work" className="inline-block mt-4 px-6 py-3 rounded-xl bg-[#2FE6A6] text-black font-bold">
                  Go to Work →
                </a>
              </div>
            )}

            {needsRev.length > 0 && (
              <>
                <div className="mt-6 text-xs font-extrabold tracking-widest text-[#6B7C8F]">
                  NEEDS REVISION ({needsRev.length})
                </div>
                <div className="mt-2 space-y-2">
                  {needsRev.map((i, idx) => <Card key={idx} item={i} />)}
                </div>
              </>
            )}

            {resolved.length > 0 && (
              <>
                <div className="mt-6 text-xs font-extrabold tracking-widest text-[#6B7C8F]">
                  RESOLVED ({resolved.length})
                </div>
                <div className="mt-2 space-y-2">
                  {resolved.map((i, idx) => <Card key={idx} item={i} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Card({ item }) {
  const isRev = item.status === 'needs_revision';
  const color = isRev ? (item.severity === 'high' ? '#FF6B6B' : '#F5C451') : '#2FE6A6';
  return (
    <div
      className="p-4 rounded-xl bg-[#0F141B] border"
      style={{ borderColor: color + '55' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color }} className="text-xs font-extrabold tracking-wider">
          {isRev ? '⚠ REVISION REQUIRED' : '✓ PASSED'}
        </span>
        {item.severity === 'high' && <span className="text-xs text-[#6B7C8F]">· HIGH</span>}
      </div>
      <div className="font-bold mt-2">{item.module_title}</div>
      {item.project_title && <div className="text-xs text-[#6B7C8F]">{item.project_title}</div>}
      <div className="text-sm text-[#9FB0C0] mt-1 leading-relaxed">{item.reason}</div>
    </div>
  );
}
