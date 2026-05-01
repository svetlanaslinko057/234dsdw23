import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  GitBranch
} from 'lucide-react';

const ClientVersionsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [versions, setVersions] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [versionsRes, projectsRes] = await Promise.all([
          axios.get(`${API}/projects/${projectId}/versions`, { withCredentials: true }),
          axios.get(`${API}/client/projects`, { withCredentials: true })
        ]);
        
        setVersions(versionsRes.data);
        const proj = projectsRes.data.find(p => p.project_id === projectId);
        setProject(proj);
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'revision_requested':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-white/40" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'revision_requested':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" data-testid="versions-page">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">Version History</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{project?.name || 'Project'}</h1>
          <p className="text-white/50 mt-2">All delivered versions of your product</p>
        </div>

        {/* Timeline */}
        {versions.length === 0 ? (
          <div className="border border-white/10 border-dashed rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No deliveries yet</h3>
            <p className="text-white/50 text-sm">Versions will appear here as they are delivered</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
            
            <div className="space-y-6">
              {versions.map((version, index) => (
                <div 
                  key={version.deliverable_id}
                  className="relative pl-16"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-6 w-5 h-5 rounded-full bg-[#0A0A0A] border-2 border-white/20 flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      version.status === 'approved' ? 'bg-emerald-400' :
                      version.status === 'pending' ? 'bg-amber-400' :
                      'bg-red-400'
                    }`} />
                  </div>

                  <button
                    onClick={() => navigate(`/client/deliverable/${version.deliverable_id}`)}
                    className="w-full text-left border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getStatusIcon(version.status)}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">{version.version}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-lg border ${getStatusBadge(version.status)}`}>
                              {version.status === 'revision_requested' ? 'Changes Requested' : version.status}
                            </span>
                          </div>
                          <p className="text-white/60">{version.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-white/40 text-sm">
                            <span>{version.blocks_count} features</span>
                            <span>•</span>
                            <span>{new Date(version.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientVersionsPage;
