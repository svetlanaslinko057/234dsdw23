import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  Play,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Zap,
  ArrowRight,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';
import AIRecommendationsPanel from '@/components/AIRecommendationsPanel';

const DeveloperHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workUnits, setWorkUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/developer/work-units`, { withCredentials: true });
        setWorkUnits(res.data);
      } catch (error) {
        console.error('Error fetching work units:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeUnits = workUnits.filter(u => ['assigned', 'in_progress'].includes(u.status));
  const reviewUnits = workUnits.filter(u => ['submitted', 'validation'].includes(u.status));
  const revisionUnits = workUnits.filter(u => u.status === 'revision');
  const completedUnits = workUnits.filter(u => u.status === 'completed');
  const nextTask = revisionUnits[0] || activeUnits[0] || null;
  const totalHours = workUnits.reduce((sum, u) => sum + (u.actual_hours || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto" data-testid="developer-hub">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'Developer'}
        </h1>
        <p className="text-white/50">Here's what needs your attention today</p>
      </div>

      {/* AI Recommendations */}
      <div className="mb-8">
        <AIRecommendationsPanel compact />
      </div>

      {/* Revision Alert - Primary Action */}
      {revisionUnits.length > 0 && (
        <section className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/10 border border-red-500/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400">Revision Required</h3>
                  <p className="text-red-400/70 text-sm">{revisionUnits.length} task{revisionUnits.length > 1 ? 's' : ''} need fixes</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/developer/work/${revisionUnits[0].unit_id}`)}
                className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/25 flex items-center gap-2"
                data-testid="fix-now-btn"
              >
                Fix Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Next Task - Hero */}
      <section className="mb-8">
        {nextTask ? (
          <div className="rounded-2xl bg-gradient-to-br from-[#1a1f35] to-[#0f1219] border border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-white/60">
                  {nextTask.status === 'revision' ? 'Fix Required' : 'Next Task'}
                </span>
              </div>
              
              <h2 className="text-2xl font-semibold mb-2">{nextTask.title}</h2>
              <div className="flex items-center gap-4 text-sm text-white/50 mb-6">
                <span className="capitalize">{nextTask.unit_type || 'Task'}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{nextTask.estimated_hours}h estimated</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{nextTask.project_name || 'Project'}</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/developer/work/${nextTask.unit_id}`)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                  data-testid="open-task-btn"
                >
                  Open Task
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/developer/board')}
                  className="px-6 py-3 border border-white/10 text-white/70 hover:text-white hover:border-white/20 rounded-xl transition-all"
                >
                  View Board
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#151922] border border-white/10 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
            <p className="text-white/50 mb-6">No active tasks at the moment</p>
            <button
              onClick={() => navigate('/developer/board')}
              className="px-6 py-3 border border-white/10 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              View Work Board
            </button>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Active" 
          value={activeUnits.length}
          icon={<Play className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard 
          label="In Review" 
          value={reviewUnits.length}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard 
          label="Revision" 
          value={revisionUnits.length}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
          highlight={revisionUnits.length > 0}
        />
        <StatCard 
          label="Completed" 
          value={completedUnits.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="blue"
        />
      </section>

      {/* Recent Activity */}
      {workUnits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Tasks</h2>
            <button 
              onClick={() => navigate('/developer/assignments')}
              className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {workUnits.slice(0, 5).map((unit) => (
              <TaskRow 
                key={unit.unit_id}
                task={unit}
                onClick={() => navigate(`/developer/work/${unit.unit_id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color, highlight }) => {
  const colors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    blue: 'text-blue-400'
  };
  
  return (
    <div className={`p-5 rounded-2xl border bg-[#151922] transition-all ${
      highlight ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent' : 'border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{label}</span>
        <span className={colors[color]}>{icon}</span>
      </div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
};

const TaskRow = ({ task, onClick }) => {
  const statusConfig = {
    assigned: { color: 'bg-white/20', label: 'New' },
    in_progress: { color: 'bg-emerald-500', label: 'Active' },
    submitted: { color: 'bg-amber-500', label: 'Review' },
    validation: { color: 'bg-purple-500', label: 'Validating' },
    revision: { color: 'bg-red-500', label: 'Fix' },
    completed: { color: 'bg-blue-500', label: 'Done' },
  }[task.status] || { color: 'bg-white/20', label: task.status };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#151922] border border-white/10 hover:border-white/20 hover:bg-[#1a1f2a] transition-all text-left group"
    >
      <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-emerald-400 transition-colors">{task.title}</h4>
        <p className="text-sm text-white/40">{task.project_name || 'Project'}</p>
      </div>
      <span className="text-xs text-white/40 px-2 py-1 bg-white/5 rounded-lg">{statusConfig.label}</span>
      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
    </button>
  );
};

export default DeveloperHub;
