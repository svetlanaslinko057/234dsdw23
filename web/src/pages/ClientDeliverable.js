import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Clock,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Download,
  GitBranch,
  Globe,
  FileCode
} from 'lucide-react';

const ClientDeliverable = () => {
  const { deliverableId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [deliverable, setDeliverable] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes] = await Promise.all([
        axios.get(`${API}/projects/mine`, { withCredentials: true })
      ]);
      
      for (const proj of projectsRes.data) {
        try {
          const delRes = await axios.get(`${API}/projects/${proj.project_id}/deliverables`, { withCredentials: true });
          const found = delRes.data.find(d => d.deliverable_id === deliverableId);
          if (found) {
            setDeliverable(found);
            setProject(proj);
            break;
          }
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error fetching deliverable:', error);
    } finally {
      setLoading(false);
    }
  }, [deliverableId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/deliverables/${deliverableId}/approve`, {
        feedback: feedback || 'Approved'
      }, { withCredentials: true });
      await fetchData();
      setShowFeedback(false);
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setActionLoading(true);
    try {
      await axios.post(`${API}/deliverables/${deliverableId}/reject`, {
        feedback: feedback.trim()
      }, { withCredentials: true });
      await fetchData();
      setShowFeedback(false);
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-4">Deliverable not found</p>
          <button 
            onClick={() => navigate('/client/dashboard')} 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPending = deliverable.status === 'pending';
  const isApproved = deliverable.status === 'approved';

  return (
    <div className="min-h-screen p-8" data-testid="client-deliverable">
      {/* Background */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-8 px-3 py-2 rounded-xl hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Status Banner */}
      {isApproved && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-400">Approved</h3>
            <p className="text-white/50 text-sm">This deliverable has been accepted</p>
          </div>
        </div>
      )}
      
      {deliverable.status === 'rejected' && (
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-transparent p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-red-400">Changes Requested</h3>
            <p className="text-white/50 text-sm">Your feedback has been sent to the team</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="col-span-8 space-y-6">
          {/* Header */}
          <div>
            <div className="text-blue-400 text-sm mb-2">{project?.name}</div>
            <h1 className="text-3xl font-semibold tracking-tight">{deliverable.title}</h1>
            {deliverable.version && (
              <span className="inline-block mt-3 px-3 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                {deliverable.version}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-white/10 bg-[#1A1A23] p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-4">Description</h2>
            <p className="text-white/70 leading-relaxed">
              {deliverable.description || 'No description provided'}
            </p>
          </div>

          {/* Resources */}
          {deliverable.links?.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#1A1A23] p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Resources
              </h2>
              <div className="space-y-3">
                {deliverable.links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-blue-500/30 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      {link.includes('github') ? <GitBranch className="w-5 h-5 text-blue-400" /> :
                       link.includes('figma') ? <FileCode className="w-5 h-5 text-blue-400" /> :
                       <Globe className="w-5 h-5 text-blue-400" />}
                    </div>
                    <span className="flex-1 text-white/70 group-hover:text-white truncate">{link}</span>
                    <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-blue-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {deliverable.client_feedback && (
            <div className="rounded-2xl border border-white/10 bg-[#1A1A23] p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-white/40" />
                Your Feedback
              </h2>
              <p className="text-white/70">{deliverable.client_feedback}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Action Card */}
          {isPending && (
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
              <h3 className="font-semibold mb-2">Review Required</h3>
              <p className="text-white/50 text-sm mb-6">
                Review this deliverable and let us know if it meets your expectations.
              </p>

              {!showFeedback ? (
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ThumbsUp className="w-5 h-5" /> Approve</>}
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="w-full border border-white/10 hover:border-white/20 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    Request Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What changes would you like to see?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white h-28 resize-none focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="flex-1 border border-white/10 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading || !feedback.trim()}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="rounded-2xl border border-white/10 bg-[#1A1A23] p-6">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Status</span>
                <span className={`capitalize font-medium ${
                  isApproved ? 'text-emerald-400' : 
                  deliverable.status === 'rejected' ? 'text-red-400' : 
                  'text-amber-400'
                }`}>
                  {deliverable.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Resources</span>
                <span className="text-white/70">{deliverable.links?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Delivered</span>
                <span className="text-white/70">{new Date(deliverable.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="rounded-2xl border border-white/10 bg-[#1A1A23] p-6">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className="text-white/40 text-sm mb-4">
              Questions about this deliverable?
            </p>
            <button 
              onClick={() => navigate('/client/support')}
              className="w-full border border-white/10 hover:border-blue-500/30 py-3 rounded-xl text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDeliverable;
