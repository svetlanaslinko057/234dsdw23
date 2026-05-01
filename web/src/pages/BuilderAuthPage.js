import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { ArrowLeft, Eye, EyeOff, Loader2, Terminal, Code2, GitBranch } from 'lucide-react';

const BuilderAuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Capture dev referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('dev_referral_code', refCode);
      // Capture attribution
      axios.post(`${API}/public/capture-referral`, { 
        ref: refCode, 
        session_id: `sess_${Date.now()}`,
        program: 'developer_growth'
      }).catch(() => {});
    }
  }, [searchParams]);

  const bindDevReferral = async () => {
    const refCode = localStorage.getItem('dev_referral_code');
    if (refCode) {
      try {
        await axios.post(`${API}/developer/growth/bind`, { referral_code: refCode }, { withCredentials: true });
        localStorage.removeItem('dev_referral_code');
      } catch (err) {
        console.log('Dev referral bind:', err?.response?.data);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'register') {
        await axios.post(`${API}/auth/register`, {
          email: form.email,
          password: form.password,
          name: form.name,
          role: 'developer'
        });
      }
      
      await login(form.email, form.password);
      
      // After login/register, try binding dev referral
      await bindDevReferral();
      
      navigate('/developer/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/auth/demo`, { role: 'developer' }, { withCredentials: true });
      window.location.href = '/developer/dashboard';
    } catch (err) {
      setError('Demo access failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex" data-testid="builder-auth-page">
      {/* Left - Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Top bar with back button */}
        <div className="p-6">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white/40 hover:text-foreground text-sm transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-[400px]">
            {/* Logo - большой, без контейнера */}
            <div className="h-11 overflow-hidden flex items-center mb-10">
              <img src="/evax-logo.png" alt="EVA-X" className="h-[140px] w-auto max-w-none" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Join as Builder'}
            </h1>
            <p className="text-white/40 mb-8">
              {mode === 'signin' ? 'Access your workspace and tasks' : 'Start building real products'}
            </p>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                  mode === 'signin' 
                    ? 'bg-foreground text-background hover:opacity-90 border border-foreground shadow-lg' 
                    : 'text-white/50 hover:text-foreground'
                }`}
                data-testid="tab-signin"
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                  mode === 'register' 
                    ? 'bg-foreground text-background hover:opacity-90 border border-foreground shadow-lg' 
                    : 'text-white/50 hover:text-foreground'
                }`}
                data-testid="tab-register"
              >
                Register
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    required={mode === 'register'}
                    data-testid="input-name"
                  />
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all pr-12"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 mt-6"
                data-testid="submit-btn"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#05050A] px-4 text-xs text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Demo Button */}
            <button
              onClick={handleDemo}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              data-testid="demo-btn"
            >
              <Terminal className="w-5 h-5 text-blue-400" />
              Try Demo Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Right - Visual Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/20 via-blue-600/5 to-transparent" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[150px]" />
        
        <div className="relative z-10 w-full flex items-center justify-center p-12">
          <WorkflowAnimation />
        </div>
      </div>
    </div>
  );
};

// Animated Workflow
const WorkflowAnimation = () => {
  const [currentLine, setCurrentLine] = useState(0);
  
  const codeLines = [
    { text: '// workflow.ts', dim: true },
    { text: '' },
    { text: 'const pipeline = {' },
    { text: '  request: "received",' },
    { text: '  scope: "structured",' },
    { text: '  assignment: "auto",' },
    { text: '  execution: "tracked",' },
    { text: '  review: "verified",' },
    { text: '  delivery: "approved"' },
    { text: '};' },
    { text: '' },
    { text: '// You build.' },
    { text: '// We manage.' },
    { text: '// Client receives.' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => {
        if (prev >= codeLines.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Terminal header */}
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0D0D12] shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-white/40 ml-2 font-mono">execution_platform</span>
        </div>

        {/* Code content */}
        <div className="p-6 min-h-[340px] font-mono text-sm">
          {codeLines.slice(0, currentLine + 1).map((line, i) => (
            <div 
              key={i}
              className={`${line.dim ? 'text-muted-foreground' : 'text-white/70'} ${
                i === currentLine ? 'animate-fade-in' : ''
              }`}
              style={{ minHeight: '1.5rem' }}
            >
              {line.text}
            </div>
          ))}
          <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse" />
        </div>
      </div>

      {/* Stats below */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <StatBlock label="Builders" value="200+" color="blue" />
        <StatBlock label="Projects" value="500+" color="blue" />
        <StatBlock label="Delivery" value="98%" color="emerald" />
      </div>
      
      {/* Benefits */}
      <div className="mt-8 space-y-3">
        <Benefit icon={<GitBranch className="w-4 h-4" />} text="Work on real production projects" />
        <Benefit icon={<Code2 className="w-4 h-4" />} text="Structured tasks with clear requirements" />
        <Benefit icon={<Terminal className="w-4 h-4" />} text="Flexible remote work schedule" />
      </div>
    </div>
  );
};

const StatBlock = ({ label, value, color }) => (
  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
    <div className={`text-2xl font-semibold text-foreground`}>{value}</div>
    <div className="text-xs text-white/40 mt-1">{label}</div>
  </div>
);

const Benefit = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-white/60">
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400">
      {icon}
    </div>
    <span className="text-sm">{text}</span>
  </div>
);

export default BuilderAuthPage;
