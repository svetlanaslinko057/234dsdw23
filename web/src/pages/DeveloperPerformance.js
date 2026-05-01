import { useState, useEffect } from 'react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Loader2,
  BarChart3,
  Star,
  Zap
} from 'lucide-react';

const DeveloperPerformance = () => {
  const { user } = useAuth();
  const [workUnits, setWorkUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/developer/work-units`, { withCredentials: true });
        setWorkUnits(res.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedUnits = workUnits.filter(u => u.status === 'completed');
  const revisionUnits = workUnits.filter(u => u.status === 'revision');
  
  const totalCompleted = completedUnits.length;
  const totalRevisions = revisionUnits.length;
  const successRate = workUnits.length > 0 
    ? Math.round((totalCompleted / (totalCompleted + totalRevisions || 1)) * 100) 
    : 100;
  
  const totalHours = workUnits.reduce((sum, u) => sum + (u.actual_hours || 0), 0);
  const avgTime = totalCompleted > 0 
    ? (completedUnits.reduce((sum, u) => sum + (u.actual_hours || 0), 0) / totalCompleted).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" data-testid="developer-performance">
      {/* Background */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Header */}
      <div className="relative mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Performance</h1>
        <p className="text-white/40 mt-2">Your stats and achievements</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/10 to-transparent p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-3xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'D'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{user?.name || 'Developer'}</h2>
            <p className="text-white/40 mt-1">{user?.level || 'Junior'} Developer</p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-white/70">{user?.rating || '5.0'} rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-white/70">{totalHours}h total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Completed Tasks" 
          value={totalCompleted}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard 
          label="Success Rate" 
          value={`${successRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatCard 
          label="Revisions" 
          value={totalRevisions}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
          highlight={totalRevisions > 0}
        />
        <StatCard 
          label="Avg Time" 
          value={`${avgTime}h`}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Total Hours Block */}
      <div className="rounded-2xl border border-white/10 bg-[#151922] p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Total Hours Logged</div>
            <div className="text-5xl font-bold text-white">{totalHours}<span className="text-2xl text-white/30 ml-2">hours</span></div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/40">Progress to next level</span>
            <span className="text-blue-400">{Math.min(totalHours, 100)}/100h</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(totalHours, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Completed */}
      <div className="rounded-2xl border border-white/10 bg-[#151922] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold">Recently Completed</h2>
        </div>
        
        <div className="p-4">
          {completedUnits.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40">No completed tasks yet</p>
              <p className="text-white/20 text-sm mt-1">Complete tasks to see them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedUnits.slice(0, 10).map((unit) => (
                <div 
                  key={unit.unit_id}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="font-medium">{unit.title}</span>
                      <span className="text-white/30 text-sm ml-2">{unit.project_name}</span>
                    </div>
                  </div>
                  <span className="text-white/50 text-sm font-mono">{unit.actual_hours || 0}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, highlight }) => {
  const colors = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400'
  };
  
  return (
    <div className={`p-5 rounded-2xl border bg-[#151922] transition-all ${
      highlight ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent' : 'border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wide">{label}</span>
        <span className={colors[color]}>{icon}</span>
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
};

export default DeveloperPerformance;
