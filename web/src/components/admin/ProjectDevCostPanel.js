import { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

const ProjectDevCostPanel = ({ projects = [] }) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [devCostData, setDevCostData] = useState(null);

  const selectedProject = projects.find(p => p.project_id === selectedProjectId);

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    
    // TODO: Fetch dev cost data from API
    // For now, using mock data
    if (projectId) {
      setDevCostData({
        dev_cost_total: 2100,
        approved_cost: 1400,
        held_cost: 180,
        paid_cost: 520,
        revision_cost: 180,
        revision_share: 8.5
      });
    } else {
      setDevCostData(null);
    }
  };

  const revisionShareHigh = devCostData && devCostData.revision_share > 10;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight text-text-primary">Project Dev Cost</h3>
      
      {/* Project Selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.14em] text-text-muted">Select Project</label>
        <select
          value={selectedProjectId}
          onChange={(e) => handleProjectSelect(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
        >
          <option value="">Choose a project...</option>
          {projects.map((project) => (
            <option key={project.project_id} value={project.project_id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dev Cost Data */}
      {devCostData && (
        <div className="space-y-3">
          {/* Total Cost Card */}
          <div className="p-4 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-text-muted" />
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Developer Cost Total</p>
            </div>
            <p className="text-3xl font-semibold font-mono text-text-primary">
              ${devCostData.dev_cost_total.toLocaleString()}
            </p>
          </div>

          {/* Breakdown */}
          <div className="bg-surface-2 rounded-lg border border-border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Approved Cost</span>
              <span className="font-mono text-primary">${devCostData.approved_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Held Cost</span>
              <span className="font-mono text-warning">${devCostData.held_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Paid Cost</span>
              <span className="font-mono text-success">${devCostData.paid_cost.toLocaleString()}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Revision Cost</span>
              <span className="font-mono text-danger font-semibold">${devCostData.revision_cost.toLocaleString()}</span>
            </div>
          </div>

          {/* Revision Share */}
          <div className={`p-4 rounded-lg border ${
            revisionShareHigh 
              ? 'bg-danger/10 border-danger/30' 
              : 'bg-surface-2 border-border'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${revisionShareHigh ? 'text-danger' : 'text-text-muted'}`} />
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Revision Share</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-semibold ${
                revisionShareHigh ? 'text-danger' : 'text-text-primary'
              }`}>
                {devCostData.revision_share.toFixed(1)}%
              </p>
              {revisionShareHigh && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-danger" />
                  <span className="text-xs text-danger font-medium">HIGH (&gt;10%)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!devCostData && (
        <div className="p-8 rounded-lg border border-border bg-surface text-center">
          <DollarSign className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">Select a project to view dev cost breakdown</p>
        </div>
      )}
    </div>
  );
};

export default ProjectDevCostPanel;