import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import { AdminRealtimeBridge } from '@/components/RealtimeBridge';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code,
  Eye,
  Loader2,
  LogOut,
  RefreshCw,
  Settings,
  Shield,
  Target,
  User,
  Users,
  XCircle,
  Zap,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bot,
  Play,
  Power,
  DollarSign,
  Percent,
  Timer,
  Gauge,
  Brain,
  Rocket,
  Hand,
  Lightbulb,
  Cpu,
  Lock,
  History,
  GraduationCap,
  TrendingUp as TrendUp
} from 'lucide-react';
import AIRecommendationsPanel from '@/components/AIRecommendationsPanel';

const AdminControlCenter = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [overview, setOverview] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [actions, setActions] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningEngine, setRunningEngine] = useState(null);
  
  // NEW: Business, Speed, AI metrics
  const [business, setBusiness] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [aiAccuracy, setAiAccuracy] = useState(null);
  const [systemActions, setSystemActions] = useState([]);
  const [systemMode, setSystemMode] = useState('manual');
  const [modeUpdating, setModeUpdating] = useState(false);
  const [actionsLog, setActionsLog] = useState([]);
  const [learningCandidates, setLearningCandidates] = useState([]);
  const [learningStats, setLearningStats] = useState(null);
  
  const [selectedProject, setSelectedProject] = useState('all');
  const [timeframe, setTimeframe] = useState('7d');

  const fetchData = async () => {
    try {
      const [overviewRes, pipelineRes, actionsRes, alertsRes, settingsRes, businessRes, speedRes, aiRes, sysActionsRes, modeRes, learningRes, learningStatsRes] = await Promise.all([
        axios.get(`${API}/admin/control-center/overview`, { withCredentials: true }),
        axios.get(`${API}/admin/control-center/pipeline`, { withCredentials: true }),
        axios.get(`${API}/admin/control-center/actions`, { withCredentials: true }),
        axios.get(`${API}/admin/system-alerts?resolved=false`, { withCredentials: true }),
        axios.get(`${API}/admin/system-settings`, { withCredentials: true }),
        axios.get(`${API}/admin/control-center/business`, { withCredentials: true }).catch(() => ({ data: null })),
        axios.get(`${API}/admin/control-center/speed`, { withCredentials: true }).catch(() => ({ data: null })),
        axios.get(`${API}/admin/control-center/ai-accuracy`, { withCredentials: true }).catch(() => ({ data: null })),
        axios.get(`${API}/system/actions?status=pending`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/system/mode`, { withCredentials: true }).catch(() => ({ data: { mode: 'manual' } })),
        axios.get(`${API}/admin/learning/candidates?status=pending_review`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/learning/stats`, { withCredentials: true }).catch(() => ({ data: null }))
      ]);
      
      setOverview(overviewRes.data);
      setPipeline(pipelineRes.data);
      setActions(actionsRes.data);
      setSystemAlerts(alertsRes.data);
      setSettings(settingsRes.data);
      setBusiness(businessRes.data);
      setSpeed(speedRes.data);
      setAiAccuracy(aiRes.data);
      setSystemActions(sysActionsRes.data || []);
      setSystemMode(modeRes.data?.mode || 'manual');
      setLearningCandidates(learningRes.data || []);
      setLearningStats(learningStatsRes.data);
    } catch (error) {
      console.error('Error fetching control center data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const toggleAutoMode = async () => {
    const newMode = settings?.assignment_mode === 'auto' ? 'manual' : 'auto';
    try {
      await axios.post(`${API}/admin/system-settings?assignment_mode=${newMode}`, {}, { withCredentials: true });
      setSettings(prev => ({ ...prev, assignment_mode: newMode }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const runSystemEngines = async () => {
    setRunningEngine('all');
    try {
      await axios.post(`${API}/system/run-all`, {}, { withCredentials: true });
      await fetchData();
    } catch (error) {
      console.error('Error running engines:', error);
    } finally {
      setRunningEngine(null);
    }
  };

  const updateSystemMode = async (newMode) => {
    setModeUpdating(true);
    try {
      await axios.post(`${API}/admin/system/mode`, { mode: newMode }, { withCredentials: true });
      setSystemMode(newMode);
      await fetchData();
    } catch (error) {
      console.error('Error updating system mode:', error);
    } finally {
      setModeUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white" data-testid="admin-control-center">
      {/* Realtime Bridge */}
      {user?.user_id && (
        <AdminRealtimeBridge userId={user.user_id} onRefresh={handleRefresh} />
      )}
      
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B0F14]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg font-semibold">Control Center</h1>
              <p className="text-xs text-zinc-500">Live production overview</p>
            </div>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div className="flex items-center gap-3">
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              >
                <option value="all">All Projects</option>
                {overview?.projects?.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.name}</option>
                ))}
              </select>
              
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* AUTO MODE Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/30">
              <Bot className={`w-4 h-4 ${settings?.assignment_mode === 'auto' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="text-xs text-zinc-400">AUTO</span>
              <button
                onClick={toggleAutoMode}
                data-testid="auto-mode-toggle"
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  settings?.assignment_mode === 'auto' ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings?.assignment_mode === 'auto' ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            
            {/* Run Engines Button */}
            <button 
              onClick={runSystemEngines}
              disabled={runningEngine}
              data-testid="run-engines-btn"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {runningEngine ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Engines
            </button>
            
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* SYSTEM MODE TOGGLE — CRITICAL */}
        <SystemModeToggle 
          mode={systemMode} 
          onModeChange={updateSystemMode} 
          updating={modeUpdating}
        />
        
        {/* Auto Mode Banner */}
        {settings?.assignment_mode === 'auto' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-800/50 bg-emerald-500/10">
            <Bot className="w-5 h-5 text-emerald-400" />
            <div className="flex-1">
              <span className="text-sm font-medium text-emerald-400">Auto Mode Active</span>
              <span className="text-xs text-zinc-400 ml-2">System is automatically assigning tasks and managing priorities</span>
            </div>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg">ENABLED</span>
          </div>
        )}
        
        {/* System Snapshot */}
        <SystemSnapshot stats={overview?.stats} />
        
        {/* AI Recommendations */}
        <AIRecommendationsPanel />
        
        {/* NEW: Business + Speed + AI Metrics */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <BusinessBlock business={business} />
          <SpeedBlock speed={speed} />
          <AIAccuracyBlock ai={aiAccuracy} />
        </div>
        
        {/* Live Pipeline */}
        <LivePipeline pipeline={pipeline} navigate={navigate} settings={settings} />
        
        {/* System Alerts */}
        <SystemAlertsPanel alerts={systemAlerts} navigate={navigate} onRefresh={fetchData} />
        
        {/* Delivery Risks / Alerts */}
        <DeliveryRisks alerts={overview?.alerts || []} navigate={navigate} />
        
        {/* Team Health + Project Health */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TeamHealth team={overview?.team} navigate={navigate} />
          <ProjectHealth projects={overview?.projects || []} navigate={navigate} />
        </div>
        
        {/* Action Queue + System Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActionQueue actions={actions} navigate={navigate} onRefresh={fetchData} />
          <SystemActionsQueue actions={systemActions} onRefresh={fetchData} systemMode={systemMode} />
          
          {/* LEARNING QUEUE */}
          <LearningQueue candidates={learningCandidates} stats={learningStats} onRefresh={fetchData} />
        </div>
      </main>
    </div>
  );
};


// ============ SYSTEM SNAPSHOT ============

const SystemSnapshot = ({ stats }) => {
  const items = [
    { title: 'Active Units', value: stats?.active_units || 0, tone: 'default', icon: Activity },
    { title: 'In Review', value: stats?.in_review || 0, tone: stats?.in_review > 5 ? 'warning' : 'default', icon: Eye },
    { title: 'In Validation', value: stats?.in_validation || 0, tone: 'default', icon: Shield },
    { title: 'Blocked', value: stats?.blocked || 0, tone: stats?.blocked > 0 ? 'danger' : 'default', icon: XCircle },
    { title: 'Pending Deliverables', value: stats?.pending_deliverables || 0, tone: 'default', icon: FileText },
    { title: 'Overdue', value: stats?.overdue || 0, tone: stats?.overdue > 0 ? 'danger' : 'default', icon: Clock },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" data-testid="system-snapshot">
      {items.map((item) => (
        <SnapshotCard key={item.title} {...item} />
      ))}
    </div>
  );
};

const SnapshotCard = ({ title, value, tone, icon: Icon }) => {
  const toneStyles = {
    default: 'border-zinc-800',
    warning: 'border-amber-700 bg-amber-500/5',
    danger: 'border-red-700 bg-red-500/5',
    success: 'border-emerald-700 bg-emerald-500/5',
  };

  const valueStyles = {
    default: 'text-white',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    success: 'text-emerald-400',
  };

  return (
    <div className={`rounded-2xl border bg-zinc-950 p-5 ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{title}</span>
        <Icon className={`w-4 h-4 ${valueStyles[tone] === 'text-white' ? 'text-zinc-500' : valueStyles[tone]}`} />
      </div>
      <div className={`text-3xl font-semibold ${valueStyles[tone]}`}>{value}</div>
    </div>
  );
};


// ============ LIVE PIPELINE ============

const LivePipeline = ({ pipeline, navigate }) => {
  const columns = [
    { key: 'backlog', title: 'Backlog', icon: Clock },
    { key: 'assigned', title: 'Assigned', icon: User },
    { key: 'in_progress', title: 'In Progress', icon: Code },
    { key: 'review', title: 'Review', icon: Eye },
    { key: 'validation', title: 'Validation', icon: Shield },
    { key: 'done', title: 'Done', icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="live-pipeline">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Live Pipeline</h2>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Activity className="w-3 h-3" />
          Real-time
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {columns.map((col) => (
          <PipelineColumn 
            key={col.key}
            title={col.title}
            icon={col.icon}
            count={pipeline?.[col.key]?.count || 0}
            items={pipeline?.[col.key]?.items || []}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
};

const PipelineColumn = ({ title, icon: Icon, count, items, navigate }) => {
  const isDone = title === 'Done';
  
  return (
    <div className={`rounded-xl border p-4 min-h-[200px] ${isDone ? 'border-emerald-800/50 bg-emerald-500/5' : 'border-zinc-800 bg-black/50'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
          {count}
        </span>
      </div>
      
      <div className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <PipelineCard key={item.unit_id} item={item} navigate={navigate} />
        ))}
        {count > 3 && (
          <button className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-2">
            +{count - 3} more
          </button>
        )}
        {items.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-4">Empty</div>
        )}
      </div>
    </div>
  );
};

const PipelineCard = ({ item, navigate }) => (
  <div 
    onClick={() => navigate(`/admin/work-unit/${item.unit_id}`)}
    className={`rounded-lg border p-3 cursor-pointer transition-all hover:border-zinc-600 ${
      item.is_revision ? 'border-amber-700/50 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950'
    }`}
  >
    <div className="flex items-center gap-1.5">
      <div className="text-sm font-medium truncate flex-1">{item.title}</div>
      {item.auto_assigned && (
        <Bot className="w-3 h-3 text-emerald-400 flex-shrink-0" />
      )}
    </div>
    <div className="text-xs text-zinc-500 mt-1 truncate">{item.project} · {item.assignee}</div>
    {item.actual_hours > 0 && (
      <div className="text-xs text-zinc-600 mt-1">{item.actual_hours}h logged</div>
    )}
    <div className="flex gap-1 mt-2">
      {item.is_revision && (
        <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
          Revision
        </span>
      )}
      {item.auto_assigned && (
        <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
          Auto
        </span>
      )}
      {item.priority === 'high' && (
        <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
          High
        </span>
      )}
      {item.priority === 'critical' && (
        <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
          Critical
        </span>
      )}
    </div>
  </div>
);


// ============ SYSTEM ALERTS PANEL ============

const SystemAlertsPanel = ({ alerts, navigate, onRefresh }) => {
  const resolveAlert = async (alertId) => {
    try {
      await axios.post(`${API}/admin/system-alerts/${alertId}/resolve`, {}, { withCredentials: true });
      onRefresh();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  const severityOrder = { critical: 0, warning: 1 };
  const sortedAlerts = [...alerts].sort((a, b) => 
    (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2)
  );

  return (
    <div className="rounded-2xl border border-amber-800/50 bg-amber-500/5 p-6" data-testid="system-alerts">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-amber-400">System Alerts</h2>
        </div>
        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
          {alerts.length} active
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {sortedAlerts.slice(0, 4).map((alert) => (
          <div 
            key={alert.alert_id}
            className={`rounded-xl border bg-zinc-950 p-4 ${
              alert.severity === 'critical' ? 'border-red-700' : 'border-amber-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {alert.severity === 'critical' ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {alert.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="font-medium text-sm mt-2">{alert.message}</div>
                {alert.details?.unit_title && (
                  <div className="text-xs text-zinc-500 mt-1">{alert.details.unit_title}</div>
                )}
                {alert.details?.developer_name && (
                  <div className="text-xs text-zinc-500 mt-1">{alert.details.developer_name}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => resolveAlert(alert.alert_id)}
                className="flex-1 px-2 py-1.5 border border-zinc-700 rounded-lg text-xs hover:bg-white/5 transition-colors"
              >
                Resolve
              </button>
              <button 
                onClick={() => {
                  if (alert.entity_type === 'work_unit') navigate(`/admin/work-unit/${alert.entity_id}`);
                }}
                className="flex-1 px-2 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ============ DELIVERY RISKS ============

const DeliveryRisks = ({ alerts, navigate }) => {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-800/50 bg-emerald-500/5 p-6" data-testid="delivery-risks">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-semibold text-emerald-400">All Clear</h2>
            <p className="text-sm text-zinc-400">No delivery risks detected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-800/50 bg-red-500/5 p-6" data-testid="delivery-risks">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-red-400">Delivery Risks</h2>
        </div>
        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">{alerts.length} issues</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {alerts.slice(0, 4).map((alert, i) => (
          <RiskCard key={i} alert={alert} navigate={navigate} />
        ))}
      </div>
    </div>
  );
};

const RiskCard = ({ alert, navigate }) => {
  const severityStyles = {
    warning: 'border-amber-700',
    danger: 'border-red-700',
  };

  return (
    <div className={`rounded-xl border bg-zinc-950 p-4 ${severityStyles[alert.severity] || 'border-zinc-800'}`}>
      <div className="font-medium text-sm">{alert.title}</div>
      <div className="text-xs text-zinc-400 mt-1">{alert.subtitle}</div>
      <button 
        onClick={() => {
          if (alert.unit_id) navigate(`/admin/work-unit/${alert.unit_id}`);
          else if (alert.project_id) navigate(`/client/projects/${alert.project_id}`);
        }}
        className="mt-3 px-3 py-1.5 border border-zinc-700 rounded-lg text-xs hover:bg-white/5 transition-colors"
      >
        {alert.action}
      </button>
    </div>
  );
};


// ============ TEAM HEALTH ============

const TeamHealth = ({ team, navigate }) => {
  const [tab, setTab] = useState('developers');
  
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="team-health">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Team Health</h2>
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
          <button 
            onClick={() => setTab('developers')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === 'developers' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            Developers ({team?.developers?.total || 0})
          </button>
          <button 
            onClick={() => setTab('testers')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === 'testers' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            Testers ({team?.testers?.total || 0})
          </button>
        </div>
      </div>
      
      {tab === 'developers' ? (
        <div className="space-y-4">
          {team?.developers?.overloaded?.length > 0 && (
            <div>
              <div className="text-xs text-red-400 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Overloaded
              </div>
              <div className="space-y-2">
                {team.developers.overloaded.map(dev => (
                  <DeveloperCard key={dev.user_id} dev={dev} type="overloaded" />
                ))}
              </div>
            </div>
          )}
          
          {team?.developers?.top?.length > 0 && (
            <div>
              <div className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Top Performers
              </div>
              <div className="space-y-2">
                {team.developers.top.slice(0, 3).map(dev => (
                  <DeveloperCard key={dev.user_id} dev={dev} type="top" />
                ))}
              </div>
            </div>
          )}
          
          {team?.developers?.idle?.length > 0 && (
            <div>
              <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Available
              </div>
              <div className="space-y-2">
                {team.developers.idle.slice(0, 2).map(dev => (
                  <DeveloperCard key={dev.user_id} dev={dev} type="idle" />
                ))}
              </div>
            </div>
          )}
          
          {!team?.developers?.overloaded?.length && !team?.developers?.top?.length && !team?.developers?.idle?.length && (
            <div className="text-sm text-zinc-500 text-center py-8">No developers registered</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {team?.testers?.list?.length > 0 ? (
            team.testers.list.map(tester => (
              <TesterCard key={tester.user_id} tester={tester} />
            ))
          ) : (
            <div className="text-sm text-zinc-500 text-center py-8">No testers registered</div>
          )}
        </div>
      )}
    </div>
  );
};

const DeveloperCard = ({ dev, type }) => {
  const typeStyles = {
    overloaded: 'border-red-800/50',
    top: 'border-emerald-800/50',
    idle: 'border-zinc-800',
  };

  return (
    <div className={`rounded-xl border bg-black/50 p-4 ${typeStyles[type]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">{dev.name}</div>
          <div className="text-xs text-zinc-500">{dev.skills?.slice(0, 2).join(', ')}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{dev.score}</div>
          <div className="text-xs text-zinc-500">score</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span>Load: <span className={dev.load > 100 ? 'text-red-400' : ''}>{dev.load}%</span></span>
        <span>{dev.completed} completed</span>
      </div>
    </div>
  );
};

const TesterCard = ({ tester }) => (
  <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-sm">{tester.name}</div>
        <div className="text-xs text-zinc-500">{tester.validations} validations</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${tester.accuracy >= 90 ? 'text-emerald-400' : tester.accuracy >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
          {tester.accuracy}%
        </div>
        <div className="text-xs text-zinc-500">accuracy</div>
      </div>
    </div>
    <div className="mt-2 text-xs text-zinc-400">
      {tester.issues_found} issues found
    </div>
  </div>
);


// ============ PROJECT HEALTH ============

const ProjectHealth = ({ projects, navigate }) => {
  const statusStyles = {
    healthy: { border: 'border-emerald-800/50', badge: 'bg-emerald-500/20 text-emerald-400' },
    at_risk: { border: 'border-amber-800/50', badge: 'bg-amber-500/20 text-amber-400' },
    delayed: { border: 'border-red-800/50', badge: 'bg-red-500/20 text-red-400' },
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="project-health">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Project Health</h2>
        <span className="text-xs text-zinc-500">{projects.length} active</span>
      </div>
      
      <div className="space-y-3">
        {projects.length > 0 ? (
          projects.slice(0, 5).map(proj => {
            const style = statusStyles[proj.status] || statusStyles.healthy;
            return (
              <div 
                key={proj.project_id}
                onClick={() => navigate(`/client/projects/${proj.project_id}`)}
                className={`rounded-xl border bg-black/50 p-4 cursor-pointer hover:bg-white/5 transition-colors ${style.border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{proj.name}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${style.badge}`}>
                    {proj.status === 'at_risk' ? 'At Risk' : proj.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-zinc-400">
                  <div>
                    <div className="text-zinc-500">Progress</div>
                    <div className="text-white">{proj.progress}%</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Stage</div>
                    <div className="text-white capitalize">{proj.stage}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Revisions</div>
                    <div className={proj.revisions > 3 ? 'text-amber-400' : 'text-white'}>{proj.revisions}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Pending</div>
                    <div className="text-white">{proj.pending_approvals}</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-zinc-500 text-center py-8">No projects yet</div>
        )}
      </div>
    </div>
  );
};


// ============ ACTION QUEUE ============

const ActionQueue = ({ actions, navigate, onRefresh }) => {
  const handleAction = async (action) => {
    // Navigate based on action type
    switch (action.type) {
      case 'assign':
        navigate(`/admin/work-unit/${action.entity_id}`);
        break;
      case 'review':
        navigate(`/admin/dashboard`);
        break;
      case 'assign_tester':
        navigate(`/admin/dashboard`);
        break;
      case 'deliverable':
        navigate(`/client/deliverable/${action.entity_id}`);
        break;
      case 'ticket':
        // For now just refresh
        break;
      default:
        break;
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="action-queue">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Action Queue</h2>
        </div>
        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
          {actions.length} pending
        </span>
      </div>
      
      {actions.length > 0 ? (
        <div className="space-y-3">
          {actions.slice(0, 6).map((action, i) => (
            <div 
              key={i}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/50 p-4"
            >
              <div>
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{action.subtitle}</div>
              </div>
              <button 
                onClick={() => handleAction(action)}
                className="px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
              >
                {action.cta}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-zinc-500">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span className="text-sm">All caught up!</span>
        </div>
      )}
    </div>
  );
};


// ============ BUSINESS BLOCK ============

const BusinessBlock = ({ business }) => {
  if (!business) return null;
  
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="business-block">
      <div className="flex items-center gap-2 mb-5">
        <DollarSign className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold">Business</h2>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Revenue Today</div>
            <div className="text-xl font-bold text-emerald-400">${business.revenue?.today?.toLocaleString() || 0}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Profit Today</div>
            <div className={`text-xl font-bold ${business.profit?.today >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${business.profit?.today?.toLocaleString() || 0}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Margin</div>
            <div className={`text-xl font-bold ${business.margin?.average >= 30 ? 'text-emerald-400' : business.margin?.average >= 15 ? 'text-amber-400' : 'text-red-400'}`}>
              {business.margin?.average || 0}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span>Week: ${business.revenue?.week?.toLocaleString() || 0}</span>
          <span>Total: ${business.revenue?.total?.toLocaleString() || 0}</span>
        </div>
      </div>
    </div>
  );
};


// ============ SPEED BLOCK ============

const SpeedBlock = ({ speed }) => {
  if (!speed) return null;
  
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="speed-block">
      <div className="flex items-center gap-2 mb-5">
        <Gauge className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold">Speed</h2>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Avg Task Time</div>
            <div className="text-xl font-bold text-blue-400">{speed.avg_task_time_hours || 0}h</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Delivery Time</div>
            <div className="text-xl font-bold text-blue-400">{speed.avg_delivery_time_days || 0}d</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Throughput/wk</div>
            <div className="text-xl font-bold text-blue-400">{speed.throughput_week || 0}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span>Deliveries this week: {speed.deliveries_week || 0}</span>
          <span>Total completed: {speed.tasks_completed_total || 0}</span>
        </div>
      </div>
    </div>
  );
};


// ============ AI ACCURACY BLOCK ============

const AIAccuracyBlock = ({ ai }) => {
  if (!ai) return null;
  
  const accuracyColor = ai.accuracy_percent >= 80 ? 'text-emerald-400' : ai.accuracy_percent >= 60 ? 'text-amber-400' : 'text-red-400';
  
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="ai-accuracy-block">
      <div className="flex items-center gap-2 mb-5">
        <Brain className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold">AI Accuracy</h2>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Accuracy</div>
            <div className={`text-xl font-bold ${accuracyColor}`}>{ai.accuracy_percent || 0}%</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Avg Error</div>
            <div className="text-xl font-bold text-purple-400">{ai.avg_estimation_error_percent || 0}%</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <div className="text-xs text-zinc-500">Analyzed</div>
            <div className="text-xl font-bold text-purple-400">{ai.total_analyzed || 0}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span className="text-emerald-400">Under: {ai.overestimated_count || 0}</span>
          <span className="text-white">Accurate: {ai.accurate_count || 0}</span>
          <span className="text-red-400">Over: {ai.underestimated_count || 0}</span>
        </div>
      </div>
    </div>
  );
};


// ============ SYSTEM MODE TOGGLE ============

const MODE_CONFIG = {
  manual: {
    icon: Hand,
    label: 'Manual',
    description: 'You control everything. System only logs alerts.',
    color: 'zinc',
    borderColor: 'border-zinc-700',
    activeColor: 'bg-zinc-800 text-white border-zinc-500',
    badgeColor: 'bg-zinc-700 text-zinc-300',
    iconColor: 'text-zinc-400'
  },
  assisted: {
    icon: Lightbulb,
    label: 'Assisted',
    description: 'System suggests actions, you approve execution.',
    color: 'amber',
    borderColor: 'border-amber-700/50',
    activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500',
    badgeColor: 'bg-amber-500/20 text-amber-400',
    iconColor: 'text-amber-400'
  },
  auto: {
    icon: Cpu,
    label: 'Auto',
    description: 'System executes automatically. Critical actions require approval.',
    color: 'emerald',
    borderColor: 'border-emerald-700/50',
    activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    iconColor: 'text-emerald-400'
  }
};

const SystemModeToggle = ({ mode, onModeChange, updating }) => {
  const currentConfig = MODE_CONFIG[mode] || MODE_CONFIG.manual;
  
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6" data-testid="system-mode-toggle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${mode === 'auto' ? 'bg-emerald-500/10' : mode === 'assisted' ? 'bg-amber-500/10' : 'bg-zinc-800'}`}>
            <Settings className={`w-5 h-5 ${currentConfig.iconColor}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">System Mode</h2>
            <p className="text-xs text-zinc-500">{currentConfig.description}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-xs font-medium ${currentConfig.badgeColor}`}>
          {mode.toUpperCase()}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(MODE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = mode === key;
          
          return (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              disabled={updating || isActive}
              data-testid={`system-mode-${key}-btn`}
              className={`relative group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                isActive 
                  ? config.activeColor
                  : 'border-zinc-800 bg-black/30 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900/50'
              } ${updating ? 'opacity-60 cursor-wait' : isActive ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {updating && !isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                </div>
              )}
              <Icon className={`w-7 h-7 ${isActive ? config.iconColor : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <div className="text-center">
                <div className={`text-sm font-semibold ${isActive ? '' : 'text-zinc-300'}`}>{config.label}</div>
                <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{config.description}</div>
              </div>
              {isActive && (
                <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                  key === 'auto' ? 'bg-emerald-400 animate-pulse' : key === 'assisted' ? 'bg-amber-400' : 'bg-zinc-400'
                }`} />
              )}
            </button>
          );
        })}
      </div>
      
      {mode === 'auto' && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-800/30 bg-amber-500/5">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300">
            <span className="font-medium">Fail-safe active:</span> Critical actions (delete, payment release) always require manual confirmation
          </span>
        </div>
      )}
    </div>
  );
};


// ============ SYSTEM ACTIONS QUEUE ============

const SystemActionsQueue = ({ actions, onRefresh, systemMode }) => {
  const [executing, setExecuting] = useState(null);
  
  const executeAction = async (actionId) => {
    setExecuting(actionId);
    try {
      await axios.post(`${API}/admin/system/execute-action`, { action_id: actionId }, { withCredentials: true });
      onRefresh();
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setExecuting(null);
    }
  };
  
  const getActionIcon = (type) => {
    switch (type) {
      case 'reassign_task': return <Users className="w-4 h-4" />;
      case 'boost_priority': return <Rocket className="w-4 h-4" />;
      case 'force_review': return <Eye className="w-4 h-4" />;
      case 'escalate_project': return <AlertTriangle className="w-4 h-4" />;
      case 'redistribute_load': return <Activity className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded-lg bg-zinc-700 text-zinc-300">Pending</span>;
      case 'awaiting_manual':
        return <span className="px-2 py-0.5 text-xs rounded-lg bg-amber-500/20 text-amber-400">Awaiting Click</span>;
      case 'blocked_requires_manual':
        return <span className="px-2 py-0.5 text-xs rounded-lg bg-red-500/20 text-red-400 flex items-center gap-1"><Lock className="w-3 h-3" />Critical</span>;
      case 'executed':
        return <span className="px-2 py-0.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-400">Executed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs rounded-lg bg-red-500/20 text-red-400">Failed</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-lg bg-zinc-700 text-zinc-300">{status}</span>;
    }
  };

  const modeInfo = MODE_CONFIG[systemMode] || MODE_CONFIG.manual;
  const ModeIcon = modeInfo.icon;
  
  return (
    <div className="rounded-2xl border border-purple-800/50 bg-purple-500/5 p-6" data-testid="system-actions-queue">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">System Actions</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${modeInfo.badgeColor}`}>
            <ModeIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{modeInfo.label}</span>
          </div>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
            {actions?.length || 0} pending
          </span>
        </div>
      </div>
      
      {systemMode === 'manual' && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <Hand className="w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-400">Manual mode active — system only logs, no actions created</span>
        </div>
      )}
      
      {actions && actions.length > 0 ? (
        <div className="space-y-3">
          {actions.slice(0, 6).map((action) => (
            <div 
              key={action.action_id}
              className={`flex items-center justify-between rounded-xl border bg-black/50 p-4 ${
                action.status === 'blocked_requires_manual' ? 'border-red-800/50' :
                action.status === 'awaiting_manual' ? 'border-amber-800/50' :
                'border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  {getActionIcon(action.action_type)}
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {action.label || action.action_type.replace('_', ' ')}
                    {getStatusBadge(action.status)}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">{action.entity_type}: {action.entity_id?.slice(0, 16)}</div>
                </div>
              </div>
              {(action.status === 'pending' || action.status === 'awaiting_manual' || action.status === 'blocked_requires_manual') && (
                <button 
                  onClick={() => executeAction(action.action_id)}
                  disabled={executing === action.action_id}
                  data-testid={`execute-action-${action.action_id}`}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                    action.status === 'blocked_requires_manual' 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {executing === action.action_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    action.status === 'blocked_requires_manual' ? 'Override' : 'Execute'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-zinc-500">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span className="text-sm">No pending system actions</span>
        </div>
      )}
    </div>
  );
};


// ============ LEARNING QUEUE ============

const LearningQueue = ({ candidates, stats, onRefresh }) => {
  const [approving, setApproving] = useState(null);
  const [ignoring, setIgnoring] = useState(null);
  const [editName, setEditName] = useState({});
  
  const handleApprove = async (candidateId, projectTitle) => {
    setApproving(candidateId);
    try {
      const name = editName[candidateId] || projectTitle;
      await axios.post(`${API}/admin/learning/candidates/${candidateId}/approve`, {
        name,
        note: "Approved from Control Center"
      }, { withCredentials: true });
      onRefresh();
    } catch (error) {
      console.error('Approve error:', error);
    } finally {
      setApproving(null);
    }
  };
  
  const handleIgnore = async (candidateId) => {
    setIgnoring(candidateId);
    try {
      await axios.post(`${API}/admin/learning/candidates/${candidateId}/ignore`, {
        note: "Ignored from Control Center"
      }, { withCredentials: true });
      onRefresh();
    } catch (error) {
      console.error('Ignore error:', error);
    } finally {
      setIgnoring(null);
    }
  };
  
  return (
    <div className="rounded-2xl border border-amber-800/30 bg-amber-500/5 p-6" data-testid="learning-queue">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Learning Queue</h2>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">{stats.candidates?.pending || 0} pending</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{stats.candidates?.approved || 0} approved</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{stats.templates?.auto_generated || 0} auto-templates</span>
            </div>
          )}
        </div>
      </div>
      
      {candidates && candidates.length > 0 ? (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <div 
              key={candidate.candidate_id}
              className="rounded-xl border border-amber-800/30 bg-black/50 p-5"
              data-testid={`candidate-${candidate.candidate_id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    {candidate.project_title}
                    <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">Candidate</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">{candidate.project_description?.slice(0, 100)}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-xl font-bold text-emerald-400">{candidate.margin}%</div>
                  <div className="text-xs text-zinc-500">margin</div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-zinc-900/50">
                  <div className="text-sm font-semibold text-white">${candidate.revenue}</div>
                  <div className="text-xs text-zinc-500">Revenue</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-900/50">
                  <div className="text-sm font-semibold text-white">${candidate.cost}</div>
                  <div className="text-xs text-zinc-500">Cost</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-900/50">
                  <div className="text-sm font-semibold text-white">{candidate.completed_tasks}/{candidate.total_tasks}</div>
                  <div className="text-xs text-zinc-500">Tasks</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-900/50">
                  <div className="text-sm font-semibold text-white">{candidate.approved_deliverables}</div>
                  <div className="text-xs text-zinc-500">Approved</div>
                </div>
              </div>
              
              {candidate.tech_stack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {candidate.tech_stack.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400">{tech}</span>
                  ))}
                </div>
              )}
              
              {/* Template name edit */}
              <div className="mb-3">
                <input
                  value={editName[candidate.candidate_id] ?? candidate.project_title}
                  onChange={(e) => setEditName(prev => ({ ...prev, [candidate.candidate_id]: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="Template name"
                  data-testid={`candidate-name-${candidate.candidate_id}`}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleApprove(candidate.candidate_id, candidate.project_title)}
                  disabled={approving === candidate.candidate_id}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid={`approve-candidate-${candidate.candidate_id}`}
                >
                  {approving === candidate.candidate_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save as Template
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleIgnore(candidate.candidate_id)}
                  disabled={ignoring === candidate.candidate_id}
                  className="px-4 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid={`ignore-candidate-${candidate.candidate_id}`}
                >
                  {ignoring === candidate.candidate_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Ignore
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-zinc-500">
          <GraduationCap className="w-5 h-5 mr-2 opacity-50" />
          <span className="text-sm">No template candidates. System learns from successful projects.</span>
        </div>
      )}
    </div>
  );
};


export default AdminControlCenter;
