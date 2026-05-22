/**
 * pages/Login.jsx – Login Page
 * Supports both email/password login and GitHub OAuth login.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Inline GitHub SVG icon
const GithubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const OAUTH_ERRORS = {
  github_denied:        'GitHub access was denied. Please try again.',
  token_exchange_failed:'GitHub authentication failed. Please try again.',
  profile_fetch_failed: 'Could not fetch your GitHub profile.',
  user_save_failed:     'Account setup failed. Please try again.',
};

const Login = () => {
  const [form, setForm]               = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const [searchParams]  = useSearchParams();

  const from = location.state?.from?.pathname || '/dashboard';

  // Handle OAuth error redirected back from server
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError && OAUTH_ERRORS[oauthError]) {
      toast.error(OAUTH_ERRORS[oauthError], { duration: 5000 });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) { toast.error(error); clearError(); }
  }, [error]);

  const handleChange  = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit  = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    await login(form.email, form.password);
  };

  const handleGitHubLogin = () => {
    setOauthLoading(true);
    // Redirect to our backend which kicks off the GitHub OAuth flow
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4 shadow-glow">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DevTrackr</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back! Sign in to continue.</p>
        </div>

        <div className="glass-card p-8">
          {/* ── GitHub OAuth Button ── */}
          <button
            id="github-login-btn"
            onClick={handleGitHubLogin}
            disabled={oauthLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 mb-6"
            style={{
              background:  'rgba(255,255,255,0.06)',
              border:      '1px solid rgba(255,255,255,0.12)',
              color:       '#fff',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            {oauthLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <GithubIcon size={18} />
            )}
            {oauthLoading ? 'Redirecting to GitHub…' : 'Continue with GitHub'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs text-slate-500 font-medium">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── Email / Password Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="login-email" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com"
                  className="input-field pl-10" autoComplete="email" required />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="login-password" type={showPassword ? 'text' : 'password'}
                  name="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••" className="input-field pl-10 pr-10"
                  autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" id="email-login-btn" disabled={loading || oauthLoading}
              className="btn-primary w-full justify-center py-3 text-base">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <> Sign In <ArrowRight size={16} /> </>
              }
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
