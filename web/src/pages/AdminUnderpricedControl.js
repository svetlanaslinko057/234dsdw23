import { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import axios from 'axios';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * AdminUnderpricedControl — Decision Tracking System (Step 4C)
 * 
 * Minimal operational UI:
 * - Table with projects + recommendations + action status
 * - Accept/Reject buttons
 * - Status display
 */
const AdminUnderpricedControl = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState([]);
  
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const [projectsRes, metricsRes] = await Promise.all([
        axios.get(`${API}/admin/profit/underpriced`, { withCredentials: true }),
        axios.get(`${API}/admin/decision/metrics`, { withCredentials: true })
      ]);
      
      setProjects(projectsRes.data.projects || []);
      setMetrics(metricsRes.data.metrics || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleDecision = async (project, status) => {
    try {
      await axios.post(
        `${API}/admin/actions`,
        {
          project_id: project.project_id,
          recommendation_id: project.recommendation.id,
          type: project.problem_type,
          status: status,
          decided_by: user.user_id,
          expected_impact: project.recommendation.expected_impact,  // prediction для calibration
          note: ""
        },
        { withCredentials: true }
      );
      
      toast({
        title: status === 'accepted' ? "Accepted" : "Rejected",
        description: `Decision recorded for ${project.project_name}`
      });
      
      await fetchData(true);
    } catch (error) {
      console.error('Error recording decision:', error);
      toast({
        title: "Error",
        description: "Failed to record decision",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-admin)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border-admin)] border-t-[var(--info)] rounded-full animate-spin" />
      </div>
    );
  }
  
  const priorityColors = {
    critical: 'text-[var(--danger)]',
    high: 'text-[var(--warning)]',
    medium: 'text-[var(--info)]'
  };
  
  return (
    <div className="min-h-screen bg-[var(--bg-admin)] p-6" data-testid="admin-underpriced-control">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-admin)] mb-1">
            Underpriced Work Control
          </h1>
          <p className="text-sm text-[var(--text-admin-secondary)]">
            Decision tracking system
          </p>
        </div>
        
        <Button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
          data-testid="refresh-button"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Decision Effectiveness (Calibration) */}
      {metrics.length > 0 && (
        <div className="bg-[var(--surface-admin-1)] border border-[var(--border-admin)] rounded-lg p-4 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-admin-muted)] mb-3">
            Decision Effectiveness
          </h2>
          <div className="space-y-2">
            {metrics.map((metric, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 border-b border-[var(--border-admin)] last:border-0"
              >
                <div className="text-sm text-[var(--text-admin)] uppercase tracking-wide">
                  {metric.type.replace(/_/g, ' ')}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[var(--text-admin-muted)]">Avg:</span>{' '}
                    <span className="font-mono font-semibold text-[var(--success)]">
                      +${metric.avg_realized?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-admin-muted)]">Delta:</span>{' '}
                    <span className={`font-mono font-semibold ${metric.avg_delta >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {metric.avg_delta >= 0 ? '+' : ''}${metric.avg_delta}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-admin-muted)]">Accuracy:</span>{' '}
                    <span className="font-mono font-semibold text-[var(--info)]">
                      {metric.success_rate}%
                    </span>
                  </div>
                  <div className="text-[var(--text-admin-muted)]">
                    ({metric.samples} samples)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Table */}
      {projects.length === 0 ? (
        <div className="bg-[var(--surface-admin-1)] border border-[var(--border-admin)] rounded-lg p-8 text-center">
          <p className="text-sm text-[var(--text-admin-secondary)]">
            No financial leaks detected
          </p>
        </div>
      ) : (
        <div className="bg-[var(--surface-admin-1)] border border-[var(--border-admin)] rounded-lg overflow-hidden">
          <table className="w-full" data-testid="underpriced-table">
            <thead className="bg-[var(--surface-admin-2)] border-b border-[var(--border-admin)]">
              <tr>
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-admin-muted)] font-semibold">Project</th>
                <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-admin-muted)] font-semibold">Loss</th>
                <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-admin-muted)] font-semibold">Margin</th>
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-admin-muted)] font-semibold">Problem</th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-admin-muted)] font-semibold">Action</th>
                <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--text-admin-muted)] font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[var(--border-admin)] hover:bg-[var(--surface-admin-2)] transition-colors"
                  data-testid={`project-row-${idx}`}
                >
                  <td className="py-3 px-4">
                    <div className="text-sm font-semibold text-[var(--text-admin)] mb-1">
                      {project.project_name}
                    </div>
                    <div className={`text-xs uppercase tracking-wider font-semibold ${priorityColors[project.priority]}`}>
                      {project.priority}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-sm font-mono font-semibold text-[var(--danger)]">
                      ${project.loss_amount?.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-sm font-mono font-semibold text-[var(--text-admin)]">
                      {project.margin_percent?.toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs uppercase tracking-wide text-[var(--text-admin-muted)]">
                      {project.problem_type.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {project.action.status === 'pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDecision(project, 'accepted')}
                          className="bg-[var(--info)] hover:bg-[var(--info)]/90 text-white text-xs"
                          data-testid={`accept-btn-${idx}`}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecision(project, 'rejected')}
                          className="text-xs"
                          data-testid={`reject-btn-${idx}`}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : project.action.status === 'accepted' ? (
                      <div className="flex items-center justify-center gap-2 text-[var(--success)]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Accepted</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[var(--text-admin-muted)]">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Rejected</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {project.action.outcome?.status === 'measured' ? (
                      <div className="text-sm font-mono font-semibold text-[var(--success)]">
                        +${project.action.outcome.impact_realized?.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-admin-muted)]">
                        Pending
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUnderpricedControl;
