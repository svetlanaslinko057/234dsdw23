import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Layers,
  Calendar,
  DollarSign,
  Zap,
  MessageCircle,
  Send,
  FileText,
  Download,
  AlertCircle,
  ArrowRight,
  Loader2,
  Eye,
  Package,
  ExternalLink,
  GitBranch,
  Palette,
  Globe,
  Code,
  ChevronRight,
  HelpCircle,
  Plus,
  Activity,
  Lock,
  Unlock,
  CreditCard
} from 'lucide-react';

// ============ CLIENT PROJECT PAGE 2.0 ============
const ClientProjectPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [currentWork, setCurrentWork] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get as project first
      let projectData = null;
      try {
        const projectRes = await axios.get(`${API}/projects/${projectId}`, { withCredentials: true });
        projectData = projectRes.data;
      } catch (e) {
        // Maybe it's a request_id, try that
        try {
          const requestRes = await axios.get(`${API}/requests/${projectId}`, { withCredentials: true });
          projectData = requestRes.data;
        } catch (e2) {
          throw new Error('Project not found');
        }
      }
      
      setProject(projectData);
      
      // Fetch workspace data if project is active
      if (projectData?.project_id) {
        // Fetch full workspace data
        try {
          const workspaceRes = await axios.get(
            `${API}/client/projects/${projectData.project_id}/workspace`, 
            { withCredentials: true }
          );
          setWorkspace(workspaceRes.data);
        } catch (e) {
          console.log('No workspace data yet');
        }

        // Also fetch deliverables separately
        try {
          const deliverablesRes = await axios.get(
            `${API}/projects/${projectData.project_id}/deliverables`, 
            { withCredentials: true }
          );
          setDeliverables(deliverablesRes.data || []);
        } catch (e) {
          console.log('No deliverables yet');
        }
        
        // Fetch current work units (in progress)
        try {
          const workRes = await axios.get(
            `${API}/client/projects/${projectData.project_id}/work-status`, 
            { withCredentials: true }
          );
          setCurrentWork(workRes.data?.in_progress || []);
        } catch (e) {
          console.log('No work data');
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve proposal
  const handleApproveProposal = async () => {
    setApproving(true);
    try {
      // request_id is the projectId for requests
      await axios.post(`${API}/requests/${projectId}/approve-proposal`, {}, { withCredentials: true });
      fetchProjectData(); // Refresh data
    } catch (error) {
      console.error('Error approving proposal:', error);
      alert(error.response?.data?.detail || 'Failed to approve proposal');
    } finally {
      setApproving(false);
    }
  };

  // Reject proposal / request changes
  const handleRequestChanges = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide feedback');
      return;
    }
    setApproving(true);
    try {
      await axios.post(`${API}/requests/${projectId}/request-changes`, {
        reason: rejectReason
      }, { withCredentials: true });
      setShowRejectForm(false);
      setRejectReason('');
      fetchProjectData();
    } catch (error) {
      console.error('Error requesting changes:', error);
      alert(error.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-white/50 mb-6">{error || 'Unable to load project details'}</p>
        <button
          onClick={() => navigate('/client/projects')}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const status = project?.status || project?.current_stage || 'idea_submitted';
  const isActive = ['active', 'development', 'design', 'qa', 'discovery', 'scope'].includes(status);
  const progress = project?.progress || 0;

  // Timeline steps
  const timelineSteps = [
    { id: 'idea', title: 'Idea Submitted', icon: Sparkles },
    { id: 'proposal', title: 'Proposal Approved', icon: FileText },
    { id: 'development', title: 'Development', icon: Code },
    { id: 'delivery', title: 'Delivery', icon: Package },
    { id: 'completed', title: 'Completed', icon: CheckCircle2 }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'completed') return 4;
    if (status === 'delivery') return 3;
    if (['active', 'development', 'design', 'qa', 'discovery', 'scope'].includes(status)) return 2;
    if (status === 'proposal_ready') return 1;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto" data-testid="client-project-page-v2">
      {/* Back Button — properly spaced */}
      <button
        onClick={() => navigate('/client/projects')}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        data-testid="back-to-projects"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* ============ HERO BLOCK ============ */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#151922] to-[#0d1015] p-6" data-testid="project-hero">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              {project.name || project.title || 'Project'}
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              {isActive && (
                <span className="text-sm text-white/50">
                  Started {new Date(project.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{progress}%</div>
            <div className="text-sm text-white/50">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Next Step */}
        {isActive && (
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-blue-400" />
            <span className="text-white/70">Next:</span>
            <span className="text-white font-medium">
              {deliverables.filter(d => d.status === 'pending_approval').length > 0 
                ? 'Review pending deliverables'
                : 'Development in progress'}
            </span>
          </div>
        )}
      </div>

      {/* ============ AI ESTIMATE BLOCK (показываем первым если есть) ============ */}
      {project?.ai_analysis && (
        <AIEstimateBlock analysis={project.ai_analysis} />
      )}

      {/* ============ CURRENT STATE BLOCK ============ */}
      <CurrentStateBlock 
        status={status}
        project={project}
        onApprove={handleApproveProposal}
        onRequestChanges={() => setShowRejectForm(true)}
        approving={approving}
        showRejectForm={showRejectForm}
        setShowRejectForm={setShowRejectForm}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleRequestChanges={handleRequestChanges}
      />

      {/* ============ TIMELINE ============ */}
      <div className="rounded-2xl border border-white/10 bg-[#151922] p-6" data-testid="project-timeline">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Project Timeline
        </h2>
        <div className="flex items-center justify-between">
          {timelineSteps.map((step, index) => {
            const Icon = step.icon;
            const isDone = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full">
                  {/* Line before */}
                  {index > 0 && (
                    <div className={`absolute left-0 right-1/2 h-0.5 -translate-y-1/2 top-1/2 ${
                      isDone || isCurrent ? 'bg-emerald-500' : 'bg-white/10'
                    }`} />
                  )}
                  {/* Line after */}
                  {index < timelineSteps.length - 1 && (
                    <div className={`absolute left-1/2 right-0 h-0.5 -translate-y-1/2 top-1/2 ${
                      isDone ? 'bg-emerald-500' : 'bg-white/10'
                    }`} />
                  )}
                  {/* Circle */}
                  <div className={`relative mx-auto w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    isDone ? 'bg-emerald-500/20 border-2 border-emerald-500' :
                    isCurrent ? 'bg-blue-500/20 border-2 border-blue-500 ring-4 ring-blue-500/20' :
                    'bg-white/5 border-2 border-white/20'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-blue-400' : 'text-white/30'}`} />
                    )}
                  </div>
                </div>
                <span className={`text-xs mt-3 text-center ${
                  isDone ? 'text-emerald-400' :
                  isCurrent ? 'text-white font-medium' :
                  'text-white/40'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ PRODUCTION WORKSPACE (only for active projects) ============ */}
      {['active', 'development', 'design', 'qa', 'discovery', 'scope'].includes(status) && (
        <ProductionWorkspace workspace={workspace} project={project} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ DELIVERABLES (Main Block) ============ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#151922] p-6" data-testid="deliverables-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Deliverables
              </h2>
              {deliverables.length > 0 && (
                <span className="text-sm text-white/50">{deliverables.length} items</span>
              )}
            </div>

            {deliverables.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No deliverables yet</p>
                <p className="text-xs mt-1">You'll see completed work packages here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliverables.map(deliverable => (
                  <DeliverableCard 
                    key={deliverable.deliverable_id} 
                    deliverable={deliverable}
                    onRefresh={fetchProjectData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ============ CURRENT WORK ============ */}
          {currentWork.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#151922] p-6" data-testid="current-work-section">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Currently in Progress
              </h2>
              <div className="space-y-2">
                {currentWork.map((unit, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-sm text-white/80">{unit.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============ RIGHT SIDEBAR ============ */}
        <div className="space-y-6">
          {/* Support Block */}
          <div className="rounded-2xl border border-white/10 bg-[#151922] p-6" data-testid="support-block">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              Need Help?
            </h3>
            <p className="text-sm text-white/50 mb-4">
              Questions about your project? Our team is here to help.
            </p>
            <Link
              to="/client/support"
              className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              data-testid="create-ticket-btn"
            >
              <MessageCircle className="w-4 h-4" />
              Create Ticket
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="rounded-2xl border border-white/10 bg-[#151922] p-6">
            <h3 className="text-sm font-medium text-white/50 mb-4">Project Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Deliverables</span>
                <span className="font-semibold">{deliverables.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Approved</span>
                <span className="font-semibold text-emerald-400">
                  {deliverables.filter(d => d.status === 'approved').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Pending Review</span>
                <span className="font-semibold text-amber-400">
                  {deliverables.filter(d => d.status === 'pending_approval').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ DELIVERABLE CARD ============
const DeliverableCard = ({ deliverable, onRefresh }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const isPending = deliverable.status === 'pending_approval';
  const isApproved = deliverable.status === 'approved';
  const isRejected = deliverable.status === 'rejected' || deliverable.status === 'revision_requested';
  const isPendingPayment = deliverable.status === 'pending_payment';
  const isAvailable = deliverable.status === 'available';
  const isLocked = isPendingPayment;
  const isUnlocked = isAvailable || isApproved;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await axios.post(
        `${API}/deliverables/${deliverable.deliverable_id}/approve`,
        {},
        { withCredentials: true }
      );
      onRefresh();
    } catch (error) {
      alert('Failed to approve deliverable');
    } finally {
      setApproving(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const response = await axios.post(
        `${API}/client/deliverables/${deliverable.deliverable_id}/pay`,
        {},
        { withCredentials: true }
      );
      
      if (response.data?.payment_url) {
        // Navigate to payment page
        window.location.href = response.data.payment_url;
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback');
      return;
    }
    setRejecting(true);
    try {
      await axios.post(
        `${API}/deliverables/${deliverable.deliverable_id}/reject?feedback=${encodeURIComponent(feedback)}`,
        {},
        { withCredentials: true }
      );
      onRefresh();
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setRejecting(false);
      setShowFeedback(false);
      setFeedback('');
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'repo':
      case 'github':
        return <GitBranch className="w-4 h-4" />;
      case 'figma':
        return <Palette className="w-4 h-4" />;
      case 'demo':
        return <Globe className="w-4 h-4" />;
      case 'api':
        return <Code className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div 
      className={`rounded-xl border transition-all ${
        isPendingPayment ? 'border-amber-500/30 bg-amber-500/5' :
        isAvailable ? 'border-emerald-500/30 bg-emerald-500/5' :
        isPending ? 'border-violet-500/30 bg-violet-500/5' :
        isApproved ? 'border-emerald-500/30 bg-emerald-500/5' :
        isRejected ? 'border-red-500/30 bg-red-500/5' :
        'border-white/10 bg-black/20'
      }`}
      data-testid={`deliverable-card-${deliverable.deliverable_id}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {/* Lock/Unlock Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPendingPayment ? 'bg-amber-500/20' :
            isAvailable ? 'bg-emerald-500/20' :
            isPending ? 'bg-violet-500/20' :
            isApproved ? 'bg-emerald-500/20' :
            isRejected ? 'bg-red-500/20' :
            'bg-white/10'
          }`}>
            {isPendingPayment ? (
              <Lock className={`w-5 h-5 text-amber-400`} />
            ) : isAvailable ? (
              <Unlock className={`w-5 h-5 text-emerald-400`} />
            ) : (
              <Package className={`w-5 h-5 ${
                isPending ? 'text-violet-400' :
                isApproved ? 'text-emerald-400' :
                isRejected ? 'text-red-400' :
                'text-white/50'
              }`} />
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">{deliverable.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/40">Version {deliverable.version}</span>
              <StatusBadge status={deliverable.status} small />
              {isPendingPayment && deliverable.price && (
                <span className="text-xs font-semibold text-amber-400">${deliverable.price.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-white/30 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-black/20">
            <p className="text-sm text-white/70 whitespace-pre-wrap">{deliverable.summary}</p>
          </div>

          {/* Features/Blocks */}
          {deliverable.blocks?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white/50 mb-2">Features</h4>
              <div className="space-y-2">
                {deliverable.blocks.map((block, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{block.title}</div>
                      {block.description && (
                        <div className="text-xs text-white/50 mt-1">{block.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {deliverable.resources?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white/50 mb-2">Resources</h4>
              <div className="flex flex-wrap gap-2">
                {deliverable.resources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm transition-colors"
                  >
                    {getResourceIcon(resource.resource_type)}
                    {resource.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions for Pending */}
          {isPending && (
            <div className="pt-4 border-t border-white/10">
              {!showFeedback ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="approve-deliverable-btn"
                  >
                    {approving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="px-4 py-3 border border-white/20 hover:bg-white/5 text-white/70 rounded-xl transition-colors"
                    data-testid="request-changes-btn"
                  >
                    Request Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What changes would you like to see?"
                    className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                    data-testid="feedback-textarea"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={rejecting || !feedback.trim()}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                      data-testid="submit-feedback-btn"
                    >
                      {rejecting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Feedback'}
                    </button>
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="px-4 py-2 border border-white/20 hover:bg-white/5 text-white/70 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions for Pending Payment - LOCKED */}
          {isPendingPayment && (
            <div className="pt-4 border-t border-amber-500/20">
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Payment Required</div>
                    <div className="text-xs text-white/50">Unlock this deliverable to access all resources</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">${deliverable.price?.toLocaleString()}</div>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="mt-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    data-testid="pay-deliverable-btn"
                  >
                    {paying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay & Unlock
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions for Available - UNLOCKED */}
          {isAvailable && (
            <div className="pt-4 border-t border-emerald-500/20">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <Unlock className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Deliverable Unlocked</div>
                    <div className="text-xs text-white/50">Full access to all resources and documentation</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Paid</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============ PRODUCTION WORKSPACE ============
const ProductionWorkspace = ({ workspace, project }) => {
  if (!workspace && !project?.project_id) {
    // No data yet - show placeholder
    return (
      <div className="rounded-2xl border border-white/10 bg-[#151922] p-6" data-testid="workspace-loading">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Production Workspace</h2>
        </div>
        <div className="text-center py-8 text-white/40">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
          <p className="text-sm">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  const {
    total_tasks = 0,
    done_tasks = 0,
    progress_percent = 0,
    in_progress = [],
    under_review = [],
    recent_done = [],
    pending_count = 0,
    next_step = 'Planning',
    deliverables_count = 0,
    pending_approval = 0
  } = workspace || {};

  return (
    <div className="rounded-2xl border border-white/10 bg-[#151922] p-6" data-testid="production-workspace">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Production Workspace</h2>
            <p className="text-xs text-white/40">Real-time project status</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Active</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <div className="text-3xl font-bold text-white">{progress_percent}%</div>
          <div className="text-xs text-white/40 mt-1">Progress</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <div className="text-3xl font-bold text-white">{done_tasks}<span className="text-lg text-white/40">/{total_tasks}</span></div>
          <div className="text-xs text-white/40 mt-1">Tasks done</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <div className="text-3xl font-bold text-amber-400">{in_progress.length}</div>
          <div className="text-xs text-white/40 mt-1">In progress</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <div className="text-3xl font-bold text-violet-400">{under_review.length}</div>
          <div className="text-xs text-white/40 mt-1">Under review</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/50 mb-2">
          <span>Overall Progress</span>
          <span>{done_tasks} of {total_tasks} tasks completed</span>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progress_percent}%` }}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* In Progress */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Currently Building
          </h3>
          {in_progress.length === 0 ? (
            <div className="text-xs text-white/30 py-2">No tasks in progress</div>
          ) : (
            <div className="space-y-2">
              {in_progress.slice(0, 5).map((task, i) => (
                <div key={task.unit_id || i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-white/80 truncate">{task.title}</span>
                </div>
              ))}
              {in_progress.length > 5 && (
                <div className="text-xs text-white/40 pt-1">+{in_progress.length - 5} more</div>
              )}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Recently Completed
          </h3>
          {recent_done.length === 0 ? (
            <div className="text-xs text-white/30 py-2">No completed tasks yet</div>
          ) : (
            <div className="space-y-2">
              {recent_done.slice(0, 5).map((task, i) => (
                <div key={task.unit_id || i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/60 truncate">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Under Review */}
      {under_review.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
          <h3 className="text-sm font-medium text-violet-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Under QA Review
          </h3>
          <div className="space-y-2">
            {under_review.slice(0, 3).map((task, i) => (
              <div key={task.unit_id || i} className="flex items-center gap-2 text-sm">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span className="text-white/70 truncate">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Step */}
      <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="text-xs text-blue-400 font-medium">NEXT STEP</div>
          <div className="text-sm text-white/80">{next_step}</div>
        </div>
      </div>

      {/* Deliverables summary */}
      {deliverables_count > 0 && (
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/70">{deliverables_count} deliverable(s)</span>
          </div>
          {pending_approval > 0 && (
            <span className="text-xs text-amber-400">{pending_approval} awaiting approval</span>
          )}
        </div>
      )}
    </div>
  );
};


// ============ AI ESTIMATE BLOCK ============
const AIEstimateBlock = ({ analysis }) => {
  if (!analysis) return null;
  
  const estimate = analysis?.estimate || analysis;
  const price = estimate?.recommended_price || estimate?.final_price || estimate?.price;
  const hours = estimate?.avg_hours || estimate?.hours || estimate?.total_hours;
  const weeks = estimate?.estimated_weeks || estimate?.timeline_weeks;
  const templateName = estimate?.template_name;
  const confidence = estimate?.confidence;
  const tasks = estimate?.tasks || estimate?.breakdown || [];
  
  if (!price && !hours) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-6" data-testid="ai-estimate-block">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">AI Cost Estimate</h3>
          <p className="text-white/50 text-sm">Preliminary assessment based on similar projects</p>
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {price && (
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Estimated Cost</p>
            <p className="text-2xl font-bold text-emerald-400">${typeof price === 'number' ? price.toLocaleString() : price}</p>
          </div>
        )}
        {hours && (
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Hours</p>
            <p className="text-2xl font-bold text-white">{hours}h</p>
          </div>
        )}
        {weeks && (
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Timeline</p>
            <p className="text-2xl font-bold text-white">{weeks} weeks</p>
          </div>
        )}
      </div>

      {/* Confidence & template */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        {confidence && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {(confidence * 100).toFixed(0)}% confidence
          </span>
        )}
        {templateName && (
          <span>Based on: {templateName}</span>
        )}
      </div>

      {/* Task breakdown if available */}
      {Array.isArray(tasks) && tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Task Breakdown</p>
          <div className="space-y-1.5">
            {tasks.slice(0, 8).map((task, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{task.name || task.title || task}</span>
                {task.hours && <span className="text-white/40">{task.hours}h</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ============ CURRENT STATE BLOCK ============
const CurrentStateBlock = ({ 
  status, 
  project, 
  onApprove, 
  onRequestChanges,
  approving,
  showRejectForm,
  setShowRejectForm,
  rejectReason,
  setRejectReason,
  handleRequestChanges
}) => {
  const proposal = project?.proposal;

  // IDEA SUBMITTED
  if (status === 'idea_submitted' || status === 'pending') {
    return (
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6" data-testid="state-idea-submitted">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">We Received Your Idea</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Our team will review your project idea shortly and prepare the next steps. 
              You'll be notified when we have updates.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-400">
              <Clock className="w-4 h-4" />
              <span>Estimated response: 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REVIEWING
  if (status === 'reviewing') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6" data-testid="state-reviewing">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Project</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              We're breaking down your idea into features, estimating complexity, and preparing 
              a detailed proposal with timeline and pricing.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white/70">Idea received</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-amber-400">Analyzing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Circle className="w-4 h-4 text-white/30" />
                <span className="text-white/40">Proposal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PROPOSAL READY
  if (status === 'proposal_ready') {
    return (
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6" data-testid="state-proposal-ready">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Your Proposal is Ready</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              We've analyzed your idea and prepared a detailed proposal. Review the details below 
              and approve to start production.
            </p>
          </div>
        </div>

        {/* Proposal Details */}
        {proposal && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-black/30 rounded-xl">
              <h4 className="text-sm font-medium text-white/50 mb-2">Summary</h4>
              <p className="text-white/80 text-sm">{proposal.summary}</p>
            </div>

            {/* Features */}
            {proposal.features && proposal.features.length > 0 && (
              <div className="p-4 bg-black/30 rounded-xl">
                <h4 className="text-sm font-medium text-white/50 mb-3">Included Features</h4>
                <div className="space-y-2">
                  {proposal.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-white/90 text-sm font-medium">{feature.title}</span>
                        {feature.description && (
                          <p className="text-white/50 text-xs mt-0.5">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing & Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/30 rounded-xl">
                <h4 className="text-sm font-medium text-white/50 mb-1">Timeline</h4>
                <p className="text-xl font-semibold text-white">
                  {proposal.timeline_text || 'TBD'}
                </p>
              </div>
              <div className="p-4 bg-black/30 rounded-xl">
                <h4 className="text-sm font-medium text-white/50 mb-1">Estimated Cost</h4>
                <p className="text-xl font-semibold text-white">
                  {proposal.estimated_cost ? `$${proposal.estimated_cost.toLocaleString()}` : 'TBD'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {proposal.notes && (
              <div className="p-4 bg-black/30 rounded-xl">
                <h4 className="text-sm font-medium text-white/50 mb-2">Notes</h4>
                <p className="text-white/70 text-sm">{proposal.notes}</p>
              </div>
            )}

            {/* Actions */}
            {!showRejectForm ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onApprove}
                  disabled={approving}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="approve-proposal-btn"
                >
                  {approving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Accept & Start Project
                    </>
                  )}
                </button>
                <button
                  onClick={onRequestChanges}
                  className="px-6 py-3 border border-white/20 hover:bg-white/5 text-white/70 font-medium rounded-xl transition-colors"
                  data-testid="request-changes-btn"
                >
                  Request Changes
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tell us what you'd like to change..."
                  className="w-full h-24 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                  data-testid="reject-reason-input"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleRequestChanges}
                    disabled={approving || !rejectReason.trim()}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    data-testid="submit-changes-btn"
                  >
                    {approving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Feedback'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-6 py-3 border border-white/20 hover:bg-white/5 text-white/70 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ACTIVE / IN DEVELOPMENT - Show workspace preview
  if (['active', 'development', 'design', 'qa', 'discovery', 'scope'].includes(status)) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6" data-testid="state-active">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">Project in Progress</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Your project is now in production. Our team is actively building your product. 
              You can track progress and upcoming deliverables below.
            </p>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400">Active development</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETED
  if (status === 'completed') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6" data-testid="state-completed">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Project Completed</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Your project is complete! All deliverables have been approved and shipped. 
              Need additional features or support? Let us know.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // REJECTED
  if (status === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6" data-testid="state-rejected">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Project Not Accepted</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Unfortunately, we couldn't proceed with this project. 
              {project?.rejection_reason && (
                <span className="block mt-2 text-red-400/80">Reason: {project.rejection_reason}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ============ STATUS BADGE ============
const StatusBadge = ({ status, small = false }) => {
  const config = {
    'idea_submitted': { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    'reviewing': { label: 'Under Review', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    'proposal_ready': { label: 'Proposal Ready', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
    'active': { label: 'In Progress', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    'development': { label: 'In Development', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    'design': { label: 'Design Phase', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    'qa': { label: 'QA Testing', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    'discovery': { label: 'Discovery', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    'scope': { label: 'Scoping', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    'delivery': { label: 'Delivery', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    'completed': { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    'rejected': { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    'pending_approval': { label: 'Ready for Review', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    'pending': { label: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    'approved': { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    'revision_requested': { label: 'Changes Requested', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  };

  const cfg = config[status] || { label: status, color: 'bg-white/10 text-white/70 border-white/20' };

  return (
    <span className={`${small ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-medium rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

export default ClientProjectPage;
