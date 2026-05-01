import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Zap, Award, Medal } from 'lucide-react';

/**
 * LEADERBOARD - Конкуренция между разработчиками
 * Dark theme, без emoji, с защитой от пустых данных
 */

export default function DeveloperLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    quality: [],
    earnings: [],
    speed: [],
    my_rank: {
      quality: null,
      earnings: null,
      speed: null
    }
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      
      const res = await fetch(`${backendUrl}/api/developer/economy/leaderboard`, {
        credentials: 'include'
      });

      if (res.ok) {
        const result = await res.json();
        setData({
          quality: result.quality || [],
          earnings: result.earnings || [],
          speed: result.speed || [],
          my_rank: result.my_rank || { quality: null, earnings: null, speed: null }
        });
      } else {
        setData({
          quality: [],
          earnings: [],
          speed: [],
          my_rank: { quality: null, earnings: null, speed: null }
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setData({
        quality: [],
        earnings: [],
        speed: [],
        my_rank: { quality: null, earnings: null, speed: null }
      });
      setLoading(false);
    }
  };

  const renderLeaderboard = (list, type, icon) => {
    if (!list || list.length === 0) {
      return (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-white/50">No leaderboard data available yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3" data-testid={`leaderboard-${type}`}>
        {list.map((entry, idx) => {
          const isMe = entry.is_me;
          const rank = idx + 1;
          
          return (
            <div
              key={entry.user_id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isMe 
                  ? 'bg-[color:var(--info-surface)] border-[color:var(--info-border)]' 
                  : 'bg-card border-border hover:border-muted-foreground'
              }`}
              data-testid={`leaderboard-entry-${rank}`}
            >
              {/* Left rail для top 3 */}
              {rank <= 3 && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                  rank === 1 ? 'bg-gradient-to-b from-amber-500 to-orange-600' :
                  rank === 2 ? 'bg-gradient-to-b from-zinc-300 to-zinc-500' :
                  'bg-gradient-to-b from-orange-400 to-orange-600'
                }`}></div>
              )}

              <div className="flex items-center gap-4">
                {/* Rank Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${
                  rank === 1 ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400' :
                  rank === 2 ? 'bg-gradient-to-br from-zinc-400/20 to-zinc-600/20 border-zinc-400/30 text-zinc-300' :
                  rank === 3 ? 'bg-gradient-to-br from-orange-400/20 to-orange-600/20 border-orange-400/30 text-orange-400' :
                  'bg-white/5 border-white/10 text-white/60'
                }`}>
                  {rank <= 3 ? (
                    <Medal className="w-6 h-6" />
                  ) : (
                    `#${rank}`
                  )}
                </div>

                {/* Name */}
                <div className="flex-1">
                  <p className={`font-semibold flex items-center gap-2 ${isMe ? 'text-[color:var(--info)]' : 'text-white'}`}>
                    {entry.name || entry.user_id}
                    {isMe && <Badge className="bg-[color:var(--info)] text-white border-0">You</Badge>}
                  </p>
                  <p className="text-sm text-white/50">{entry.level || 'Developer'}</p>
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className={`text-2xl font-bold font-mono ${
                    isMe ? 'text-[color:var(--info)]' : 'text-white'
                  }`}>
                    {type === 'earnings' && '$'}
                    {entry.value}
                    {type === 'quality' && '%'}
                    {type === 'speed' && 'x'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6" data-testid="leaderboard-page">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-amber-500" />
            Leaderboard
          </h1>
          <p className="text-white/60 mt-2">Top developers in the platform</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quality" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border p-1">
            <TabsTrigger 
              value="quality" 
              data-testid="tab-quality"
              className="data-[state=active]:bg-muted data-[state=active]:text-white text-white/50"
            >
              <Award className="w-4 h-4 mr-2" />
              Quality
            </TabsTrigger>
            <TabsTrigger 
              value="earnings" 
              data-testid="tab-earnings"
              className="data-[state=active]:bg-muted data-[state=active]:text-white text-white/50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger 
              value="speed" 
              data-testid="tab-speed"
              className="data-[state=active]:bg-muted data-[state=active]:text-white text-white/50"
            >
              <Zap className="w-4 h-4 mr-2" />
              Speed
            </TabsTrigger>
          </TabsList>

          {/* Quality Tab */}
          <TabsContent value="quality" className="mt-6">
            <Card className="bg-card border border-border shadow-[var(--shadow-elev-1)]">
              <CardHeader>
                <CardTitle className="text-white">Top Quality Performers</CardTitle>
                <p className="text-sm text-white/50">Based on QA pass rate</p>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(data.quality, 'quality', Award)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="mt-6">
            <Card className="bg-card border border-border shadow-[var(--shadow-elev-1)]">
              <CardHeader>
                <CardTitle className="text-white">Top Earners</CardTitle>
                <p className="text-sm text-white/50">Total earnings this month</p>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(data.earnings, 'earnings', TrendingUp)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Speed Tab */}
          <TabsContent value="speed" className="mt-6">
            <Card className="bg-card border border-border shadow-[var(--shadow-elev-1)]">
              <CardHeader>
                <CardTitle className="text-white">Fastest Developers</CardTitle>
                <p className="text-sm text-white/50">Average delivery speed</p>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(data.speed, 'speed', Zap)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* My Rank Summary */}
        {data.my_rank && (
          <Card className="border-2 border-[color:var(--info-border)] bg-[color:var(--info-surface)] shadow-[var(--shadow-elev-1)]">
            <CardHeader>
              <CardTitle className="text-[color:var(--info)]">Your Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-card rounded-lg border border-border">
                  <Award className="w-6 h-6 mx-auto mb-2 text-[color:var(--info)]" />
                  <p className="text-sm text-white/50 uppercase tracking-wide">Quality Rank</p>
                  <p className="text-2xl font-bold text-white">
                    {data.my_rank.quality ? `#${data.my_rank.quality}` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border border-border">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-[color:var(--success)]" />
                  <p className="text-sm text-white/50 uppercase tracking-wide">Earnings Rank</p>
                  <p className="text-2xl font-bold text-white">
                    {data.my_rank.earnings ? `#${data.my_rank.earnings}` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border border-border">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-[color:var(--warning)]" />
                  <p className="text-sm text-white/50 uppercase tracking-wide">Speed Rank</p>
                  <p className="text-2xl font-bold text-white">
                    {data.my_rank.speed ? `#${data.my_rank.speed}` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
