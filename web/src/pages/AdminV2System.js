/**
 * Admin · System — Identity (users/roles), integrations, templates, audit log.
 * Tabs: Users · Integrations · Templates · Audit
 */
import { useState, useEffect } from 'react';
import { API } from '@/App';
import axios from 'axios';
import { Users, Key, FileText, Activity, RefreshCw } from 'lucide-react';
import AdminIntegrationsPage from './AdminIntegrationsPage';
import AdminTemplatesPage from './AdminTemplatesPage';
import AdminSystemUsers from './AdminSystemUsers';

export default function AdminV2System() {
  const [tab, setTab] = useState('users');
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/admin/audit-log?limit=50`, { withCredentials: true });
      const rows = Array.isArray(r.data) ? r.data : r.data?.logs || [];
      setAudit(rows);
    } catch {
      setAudit([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'audit') loadAudit();
  }, [tab]);

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="admin-system">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System</h1>
        <p className="text-sm text-muted-foreground mt-1">Identity · integrations · templates · audit</p>
      </div>

      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-6 w-fit" data-testid="system-tabs">
        {[
          { k: 'users',        l: 'Users',        icon: <Users className="w-4 h-4" /> },
          { k: 'integrations', l: 'Integrations', icon: <Key className="w-4 h-4" /> },
          { k: 'templates',    l: 'Templates',    icon: <FileText className="w-4 h-4" /> },
          { k: 'audit',        l: 'Audit log',    icon: <Activity className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            data-testid={`tab-${t.k}`}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
              tab === t.k ? 'bg-emerald-500 text-black font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'users' && <AdminSystemUsers />}
      {tab === 'integrations' && <div data-testid="system-integrations-embed"><AdminIntegrationsPage /></div>}
      {tab === 'templates' && <div data-testid="system-templates-embed"><AdminTemplatesPage /></div>}
      {tab === 'audit' && (
        <div data-testid="system-audit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-muted-foreground">Recent admin actions</h2>
            <button onClick={loadAudit} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-muted hover:bg-muted/70">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {audit.length === 0 && !loading && (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No audit records. <span className="text-xs">(endpoint <code>/api/admin/audit-log</code> may need to be enabled)</span>
            </div>
          )}
          <div className="space-y-1">
            {audit.map((row, i) => (
              <div key={row.log_id || i} className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-3 text-sm">
                <span className="text-xs text-muted-foreground w-40 shrink-0">
                  {row.created_at?.slice(0, 19).replace('T', ' ') || '—'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  {row.action}
                </span>
                <span className="text-xs text-muted-foreground">{row.entity_type}</span>
                <span className="flex-1 font-mono text-xs truncate">{row.entity_id}</span>
                <span className="text-xs text-muted-foreground">{row.source || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
