/**
 * pages/OAuthCallback.jsx – GitHub OAuth Callback Handler
 * This page receives the JWT token from the backend after GitHub OAuth
 * and completes the login flow on the frontend.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertTriangle, Zap } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams]  = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate        = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processOAuth = async () => {
      // Check for errors from GitHub or backend
      const error    = searchParams.get('error');
      const token    = searchParams.get('token');
      const username = searchParams.get('username');
      const avatar   = searchParams.get('avatar');

      if (error) {
        const messages = {
          github_denied:        'GitHub access was denied. Please try again.',
          token_exchange_failed:'Authentication failed. Please try again.',
          profile_fetch_failed: 'Could not fetch your GitHub profile.',
          user_save_failed:     'Account creation failed. Please try again.',
        };
        setErrorMsg(messages[error] || 'An unknown error occurred.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3500);
        return;
      }

      if (!token) {
        setErrorMsg('No authentication token received.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3500);
        return;
      }

      // Log in with the token from the backend
      const result = await loginWithToken(token);

      if (result.success) {
        setStatus('success');
        // Short delay to show success state, then redirect
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } else {
        setErrorMsg('Session could not be established. Please try again.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3500);
      }
    };

    processOAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-card p-12 max-w-sm w-full mx-4 text-center animate-slide-up relative z-10">

        {/* Loading */}
        {status === 'loading' && (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
              <div className="absolute inset-3 rounded-full border-2 border-blue-500/20 border-b-blue-500 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={24} className="text-violet-400" />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Signing you in…</h2>
            <p className="text-slate-400 text-sm">
              Connecting your GitHub account and syncing your repositories.
            </p>
            <div className="flex justify-center gap-2 mt-5">
              {['Authenticating', 'Syncing repos', 'Loading data'].map((label, i) => (
                <span key={label} className="text-xs px-2.5 py-1 rounded-full text-slate-400"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    animation: `pulse 1.5s ${i * 0.4}s infinite`,
                  }}>
                  {label}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 32px rgba(16,185,129,0.2)' }}>
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Welcome to DevTrackr!</h2>
            <p className="text-slate-400 text-sm">
              GitHub connected · Repositories syncing in background
            </p>
            <p className="text-xs text-slate-600 mt-3">Redirecting to dashboard…</p>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(244,63,94,0.1)', border: '2px solid rgba(244,63,94,0.3)' }}>
              <AlertTriangle size={36} className="text-rose-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Authentication Failed</h2>
            <p className="text-slate-400 text-sm mb-4">{errorMsg}</p>
            <p className="text-xs text-slate-600">Redirecting back to login…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
