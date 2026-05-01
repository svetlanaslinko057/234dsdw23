import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { ArrowRight, Sparkles, Zap, Clock, CheckCircle2, MessageCircle, ChevronRight, Layers, Calendar, DollarSign, X } from 'lucide-react';
import AIRecommendationsPanel from '@/components/AIRecommendationsPanel';

const ClientHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [newProjectId, setNewProjectId] = useState(null);
  
  const MIN_CHARS = 50;
  const isValidIdea = idea.trim().length >= MIN_CHARS;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects/mine`, { withCredentials: true });
      setProjects(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async () => {
    if (!isValidIdea || submitting) return;
    setSubmitting(true);
    
    try {
      const res = await axios.post(`${API}/requests`, {
        title: idea.slice(0, 100),
        description: idea,
        business_idea: idea,
      }, { withCredentials: true });
      
      // Trigger AI estimate in background
      const requestId = res.data.request_id;
      try {
        const [estimateRes] = await Promise.allSettled([
          axios.post(`${API}/ai/estimate-price`, { idea }, { withCredentials: true }),
        ]);
        if (estimateRes.status === 'fulfilled' && estimateRes.value?.data) {
          await axios.patch(`${API}/requests/${requestId}`, {
            ai_analysis: estimateRes.value.data
          }, { withCredentials: true });
        }
      } catch (aiErr) {
        console.warn('AI estimate failed (non-blocking):', aiErr);
      }
      
      // Redirect to project page
      navigate(`/client/project/${requestId}`, { 
        state: { isNew: true, idea: idea } 
      });
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to create project. Please try again.'
      });
      setTimeout(() => setToast(null), 5000);
      setSubmitting(false);
    }
  };

  const activeProject = projects.find(p => ['active', 'in_progress', 'discovery', 'scope', 'design', 'development'].includes(p.status || p.current_stage));

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto" data-testid="client-hub">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="rounded-3xl bg-card border border-border p-10 relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">AI Product Builder</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 leading-tight">
              What do you want<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400">to build?</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Describe your idea and we'll structure it into features, timeline and start building.
            </p>

            {/* Input — larger field for detailed TZ */}
            <div className="relative mb-4">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Опишите вашу идею подробно: что за продукт, для кого, какие ключевые функции, какие интеграции нужны, примеры аналогов..."
                className={`w-full h-52 bg-background border-2 rounded-2xl px-6 py-5 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-base leading-relaxed transition-all caret-blue-400 selection:bg-blue-500/30 ${
                  idea.length > 0 && !isValidIdea 
                    ? 'border-amber-500/60 focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                    : 'border-border focus:border-blue-500 focus:shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                }`}
                data-testid="idea-input"
              />
            </div>
            
            {/* Character counter & validation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {idea.length > 0 && !isValidIdea && (
                  <span className="text-sm text-amber-400">
                    Minimum {MIN_CHARS} characters required
                  </span>
                )}
                {isValidIdea && (
                  <span className="text-sm text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready to submit
                  </span>
                )}
              </div>
              <span className={`text-sm font-mono ${
                idea.length >= MIN_CHARS ? 'text-emerald-400' : 'text-muted-foreground'
              }`}>
                {idea.length} / {MIN_CHARS}
              </span>
            </div>

            <button
              onClick={handleStartProject}
              disabled={!isValidIdea || submitting}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl flex items-center gap-3 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="start-project-btn"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  Start Project
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* What we do */}
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">We will:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FeaturePill icon={<Layers className="w-4 h-4" />} text="Break into features" />
                <FeaturePill icon={<Calendar className="w-4 h-4" />} text="Define timeline" />
                <FeaturePill icon={<DollarSign className="w-4 h-4" />} text="Estimate cost" />
                <FeaturePill icon={<Zap className="w-4 h-4" />} text="Start building" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      <section className="mb-8">
        <AIRecommendationsPanel compact />
      </section>

      {/* Active Project */}
      {activeProject && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Active Project
            </h2>
          </div>
          
          <button
            onClick={() => navigate(`/client/projects/${activeProject.project_id}`)}
            className="w-full text-left rounded-2xl bg-[#151922] border border-border p-6 hover:border-blue-500/30 hover:bg-[#1a1f2a] transition-all group"
            data-testid={`project-${activeProject.project_id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">{activeProject.name}</h3>
                <ProjectStatus status={activeProject.current_stage || activeProject.status} />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            
            <ProjectProgress stage={activeProject.current_stage} />
          </button>
        </section>
      )}

      {/* Projects List */}
      {projects.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Projects</h2>
            <span className="text-sm text-muted-foreground">{projects.length} total</span>
          </div>
          
          <div className="space-y-3">
            {projects.slice(0, 5).map(project => (
              <ProjectCard 
                key={project.project_id} 
                project={project} 
                onClick={() => navigate(`/client/projects/${project.project_id}`)}
              />
            ))}
          </div>
          
          {projects.length > 5 && (
            <button
              onClick={() => navigate('/client/projects')}
              className="w-full mt-4 py-3 text-center text-sm text-muted-foreground hover:text-white border border-border rounded-xl hover:border-border transition-all"
            >
              View all {projects.length} projects
            </button>
          )}
        </section>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && !newProjectId && (
        <section className="rounded-2xl bg-[#151922] border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">You haven't built anything yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start your first product in 2 minutes. Describe your idea above and we'll break it into features, timeline and cost.
          </p>
        </section>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 max-w-md p-4 rounded-2xl shadow-2xl border animate-slide-up ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${
                toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}>{toast.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
              {toast.type === 'success' && (
                <button
                  onClick={() => navigate('/client/projects')}
                  className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  View Projects <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FeaturePill = ({ icon, text }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
    <span className="text-blue-400">{icon}</span>
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

const ProjectStatus = ({ status }) => {
  const config = {
    discovery: { label: 'AI structuring...', color: 'text-violet-400', animate: true },
    scope: { label: 'Scope ready', color: 'text-blue-400' },
    design: { label: 'In design', color: 'text-cyan-400' },
    development: { label: 'In development', color: 'text-emerald-400' },
    qa: { label: 'Quality check', color: 'text-amber-400' },
    delivery: { label: 'Ready for delivery', color: 'text-green-400' },
    completed: { label: 'Completed', color: 'text-emerald-400' },
    active: { label: 'Active', color: 'text-blue-400' },
  }[status] || { label: status, color: 'text-muted-foreground' };

  return (
    <div className={`flex items-center gap-2 mt-1 text-sm ${config.color}`}>
      {config.animate && <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
      {config.label}
    </div>
  );
};

const ProjectProgress = ({ stage }) => {
  const stages = ['discovery', 'scope', 'design', 'development', 'qa', 'delivery'];
  const currentIndex = stages.indexOf(stage) + 1;
  const progress = Math.round((currentIndex / stages.length) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">Progress</span>
        <span className="text-muted-foreground font-mono">{progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onClick }) => {
  const stages = ['discovery', 'scope', 'design', 'development', 'qa', 'delivery'];
  const currentIndex = stages.indexOf(project.current_stage) + 1;
  const progress = Math.round((currentIndex / stages.length) * 100);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-[#151922] border border-border hover:border-border hover:bg-[#1a1f2a] transition-all group flex items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-blue-400 transition-colors">{project.name}</h4>
        <p className="text-sm text-muted-foreground capitalize">{project.current_stage}</p>
      </div>
      <div className="w-24">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
    </button>
  );
};

export default ClientHub;
