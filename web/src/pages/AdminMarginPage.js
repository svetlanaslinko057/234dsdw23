import { useState, useEffect, useCallback } from 'react';
import { API } from '@/App';
import axios from 'axios';
import {
  DollarSign, TrendingUp, TrendingDown, Percent,
  BarChart3, MapPin, Layers, CreditCard
} from 'lucide-react';

const AdminMarginPage = () => {
  const [margin, setMargin] = useState(null);
  const [zones, setZones] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      const [mRes, zRes, cRes] = await Promise.all([
        axios.get(`${API}/admin/economy/margin`, { withCredentials: true }),
        axios.get(`${API}/admin/economy/zones`, { withCredentials: true }),
        axios.get(`${API}/admin/economy/cost-breakdown`, { withCredentials: true })
      ]);
      setMargin(mRes.data);
      setZones(zRes.data);
      setCostBreakdown(cRes.data);
    } catch (err) {
      console.error('Margin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" data-testid="admin-margin-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Economy & Margin</h1>
        <p className="text-zinc-500 text-sm mt-1">Revenue, costs, and profitability</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 w-fit">
        {['overview', 'zones', 'services'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            data-testid={`tab-${t}`}
          >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && margin && (
        <div data-testid="margin-overview">
          {/* Main Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <BigCard label="GMV" value={`$${margin.gmv.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="blue" testId="gmv-card" />
            <BigCard label="Net Margin" value={`$${margin.net_margin.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color={margin.net_margin >= 0 ? 'emerald' : 'red'} testId="margin-card" />
            <BigCard label="Margin %" value={`${margin.margin_percent}%`} icon={<Percent className="w-5 h-5" />} color={margin.margin_percent >= 10 ? 'emerald' : 'amber'} testId="margin-pct-card" />
            <BigCard label="Bookings" value={margin.total_completed_bookings} icon={<BarChart3 className="w-5 h-5" />} color="violet" testId="bookings-card" />
          </div>

          {/* Breakdown */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <BreakdownRow label="Gross Volume (GMV)" value={`$${margin.gmv.toLocaleString()}`} color="blue" />
                <BreakdownRow label="Provider Payouts" value={`-$${margin.total_payouts.toLocaleString()}`} color="red" />
                <BreakdownRow label="Discounts" value={`-$${margin.total_discounts.toLocaleString()}`} color="amber" />
                <div className="border-t border-zinc-800 pt-3">
                  <BreakdownRow label="Platform Commission" value={`$${margin.total_commission.toLocaleString()}`} color="emerald" bold />
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <BreakdownRow label="Net Margin" value={`$${margin.net_margin.toLocaleString()}`} color={margin.net_margin >= 0 ? 'emerald' : 'red'} bold />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Commission Rate</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-400">{(margin.commission_rate * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Platform takes {(margin.commission_rate * 100).toFixed(0)}% of each transaction</p>
                  <p className="text-xs text-zinc-600 mt-1">Pending bookings: {margin.pending_bookings}</p>
                </div>
              </div>
              {/* Monthly mini chart */}
              {margin.monthly && margin.monthly.length > 0 && (
                <div>
                  <h4 className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Monthly GMV</h4>
                  <div className="flex items-end gap-1 h-16">
                    {margin.monthly.map((m, i) => {
                      const maxGmv = Math.max(...margin.monthly.map(x => x.gmv), 1);
                      const height = Math.max((m.gmv / maxGmv) * 100, 4);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full bg-blue-500/30 rounded-t" style={{ height: `${height}%` }} title={`${m.month}: $${m.gmv}`} />
                          <span className="text-[9px] text-zinc-600">{m.month.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ZONES */}
      {tab === 'zones' && (
        <div data-testid="margin-zones">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Zone</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Providers</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bookings</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">GMV</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Margin</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Margin %</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.zone} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors" data-testid={`zone-row-${z.zone}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-white font-medium">{z.zone}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{z.provider_names.join(', ')}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{z.providers}</td>
                    <td className="px-4 py-3 text-zinc-400">{z.bookings}</td>
                    <td className="px-4 py-3 text-white font-medium">${z.gmv}</td>
                    <td className="px-4 py-3 text-emerald-400">${z.margin}</td>
                    <td className="px-4 py-3">{z.margin_percent}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        z.profitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>{z.profitable ? 'Profitable' : 'At Risk'}</span>
                    </td>
                  </tr>
                ))}
                {zones.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-zinc-600">No zone data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SERVICES */}
      {tab === 'services' && (
        <div data-testid="margin-services">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Service Type</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Bookings</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">GMV</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Commission</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {costBreakdown.map(s => (
                  <tr key={s.service} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-white font-medium">{s.service}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{s.count}</td>
                    <td className="px-4 py-3 text-white font-medium">${s.gmv}</td>
                    <td className="px-4 py-3 text-emerald-400">${s.commission}</td>
                    <td className="px-4 py-3 text-zinc-400">${s.avg_price}</td>
                  </tr>
                ))}
                {costBreakdown.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-zinc-600">No service data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const BigCard = ({ label, value, icon, color, testId }) => {
  const colors = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-400',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-400'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`} data-testid={testId}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-xs uppercase tracking-wider font-medium">{label}</span></div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

const BreakdownRow = ({ label, value, color, bold }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? 'font-semibold text-white' : 'text-zinc-400'}`}>{label}</span>
    <span className={`text-sm font-medium text-${color}-400 ${bold ? 'text-base' : ''}`}>{value}</span>
  </div>
);

export default AdminMarginPage;
