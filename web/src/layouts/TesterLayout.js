import { useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/App';
import { TesterRealtimeBridge } from '@/components/RealtimeBridge';
import { ConnectionStatusBadge } from '@/components/ConnectionStatus';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  Shield,
  AlertTriangle,
  BarChart3,
  LogOut,
  User
} from 'lucide-react';

const TesterLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { label: 'Dashboard', path: '/tester/dashboard', icon: LayoutDashboard },
    { label: 'Validation', path: '/tester/validation', icon: Shield },
    { label: 'Issues', path: '/tester/issues', icon: AlertTriangle },
    { label: 'Performance', path: '/tester/performance', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex" data-testid="tester-layout">
      {/* Realtime Bridge */}
      {user?.user_id && (
        <TesterRealtimeBridge userId={user.user_id} onRefresh={handleRefresh} />
      )}
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col sticky top-0 h-screen">
        {/* Logo Section */}
        <div className="px-4 pt-6 pb-4">
          <div className="h-11 overflow-hidden flex items-center">
            <img src="/evax-logo.png" alt="EVA-X" className="h-[140px] w-auto max-w-none" />
          </div>
          <p className="text-[11px] text-white/40 mt-3 leading-relaxed">Quality Assurance</p>
          <div className="mt-2 flex items-center gap-2">
            <ConnectionStatusBadge />
            <NotificationBell />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-nav-item w-full ${isActive(item.path) ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-[8px] bg-white/5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Tester'}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/40 hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default TesterLayout;
