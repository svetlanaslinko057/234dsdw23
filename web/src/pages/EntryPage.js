import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { ArrowRight } from 'lucide-react';

const EntryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to appropriate dashboard
  if (user) {
    const routes = {
      client: '/dashboard',
      developer: '/developer/hub',
      tester: '/tester/hub',
      admin: '/admin/work-board'
    };
    navigate(routes[user.role] || '/dashboard');
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6"
      style={{ fontFamily: "'Cabinet Grotesk', 'Inter', sans-serif" }}
    >
      {/* Logo - большой, без контейнера */}
      <div className="mb-16 text-center">
        <img src="/evax-logo.png" alt="EVA-X" className="h-20 mx-auto mb-4" />
        <p className="text-white/40 text-sm tracking-wide">
          No Problem Code — превращаем идеи в продукты
        </p>
      </div>

      {/* Two Paths */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        {/* Client Path */}
        <button
          onClick={() => navigate('/auth/client')}
          className="flex-1 group relative bg-white text-[#0A0A0A] p-8 rounded-none border-0 hover:bg-white/90 transition-all duration-300"
          data-testid="entry-client-btn"
        >
          <div className="text-left">
            <div className="text-xl font-semibold mb-2">
              I want to build a product
            </div>
            <div className="text-sm text-[#0A0A0A]/60">
              Launch your idea with structured execution
            </div>
          </div>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Builder Path */}
        <button
          onClick={() => navigate('/auth/builder')}
          className="flex-1 group relative border border-white/20 p-8 rounded-none hover:border-white/40 hover:bg-white/5 transition-all duration-300"
          data-testid="entry-builder-btn"
        >
          <div className="text-left">
            <div className="text-xl font-semibold mb-2">
              I want to work on projects
            </div>
            <div className="text-sm text-white/50">
              Join as developer or tester
            </div>
          </div>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-white/30 text-xs">
        © {new Date().getFullYear()} DevOS
      </div>
    </div>
  );
};

export default EntryPage;
