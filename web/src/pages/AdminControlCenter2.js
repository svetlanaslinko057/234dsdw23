import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Users,
  FileText,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * CONTROL CENTER 2.0 - Operations Command Panel
 * 
 * This is NOT a dashboard. This is a production control panel.
 * 
 * Shows:
 * - Critical Feed (what's broken)
 * - Pressure Map (where's the pressure)
 * - Quick Actions (what to do)
 */

const AdminControlCenter2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState({ critical_count: 0, warning_count: 0, info_count: 0, items: [] });
  const [pressureMap, setPressureMap] = useState({ pressure_blocks: {}, total_open: 0, total_critical: 0 });

  // Fetch critical feed
  const fetchFeed = async () => {
    try {
      const response = await axios.get(`${API}/admin/events/feed?status=open&limit=20`);
      setFeed(response.data);
    } catch (error) {
      console.error('Failed to fetch event feed:', error);
    }
  };

  // Fetch pressure map
  const fetchPressureMap = async () => {
    try {
      const response = await axios.get(`${API}/admin/events/pressure-map`);
      setPressureMap(response.data);
    } catch (error) {
      console.error('Failed to fetch pressure map:', error);
    }
  };

  // Acknowledge event
  const acknowledgeEvent = async (eventId) => {
    try {
      await axios.post(`${API}/admin/events/${eventId}/acknowledge`);
      fetchFeed();
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
    }
  };

  // Resolve event
  const resolveEvent = async (eventId) => {
    try {
      await axios.post(`${API}/admin/events/${eventId}/resolve`);
      fetchFeed();
      fetchPressureMap();
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  // Manual scan trigger
  const runScan = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/admin/events/scan`);
      await fetchFeed();
      await fetchPressureMap();
    } catch (error) {
      console.error('Failed to run scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFeed(), fetchPressureMap()]);
      setLoading(false);
    };
    loadData();

    // Refresh every 2 minutes
    const interval = setInterval(() => {
      fetchFeed();
      fetchPressureMap();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Navigate to entity
  const goToEntity = (event) => {
    if (event.entity_type === 'project' && event.project_id) {
      navigate(`/admin/project/${event.project_id}`);
    } else if (event.entity_type === 'task' && event.entity_id) {
      navigate(`/admin/workboard`); // TODO: direct task link
    } else if (event.entity_type === 'developer' && event.user_id) {
      navigate(`/admin/dev/${event.user_id}`);
    }
  };

  // Severity styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Format time ago
  const timeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'just now';
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Control Center</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Production Operations Command
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => { fetchFeed(); fetchPressureMap(); }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={runScan}
                disabled={loading}
                size="sm"
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Run Scan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: CRITICAL FEED */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Critical Feed
              </h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  {feed.critical_count} Critical
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  {feed.warning_count} Warning
                </Badge>
              </div>
            </div>

            {loading && feed.items.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
                  <p className="text-sm text-[var(--color-text-muted)]">Loading events...</p>
                </div>
              </Card>
            ) : feed.items.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <h3 className="font-medium text-[var(--color-text)] mb-1">All Clear</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  No active operational issues detected
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {feed.items.map((event) => (
                  <Card
                    key={event.event_id}
                    className={`p-4 border ${getSeverityStyle(event.severity)}`}
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {getSeverityIcon(event.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-[var(--color-text)]">
                              {event.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {event.message}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        {timeAgo(event.created_at)}
                      </div>
                    </div>

                    {/* Event Context */}
                    {event.meta && Object.keys(event.meta).length > 0 && (
                      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)] mb-3 pl-7">
                        {event.meta.status && (
                          <span>Status: <span className="text-[var(--color-text)]">{event.meta.status}</span></span>
                        )}
                        {event.meta.hours_idle && (
                          <span>Idle: <span className="text-[var(--color-text)]">{event.meta.hours_idle}h</span></span>
                        )}
                        {event.meta.active_tasks && (
                          <span>Active: <span className="text-[var(--color-text)]">{event.meta.active_tasks}</span></span>
                        )}
                        {event.meta.revision_count && (
                          <span>Revisions: <span className="text-[var(--color-text)]">{event.meta.revision_count}</span></span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-7">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToEntity(event)}
                        className="gap-1 h-7 text-xs"
                      >
                        Go to {event.entity_type}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                      {event.status === 'open' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => acknowledgeEvent(event.event_id)}
                            className="h-7 text-xs"
                          >
                            Ack
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveEvent(event.event_id)}
                            className="h-7 text-xs"
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PRESSURE MAP */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              System Pressure
            </h2>

            {/* Pressure Blocks */}
            <div className="space-y-3">
              {/* Tasks Pressure */}
              <Card
                className="p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                onClick={() => navigate('/admin/workboard')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-medium text-[var(--color-text)]">Tasks</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-[var(--color-text)]">
                    {pressureMap.pressure_blocks?.stuck_tasks?.total || 0}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {pressureMap.pressure_blocks?.stuck_tasks?.critical || 0} critical issues
                  </p>
                </div>
              </Card>

              {/* Developers Pressure */}
              <Card
                className="p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                onClick={() => navigate('/admin/team')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-medium text-[var(--color-text)]">Developers</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-[var(--color-text)]">
                    {pressureMap.pressure_blocks?.overloaded_devs?.total || 0}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {pressureMap.pressure_blocks?.overloaded_devs?.critical || 0} overloaded
                  </p>
                </div>
              </Card>

              {/* QA Pressure */}
              <Card
                className="p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                onClick={() => navigate('/admin/qa')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-medium text-[var(--color-text)]">QA Queue</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-[var(--color-text)]">
                    {pressureMap.pressure_blocks?.qa_backlog?.total || 0}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {pressureMap.pressure_blocks?.qa_backlog?.warning || 0} in review
                  </p>
                </div>
              </Card>

              {/* Projects Pressure */}
              <Card
                className="p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                onClick={() => navigate('/admin/projects')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-medium text-[var(--color-text)]">Projects</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-[var(--color-text)]">
                    {pressureMap.pressure_blocks?.inactive_projects?.total || 0}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {pressureMap.pressure_blocks?.inactive_projects?.warning || 0} idle
                  </p>
                </div>
              </Card>
            </div>

            {/* Total Pressure Summary */}
            <Card className="p-4 bg-[var(--color-surface-elevated)]">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-text)] mb-1">
                  {pressureMap.total_open || 0}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Total Open Issues
                </p>
                {pressureMap.total_critical > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    {pressureMap.total_critical} Critical
                  </Badge>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControlCenter2;
