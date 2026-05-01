import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Trophy, 
  Zap,
  Lock,
  Unlock,
  DollarSign,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * DEVELOPER PROFILE ENHANCED (RPG-STYLE)
 * Темная тема, акцент на strikes, lost earnings, growth opportunities
 */

export default function DeveloperProfileEnhanced() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    level: 'Junior',
    rating: 50,
    next_level: 'Middle',
    next_level_threshold: 60,
    earnings: {
      avg_module: 0,
      max_potential: 0,
      lost_to_revisions: 0,
      last_payout: 0
    },
    quality: {
      pass_rate: 0,
      revision_rate: 0,
      fails: 0
    },
    strikes: 0,
    max_strikes: 3,
    growth: [],
    module_history: []
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      
      const [ratingRes, qualityRes, earningsRes] = await Promise.all([
        fetch(`${backendUrl}/api/developer/economy/my-rating`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/developer/quality/my-score`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/developer/profile/earnings`, { credentials: 'include' })
      ]);

      const rating = ratingRes.ok ? await ratingRes.json() : null;
      const quality = qualityRes.ok ? await qualityRes.json() : null;
      const earnings = earningsRes.ok ? await earningsRes.json() : null;

      if (rating && quality) {
        setData({
          level: rating.level,
          rating: rating.rating,
          next_level: getNextLevel(rating.level),
          next_level_threshold: getNextLevelThreshold(rating.level),
          earnings: earnings?.earnings || {
            avg_module: 0,
            max_potential: 0,
            lost_to_revisions: 0,
            last_payout: 0
          },
          quality: {
            pass_rate: quality.quality_score || 0,
            revision_rate: earnings?.revision_rate || 0,
            fails: quality.module_stats?.failed || 0
          },
          strikes: quality.strikes || 0,
          max_strikes: 3,
          growth: rating.growth_opportunities || [],
          module_history: earnings?.module_history || []
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setLoading(false);
    }
  };

  const getNextLevel = (current) => {
    const levels = ['Junior', 'Middle', 'Senior', 'Lead', 'Elite'];
    const idx = levels.indexOf(current);
    return idx < levels.length - 1 ? levels[idx + 1] : 'Elite';
  };

  const getNextLevelThreshold = (current) => {
    const thresholds = { Junior: 40, Middle: 60, Senior: 80, Lead: 90, Elite: 100 };
    const nextLevel = getNextLevel(current);
    return thresholds[nextLevel] || 100;
  };

  const getLevelColor = (level) => {
    const colors = {
      Junior: 'text-zinc-400',
      Middle: 'text-cyan-400',
      Senior: 'text-purple-400',
      Lead: 'text-amber-400',
      Elite: 'text-rose-400'
    };
    return colors[level] || 'text-zinc-400';
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const progressPercent = ((data.rating / data.next_level_threshold) * 100);
  const pointsToNext = data.next_level_threshold - data.rating;

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6" data-testid="developer-profile-enhanced">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* БЛОК 1: LEVEL PROGRESSION (RPG-STYLE) */}
        <Card className="border-2 border-purple-500/30 bg-card shadow-[var(--shadow-elev-2)]" data-testid="level-progression">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className={`w-6 h-6 ${getLevelColor(data.level)}`} />
                <span className={`text-2xl font-bold ${getLevelColor(data.level)}`}>
                  {data.level}
                </span>
              </span>
              <Badge variant="outline" className="text-lg px-4 py-2 border-white/20 text-white">
                Rating: {data.rating}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">
                  Progress to {data.next_level}
                </p>
                <p className="text-sm font-bold text-purple-400">
                  {pointsToNext} points needed
                </p>
              </div>
              <Progress value={progressPercent} className="h-3 bg-white/10" />
            </div>

            {/* Next Level Unlocks */}
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                {data.next_level} Level Unlocks:
              </p>
              <ul className="space-y-1 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  +10% earnings multiplier
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Access to $1500+ premium modules
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Priority in leaderboard
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* БЛОК 2: EARNINGS POWER (С ПОТЕРЯМИ!) */}
          <Card className="bg-card border-l-4 border-l-[color:var(--success)] border-t border-r border-b border-border shadow-[var(--shadow-elev-1)]" data-testid="earnings-power">
            <CardHeader>
              <CardTitle className="text-[color:var(--success)]">Earnings Power</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Avg Module</span>
                  <span className="text-2xl font-bold font-mono text-[color:var(--success)]">
                    ${data.earnings.avg_module}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Max Potential</span>
                  <span className="text-2xl font-bold font-mono text-[color:var(--info)]">
                    ${data.earnings.max_potential}
                  </span>
                </div>

                {/* LOST EARNINGS */}
                <div className="flex items-center justify-between p-3 bg-[color:var(--danger-surface)] rounded-lg border border-[color:var(--danger-border)]">
                  <span className="text-sm font-medium text-[color:var(--danger-ink)] flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Lost due to revisions
                  </span>
                  <span className="text-2xl font-bold font-mono text-[color:var(--danger)]">
                    -${data.earnings.lost_to_revisions}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-sm text-white/50">Last Payout</span>
                  <span className="text-xl font-bold font-mono text-white">
                    ${data.earnings.last_payout}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[color:var(--warning-surface)] border border-[color:var(--warning-border)] rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[color:var(--warning)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[color:var(--warning-ink)]">
                  Improve QA pass rate to unlock max potential earnings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* БЛОК 3: STRIKE SYSTEM */}
          <Card className="bg-card border-l-4 border-l-[color:var(--danger)] border-t border-r border-b border-border shadow-[var(--shadow-elev-1)]" data-testid="strike-system">
            <CardHeader>
              <CardTitle className="text-[color:var(--danger)] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Strike Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Strike Counter */}
              <div className="text-center py-4">
                <p className="text-sm text-white/50 mb-2 uppercase tracking-wide">Strikes</p>
                <div className="flex items-center justify-center gap-4">
                  <span className={`text-6xl font-bold font-mono ${
                    data.strikes === 0 ? 'text-[color:var(--success)]' :
                    data.strikes === 1 ? 'text-[color:var(--warning)]' :
                    data.strikes === 2 ? 'text-orange-500' :
                    'text-[color:var(--danger)]'
                  }`}>
                    {data.strikes}
                  </span>
                  <span className="text-4xl text-white/40">/</span>
                  <span className="text-4xl text-white/60">{data.max_strikes}</span>
                </div>
              </div>

              {/* Warning */}
              {data.strikes > 0 && (
                <div className="p-3 bg-[color:var(--danger-surface)] border border-[color:var(--danger-border)] rounded-lg" role="alert">
                  <p className="font-semibold mb-2 text-[color:var(--danger-ink)]">⚠️ WARNING</p>
                  <p className="text-sm text-[color:var(--danger-ink)]">Next strike consequences:</p>
                  <ul className="text-sm mt-2 space-y-1 ml-4 text-[color:var(--danger-ink)]">
                    <li>→ {data.strikes >= 2 ? '48h' : '24h'} marketplace block</li>
                    <li>→ Lose access to premium modules</li>
                    <li>→ Rating penalty (-5 points)</li>
                  </ul>
                </div>
              )}

              {data.strikes === 0 && (
                <div className="p-3 bg-[color:var(--success-surface)] border border-[color:var(--success-border)] rounded-lg">
                  <p className="text-sm text-[color:var(--success-ink)]">
                    ✅ Clean record! Keep delivering quality work.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* БЛОК 4: GROWTH PANEL */}
        {data.growth.length > 0 && (
          <Card className="border-2 border-[color:var(--warning-border)] bg-[color:var(--warning-surface)] shadow-[var(--shadow-elev-1)]" data-testid="growth-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[color:var(--warning)]">
                <Target className="w-6 h-6" />
                NEXT LEVEL: +${data.growth[0]?.monthly_impact || 920}/month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-3">
                {data.growth.slice(0, 3).map((opp, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-card border-2 border-border rounded-lg hover:border-[color:var(--warning-border)] transition-all"
                    data-testid={`growth-item-${idx}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{idx + 1}. {opp.action}</p>
                        <p className="text-sm text-white/60 mt-1">
                          Current: {opp.current} → Target: {opp.target}
                        </p>
                      </div>
                      <Badge className="bg-[color:var(--success)] text-white border-0 text-lg px-3">
                        +${opp.monthly_impact}
                      </Badge>
                    </div>
                    
                    <Progress value={50} className="h-2 mt-2 bg-white/10" />
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button 
                className="w-full bg-[color:var(--warning)] text-black hover:bg-[color:var(--warning)]/90 text-lg py-6"
                data-testid="improve-now-btn"
              >
                <Zap className="w-5 h-5 mr-2" />
                IMPROVE NOW
              </Button>
            </CardContent>
          </Card>
        )}

        {/* БЛОК 5: MODULE HISTORY */}
        <Card className="bg-card border border-border shadow-[var(--shadow-elev-1)]" data-testid="module-history">
          <CardHeader>
            <CardTitle className="text-white">Last 5 Modules</CardTitle>
            <p className="text-sm text-white/50">Performance breakdown</p>
          </CardHeader>
          <CardContent>
            {data.module_history.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-white/50">You haven't completed any modules yet</p>
                <Button 
                  variant="ghost" 
                  className="mt-4 text-[color:var(--info)] hover:text-[color:var(--info)]/80"
                  onClick={() => navigate('/developer/marketplace')}
                >
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.module_history.map((mod, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mod.best ? 'bg-[color:var(--success-surface)] border-[color:var(--success-border)]' :
                    mod.worst ? 'bg-[color:var(--danger-surface)] border-[color:var(--danger-border)]' :
                    'bg-muted border-border'
                  }`}
                  data-testid={`module-history-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white">{mod.title}</p>
                        {mod.best && <Badge className="bg-[color:var(--success)] text-white border-0">Best</Badge>}
                        {mod.worst && <Badge className="bg-[color:var(--danger)] text-white border-0">Worst</Badge>}
                      </div>
                      <p className="text-sm text-white/60 font-mono">
                        ${mod.base} → ${mod.earned}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold font-mono flex items-center gap-1 ${
                        mod.bonus_pct > 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'
                      }`}>
                        {mod.bonus_pct > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        {mod.bonus_pct > 0 ? '+' : ''}{mod.bonus_pct}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 border-white/20 text-white hover:bg-white/5"
            onClick={() => navigate('/developer/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            className="h-16 bg-[color:var(--info)] text-white hover:bg-[color:var(--info)]/90"
            onClick={() => navigate('/developer/leaderboard')}
          >
            View Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
}
