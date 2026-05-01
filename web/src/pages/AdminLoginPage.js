import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, Shield, Sparkles, Activity, Users, TrendingUp, Zap } from 'lucide-react';

const AdminLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: email.trim(),
        password
      }, { withCredentials: true });
      
      if (res.data.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }
      
      setUser(res.data);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API}/auth/demo`, { role: 'admin' }, { withCredentials: true });
      setUser(res.data);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Demo access failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex" data-testid="admin-login-page">
      {/* Left - Visual Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-orange-600/10 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[150px]" />
        
        <div className="relative z-10 w-full flex items-center justify-center p-12">
          <AdminFlowAnimation />
        </div>
      </div>

      {/* Right - Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Top bar with back button */}
        <div className="p-6">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-[400px]">
            <div className="h-11 overflow-hidden flex items-center mb-10">
              <img src="/evax-logo.png" alt="EVA-X" className="h-[140px] w-auto max-w-none" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
              Command Center
            </h1>
            <p className="text-white/40 mb-8">
              Access the admin dashboard to manage your platform
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@devos.io"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all"
                  data-testid="email-input"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl py-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20"
                data-testid="submit-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Access Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm text-white/40">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Demo Access */}
            <button
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full border border-white/10 bg-white/5 rounded-xl py-4 font-medium flex items-center justify-center gap-2 hover:bg-white/10 disabled:opacity-50 transition-all"
              data-testid="demo-btn"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Demo Admin Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Admin Flow Animation Component
const AdminFlowAnimation = () => {
  const stats = [
    { label: 'Active Projects', value: '24', icon: Activity, color: 'text-emerald-400' },
    { label: 'Team Members', value: '12', icon: Users, color: 'text-blue-400' },
    { label: 'Revenue', value: '$48.2K', icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <div className="w-full max-w-md">
      {/* Pipeline Steps */}
      <div className="flex items-center justify-center gap-3 mb-12">
        {[1, 2, 3, 4].map((step, i) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
              i === 0 ? 'bg-red-600 text-white' : 'bg-white/10 text-white/50'
            }`}>
              {step}
            </div>
            {i < 3 && <div className="w-8 h-0.5 bg-white/10 mx-1" />}
          </div>
        ))}
      </div>

      {/* Dashboard Preview */}
      <div className="bg-[#0a0a0f]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <span className="text-white/30 text-xs ml-2">Control Center</span>
        </div>

        <div className="space-y-4">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-white/60 text-sm">{stat.label}</span>
              </div>
              <span className="text-white font-semibold">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-emerald-400">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">System Healthy</span>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-center text-white/40 mt-8 text-sm">
        Full control over your development pipeline
      </p>
    </div>
  );
};

export default AdminLoginPage;
