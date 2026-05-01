import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { ConnectionStatusBadge } from '@/components/ConnectionStatus';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  GitBranch,
  ShieldCheck,
  DollarSign,
  Users,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

/**
 * Admin Layout v1 stable — 7 zones. No duplication. No legacy.
 *
 *   Dashboard · Workflow · QA · Finance · Team · System · Profile
 *
 * Mapping (old → new):
 *   cockpit, control-center, master, profit-control → /admin/dashboard
 *   projects, requests, validation, work-unit       → /admin/workflow
 *   earnings-control, withdrawals, billing, margin  → /admin/finance
 *   users, growth, time-control                     → /admin/team
 *   integrations, templates, contracts              → /admin/system
 */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex" data-testid="admin-layout">
      <aside className="w-[240px] border-r border-border flex flex-col sticky top-0 h-screen bg-card">
        <div className="px-4 pt-6 pb-4">
          <div className="h-11 overflow-hidden flex items-center">
            <img src="/evax-logo.png" alt="EVA-X" className="h-[140px] w-auto max-w-none" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">Command Center · v1</p>
          <div className="mt-2 flex items-center gap-2">
            <ConnectionStatusBadge />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" data-testid="admin-sidebar-nav">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Operations
          </div>
          <NavItem to="/admin/dashboard" icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" testid="nav-dashboard" />
          <NavItem to="/admin/workflow"  icon={<GitBranch className="w-[18px] h-[18px]" />} label="Workflow"  testid="nav-workflow" />
          <NavItem to="/admin/qa"        icon={<ShieldCheck className="w-[18px] h-[18px]" />} label="QA"        testid="nav-qa" />

          <div className="px-3 py-2 mt-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Resources
          </div>
          <NavItem to="/admin/finance"   icon={<DollarSign className="w-[18px] h-[18px]" />} label="Finance"   testid="nav-finance" />
          <NavItem to="/admin/team"      icon={<Users className="w-[18px] h-[18px]" />} label="Team"      testid="nav-team" />

          <div className="px-3 py-2 mt-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            System
          </div>
          <NavItem to="/admin/system"    icon={<Settings className="w-[18px] h-[18px]" />} label="System"    testid="nav-system" />
          <NavItem to="/admin/profile"   icon={<User className="w-[18px] h-[18px]" />} label="Profile"   testid="nav-profile" />
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center font-semibold text-sm border border-white/10">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-white/40 capitalize">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
              data-testid="admin-logout-btn"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen overflow-auto bg-[#0B0F14]">
        <Outlet />
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label, badge, testid }) => (
  <NavLink
    to={to}
    data-testid={testid}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-foreground border border-red-500/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`
    }
  >
    {icon}
    <span className="flex-1">{label}</span>
    {badge && (
      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">{badge}</span>
    )}
  </NavLink>
);

export default AdminLayout;
