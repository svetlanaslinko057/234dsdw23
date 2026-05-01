import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  FileText,
  Layers,
  MessageCircle,
  Send,
  Sparkles,
  Zap,
  Calendar,
  Users,
  ExternalLink
} from 'lucide-react';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [scopeItems, setScopeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, deliverablesRes, scopeRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}`, { withCredentials: true }),
        axios.get(`${API}/projects/${projectId}/deliverables`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/projects/${projectId}/scope`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);
      
      setProject(projectRes.data);
      setDeliverables(deliverablesRes.data);
      setScopeItems(scopeRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatHistory([...chatHistory, { 
      id: Date.now(), 
      text: chatMessage, 
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatMessage('');
    // In real app, this would send to backend
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/50">Project not found</p>
        <button onClick={() => navigate('/client/dashboard')} className="mt-4 text-blue-400 hover:text-blue-300">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const stages = [
    { key: 'discovery', label: 'AI Structuring', icon: Sparkles },
    { key: 'scope', label: 'Scope Ready', icon: Layers },
    { key: 'design', label: 'Design', icon: FileText },
    { key: 'development', label: 'Development', icon: Zap },
    { key: 'qa', label: 'Quality Check', icon: CheckCircle2 },
    { key: 'delivery', label: 'Delivered', icon: Download },
  ];
  
  const currentStageIndex = stages.findIndex(s => s.key === project.current_stage);

  return (
    <div className="min-h-screen p-8" data-testid="project-details">
      {/* Back Button */}
      <button
        onClick={() => navigate('/client/dashboard')}
        className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">{project.name}</h1>
            <StatusBadge stage={project.current_stage} />
          </div>
          <ProgressRing progress={Math.round(((currentStageIndex + 1) / stages.length) * 100)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card title="Project Timeline" icon={<Clock className="w-4 h-4 text-blue-400" />}>
            <div className="relative">
              {stages.map((stage, i) => {
                const Icon = stage.icon;
                const isCompleted = i < currentStageIndex;
                const isCurrent = i === currentStageIndex;
                const isPending = i > currentStageIndex;
                
                return (
                  <div key={stage.key} className="flex gap-4 pb-6 last:pb-0">
                    {/* Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-emerald-500/20 border border-emerald-500/30' :
                        isCurrent ? 'bg-blue-500/20 border border-blue-500/30 ring-4 ring-blue-500/10' :
                        'bg-white/5 border border-white/10'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : isCurrent ? (
                          <Icon className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/20" />
                        )}
                      </div>
                      {i < stages.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-2 ${
                          isCompleted ? 'bg-emerald-500/30' : 'bg-white/10'
                        }`} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <h4 className={`font-medium ${
                        isCompleted ? 'text-emerald-400' :
                        isCurrent ? 'text-white' :
                        'text-white/40'
                      }`}>
                        {stage.label}
                        {isCurrent && <span className="ml-2 text-xs text-blue-400 animate-pulse">In progress</span>}
                      </h4>
                      {isCurrent && project.current_stage === 'discovery' && (
                        <p className="text-sm text-white/50 mt-1">AI is analyzing your idea and creating structure...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AI Structure / Scope */}
          {scopeItems.length > 0 && (
            <Card title="AI Structure" icon={<Sparkles className="w-4 h-4 text-violet-400" />}>
              <p className="text-white/50 text-sm mb-4">We've broken your idea into these features:</p>
              <div className="space-y-3">
                {scopeItems.map((item, i) => (
                  <div key={item.scope_item_id || i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                      {i + 1}
                    </div>
                    <div>
                      <h5 className="font-medium">{item.name || item.title}</h5>
                      {item.description && (
                        <p className="text-sm text-white/50 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Deliverables */}
          {deliverables.length > 0 && (
            <Card title="Deliverables" icon={<Download className="w-4 h-4 text-emerald-400" />}>
              <div className="space-y-3">
                {deliverables.map((d) => (
                  <button
                    key={d.deliverable_id}
                    onClick={() => navigate(`/client/deliverable/${d.deliverable_id}`)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium group-hover:text-emerald-400 transition-colors">{d.title}</h5>
                      <p className="text-sm text-white/40">{d.deliverable_type}</p>
                    </div>
                    <DeliverableStatus status={d.status} />
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <div className="space-y-4">
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created" value={new Date(project.created_at).toLocaleDateString()} />
              <InfoRow icon={<Layers className="w-4 h-4" />} label="Features" value={scopeItems.length || '—'} />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="Deliverables" value={deliverables.length || '—'} />
            </div>
          </Card>

          {/* Chat with Team */}
          <Card title="Chat with Team" icon={<MessageCircle className="w-4 h-4 text-blue-400" />}>
            <div className="h-64 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/40">No messages yet</p>
                    <p className="text-xs text-white/30">Ask questions about your project</p>
                  </div>
                ) : (
                  chatHistory.map(msg => (
                    <div key={msg.id} className={`p-3 rounded-xl max-w-[85%] ${
                      msg.sender === 'user' 
                        ? 'bg-blue-500/20 ml-auto' 
                        : 'bg-white/5'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[10px] text-white/30 mt-1">{msg.time}</p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                  data-testid="chat-input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 transition-all"
                  data-testid="send-message-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, icon, children }) => (
  <div className="rounded-2xl bg-[#151922] border border-white/10 overflow-hidden">
    {title && (
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const StatusBadge = ({ stage }) => {
  const config = {
    discovery: { label: 'AI structuring your idea...', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', animate: true },
    scope: { label: 'Scope ready for review', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    design: { label: 'In design phase', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    development: { label: 'Building your product', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    qa: { label: 'Quality assurance', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    delivery: { label: 'Ready for delivery', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  }[stage] || { label: stage, color: 'bg-white/10 text-white/50 border-white/10' };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.color}`}>
      {config.animate && <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
      {config.label}
    </div>
  );
};

const ProgressRing = ({ progress }) => {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
        <circle
          cx="40" cy="40" r="36"
          stroke="url(#gradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{progress}%</span>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-white/40">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const DeliverableStatus = ({ status }) => {
  const config = {
    pending: { label: 'Review', color: 'bg-amber-500/20 text-amber-400' },
    approved: { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-400' },
    rejected: { label: 'Changes requested', color: 'bg-red-500/20 text-red-400' },
  }[status] || { label: status, color: 'bg-white/10 text-white/50' };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default ProjectDetails;
