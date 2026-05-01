import { useState, useEffect, useCallback } from 'react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { Trophy, DollarSign, Users, TrendingUp, Crown, Medal, Hash, ArrowUp } from 'lucide-react';

const TABS = [
  { key: 'score', label: 'Top Score', icon: TrendingUp },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'referrals', label: 'Referrals', icon: Users },
];

const ClientLeaderboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('score');

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/client/growth/leaderboard`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" data-testid="leaderboard-loading">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  const items = data?.[activeTab] || [];
  const me = data?.me;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <Hash className="w-3.5 h-3.5 text-white/20" />;
  };

  const getValueForTab = (item) => {
    if (activeTab === 'revenue') return `$${Math.round(item.revenue || 0).toLocaleString()}`;
    if (activeTab === 'referrals') return `${item.referrals_count || 0} refs`;
    return `${item.score || 0} pts`;
  };

  const tierColors = {
    catalyst: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    alliance: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    advocate: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    partner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    starter: 'text-white/40 bg-white/5 border-white/10',
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6" data-testid="client-leaderboard-page">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="leaderboard-title">Client Leaderboard</h1>
          <p className="text-sm text-white/40">{data?.total || 0} clients competing</p>
        </div>
      </div>

      {/* My rank card */}
      {me && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between" data-testid="my-rank-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
              #{me.rank}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{me.name}</div>
              <div className="text-xs text-white/40 capitalize">{me.tier} tier</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-400">{me.score} pts</div>
            <div className="text-xs text-white/30">your score</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10" data-testid="leaderboard-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/40 hover:text-white/60'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2" data-testid="leaderboard-list">
        {items.length === 0 ? (
          <div className="text-sm text-white/30 py-12 text-center rounded-2xl border border-white/5 bg-[#111318]">
            No rankings yet. Be the first!
          </div>
        ) : (
          items.map((item) => {
            const isMe = item.user_id === user?.user_id;
            return (
              <div
                key={`${item.user_id}-${item.rank}`}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isMe ? 'bg-blue-500/5 border-blue-500/20 ring-1 ring-blue-500/10' :
                  item.rank <= 3 ? 'bg-[#111318] border-white/10' : 'bg-[#111318] border-white/5'
                }`}
                data-testid={`leaderboard-entry-${item.rank}`}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {item.rank <= 3 ? getRankIcon(item.rank) : <span className="text-xs text-white/30 font-mono">#{item.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${isMe ? 'text-blue-400' : 'text-white'}`}>
                      {item.name || 'Unknown'}
                    </span>
                    {isMe && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">YOU</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize border ${tierColors[item.tier] || tierColors.starter}`}>
                      {item.tier}
                    </span>
                    <span className="text-[11px] text-white/25">{item.repeat_projects || 0} projects</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${item.rank <= 3 ? 'text-amber-400' : 'text-white/70'}`}>
                    {getValueForTab(item)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {me && me.rank > 20 && (
        <div className="flex items-center gap-2 text-xs text-white/30 justify-center pt-2">
          <ArrowUp className="w-3 h-3 text-blue-400" />
          <span>You're ranked #{me.rank}. Keep building to climb!</span>
        </div>
      )}
    </div>
  );
};

export default ClientLeaderboardPage;
