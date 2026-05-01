import { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import axios from 'axios';
import { TrendingUp, RefreshCw } from 'lucide-react';

// Components
import ProfitHeader from '@/components/profit/ProfitHeader';
import ProfitSignalsPanel from '@/components/profit/ProfitSignalsPanel';
import ProjectProfitTable from '@/components/profit/ProjectProfitTable';
import ProjectProfitDetailSheet from '@/components/profit/ProjectProfitDetailSheet';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminProfitControl = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [signals, setSignals] = useState([]);
  
  // UI states
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchProfitData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [overviewRes, projectsRes, signalsRes] = await Promise.all([
        axios.get(`${API}/admin/profit/overview`, { withCredentials: true }),
        axios.get(`${API}/admin/profit/projects`, { withCredentials: true }),
        axios.get(`${API}/admin/profit/signals`, { withCredentials: true })
      ]);

      setOverview(overviewRes.data);
      setProjects(projectsRes.data.projects || []);
      setSignals(signalsRes.data.signals || []);
    } catch (error) {
      console.error('Error fetching profit data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchProfitData();
    }
  }, [user]);

  const handleRefresh = () => {
    fetchProfitData(true);
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setIsDetailOpen(true);
  };

  const handleNavigateToProject = (projectId) => {
    setSelectedProjectId(projectId);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-admin)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-[color:var(--info)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-admin)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-card">
              <TrendingUp className="w-6 h-6 text-[color:var(--info)]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text-admin)]">
                Profit Control
              </h1>
              <p className="text-sm text-[color:var(--text-admin-secondary)] mt-1">
                Revenue, margin, and profitability intelligence
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-[color:var(--info)] transition-colors text-sm font-medium text-[color:var(--text-admin)] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* 1. Profit Header - KPIs */}
          <ProfitHeader overview={overview} />

          {/* 2. Profit Risk Signals */}
          <ProfitSignalsPanel signals={signals} onNavigate={handleNavigateToProject} />

          {/* 3. Project Profit Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-[color:var(--text-admin)]">
              Project Profitability
            </h3>
            <ProjectProfitTable projects={projects} onSelectProject={handleSelectProject} />
          </div>
        </div>

        {/* 4. Project Detail Sheet */}
        <ProjectProfitDetailSheet 
          projectId={selectedProjectId}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedProjectId(null);
          }}
        />
      </div>
    </div>
  );
};

export default AdminProfitControl;
