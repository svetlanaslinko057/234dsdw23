import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
  || '539552820560-pso3qndegrntp46oneml9nr33t7rpi9j.apps.googleusercontent.com';

const ClientAuthPage = () => {
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

  // Capture referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('devos_ref', refCode);
      // Capture in backend
      axios.post(`${API}/public/capture-referral`, {
        ref: refCode,
        session_id: null
      }).catch(() => {});
    }
  }, [searchParams]);

  const bindReferral = async () => {
    const refCode = localStorage.getItem('devos_ref');
    if (refCode) {
      try {
        await axios.post(`${API}/referral/bind`, { referral_code: refCode }, { withCredentials: true });
        localStorage.removeItem('devos_ref');
      } catch (err) {
        // Silent fail - referral binding is non-critical
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
          role: 'client'
        });
      }
      
      await login(form.email, form.password);
      // Bind referral after successful login
      await bindReferral();
      navigate('/client/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/demo`, { role: 'client' }, { withCredentials: true });
      if (res.data) {
        // Force full page reload to ensure auth state is updated
        window.location.href = '/client/dashboard';
      }
    } catch (err) {
      console.error('Demo login error:', err);
      setError(err.response?.data?.detail || 'Demo access failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In. The button (below) hands us a JWT credential
  // issued by Google; we just post it to the backend, which verifies the
  // signature/aud and issues the same session cookie used by every other
  // authed endpoint. Referral is bound post-login exactly like the
  // email+password path so attribution stays consistent.
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error('No credential from Google');
      await axios.post(
        `${API}/auth/google`,
        { credential },
        { withCredentials: true }
      );
      await bindReferral();
      // Full reload = AuthProvider picks up the fresh session cookie.
      window.location.href = '/client/dashboard';
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or blocked by the browser');
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="client-auth-page">
      {/* Left - Visual Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]" />
        
        <div className="relative z-10 w-full flex items-center justify-center p-12">
          <ClientFlowAnimation />
        </div>
      </div>

      {/* Right - Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Top bar with back button */}
        <div className="p-6">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors px-3 py-2 rounded-xl hover:bg-muted"
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
            <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Start your project'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {mode === 'signin' ? 'Sign in to manage your projects' : 'Create an account to get started'}
            </p>

            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-xl mb-8 border border-border">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                  mode === 'signin' 
                    ? 'bg-foreground text-background hover:opacity-90 border border-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
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
                    : 'text-muted-foreground hover:text-foreground'
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
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 focus:bg-muted transition-all"
                    required={mode === 'register'}
                    data-testid="input-name"
                  />
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 focus:bg-muted transition-all"
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 focus:bg-muted transition-all pr-12"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background hover:opacity-90 border border-foreground font-medium py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                data-testid="submit-btn"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-xs text-white/30">or continue with</span>
              </div>
            </div>

            {/* Google Sign-In — real Google OAuth (ID-token flow). */}
            {GOOGLE_CLIENT_ID ? (
              <div
                className="flex justify-center mb-4"
                data-testid="google-signin-wrapper"
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_black"
                  size="large"
                  shape="pill"
                  text={mode === 'signin' ? 'signin_with' : 'continue_with'}
                  width="320"
                />
              </div>
            ) : null}

            {/* Demo Button */}
            <button
              onClick={handleDemo}
              disabled={loading}
              className="w-full bg-muted hover:bg-muted border border-border text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              data-testid="demo-btn"
            >
              <Sparkles className="w-5 h-5 text-blue-400" />
              Try Demo (No signup)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animated Flow for Clients
const ClientFlowAnimation = () => {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      label: 'Your request',
      json: `{
  "idea": "Marketplace App",
  "features": [
    "User accounts",
    "Product listings",
    "Payments"
  ]
}`
    },
    {
      label: 'Our scope',
      json: `{
  "project": "Marketplace MVP",
  "stages": 4,
  "estimate": "120h",
  "team": 2
}`
    },
    {
      label: 'In progress',
      json: `{
  "stage": "Development",
  "progress": "65%",
  "completed": [
    "Auth API",
    "Product CRUD"
  ]
}`
    },
    {
      label: 'Delivery',
      json: `{
  "version": "1.0",
  "status": "ready",
  "includes": [
    "Source code",
    "Documentation",
    "Preview link"
  ]
}`
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Flow steps */}
      <div className="flex items-center justify-between mb-8">
        {['Request', 'Scope', 'Build', 'Ship'].map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
              i <= step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            {i < 3 && (
              <div className={`w-8 h-0.5 transition-all ${
                i < step ? 'bg-blue-600' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Terminal */}
      <div className="border border-border rounded-2xl overflow-hidden bg-[#0D0D12] shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white/[0.02]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-mono">{steps[step].label}</span>
        </div>

        <div className="p-6 min-h-[260px] font-mono text-sm">
          <pre className="text-muted-foreground whitespace-pre animate-fade-in">
            {steps[step].json}
          </pre>
        </div>
      </div>

      {/* Caption */}
      <div className="text-center mt-8">
        <p className="text-muted-foreground">
          From idea to production.
        </p>
        <p className="text-white font-medium mt-1">You decide. We deliver.</p>
      </div>
    </div>
  );
};

export default ClientAuthPage;
