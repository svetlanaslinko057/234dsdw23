import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const ClientAuth = () => {
  const [step, setStep] = useState('email'); // email, onboarding
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Quick auth - create or get user
      const res = await axios.post(`${API}/auth/quick`, {
        email: email.trim(),
        role: 'client'
      }, { withCredentials: true });
      
      if (res.data.isNew) {
        // New user - go to onboarding
        setStep('onboarding');
      } else {
        // Existing user - go to dashboard
        setUser(res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    
    try {
      const res = await axios.post(`${API}/auth/onboarding`, {
        email: email.trim(),
        name: name.trim(),
        company: company.trim() || null,
        role: 'client'
      }, { withCredentials: true });
      
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6"
      style={{ fontFamily: "'Cabinet Grotesk', 'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <button 
          onClick={() => step === 'email' ? navigate('/') : setStep('email')}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <h1 className="text-3xl font-bold mb-2">Start your project</h1>
            <p className="text-white/50 mb-8">Enter your email to continue</p>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              data-testid="email-input"
              autoFocus
            />

            {error && (
              <div className="mt-3 text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full mt-4 bg-white text-[#0A0A0A] p-4 font-medium flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="continue-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'onboarding' && (
          <form onSubmit={handleOnboardingSubmit}>
            <h1 className="text-3xl font-bold mb-2">Almost there</h1>
            <p className="text-white/50 mb-8">Tell us a bit about yourself</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">Your name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  data-testid="name-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">Company (optional)</label>
                <input
                  type="text"
                  placeholder="Acme Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  data-testid="company-input"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full mt-6 bg-white text-[#0A0A0A] p-4 font-medium flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="complete-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClientAuth;
