import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  Play,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ClipboardList
} from 'lucide-react';

const DeveloperAssignments = () => {
  const navigate = useNavigate();
  const [workUnits, setWorkUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

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

  const tabs = [
    { id: 'active', label: 'Active', filter: u => ['assigned', 'in_progress'].includes(u.status) },
    { id: 'review', label: 'In Review', filter: u => ['submitted', 'validation'].includes(u.status) },
    { id: 'revision', label: 'Revision', filter: u => u.status === 'revision' },
    { id: 'completed', label: 'Completed', filter: u => u.status === 'completed' },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const filteredUnits = workUnits.filter(currentTab.filter);

  const sortedUnits = [...filteredUnits].sort((a, b) => {
    if (a.status === 'revision' && b.status !== 'revision') return -1;
    if (b.status === 'revision' && a.status !== 'revision') return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" data-testid="developer-assignments">
      {/* Background */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Header */}
      <div className="relative mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
        <p className="text-white/40 mt-2">All your assigned work units</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 mb-8 w-fit">
        {tabs.map((tab) => {
          const count = workUnits.filter(tab.filter).length;
          const isRevision = tab.id === 'revision' && count > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? isRevision 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-lg ${
                  activeTab === tab.id 
                    ? 'bg-white/20' 
                    : isRevision ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {sortedUnits.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#151922] p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 mx-auto mb-6 flex items-center justify-center">
            <ClipboardList className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No tasks here</h3>
          <p className="text-white/40">Tasks matching this filter will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedUnits.map((unit) => (
            <AssignmentCard 
              key={unit.unit_id} 
              unit={unit} 
              onClick={() => navigate(`/developer/work/${unit.unit_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AssignmentCard = ({ unit, onClick }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'assigned':
        return { icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'New' };
      case 'in_progress':
        return { icon: Play, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'In Progress' };
      case 'submitted':
        return { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Submitted' };
      case 'validation':
        return { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Validating' };
      case 'revision':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Fix Required' };
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Done' };
      default:
        return { icon: Clock, color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10', label: status };
    }
  };

  const config = getStatusConfig(unit.status);
  const Icon = config.icon;
  const isRevision = unit.status === 'revision';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 flex items-center justify-between transition-all group ${
        isRevision 
          ? 'border border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent hover:from-red-500/15' 
          : 'border border-white/10 bg-[#151922] hover:border-blue-500/30 hover:bg-[#0D0D14]'
      }`}
      data-testid={`assignment-${unit.unit_id}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} border ${config.border}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">{unit.title}</div>
          <div className="text-sm text-white/40 mt-0.5 flex items-center gap-2">
            <span>{unit.project_name || 'Project'}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{unit.estimated_hours}h estimated</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1.5 text-xs rounded-lg border ${config.bg} ${config.color} ${config.border}`}>
          {config.label}
        </span>
        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-blue-400 transition-colors" />
      </div>
    </button>
  );
};

export default DeveloperAssignments;
