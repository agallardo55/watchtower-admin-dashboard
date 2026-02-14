import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA challenge state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check if MFA is required
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const phoneFactor = factors?.all.find((f: any) => f.factor_type === 'phone' && f.status === 'verified');

    if (phoneFactor) {
      // Send MFA challenge
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: phoneFactor.id });
      if (challengeErr) {
        setError(challengeErr.message);
        setLoading(false);
        return;
      }
      setMfaFactorId(phoneFactor.id);
      setMfaChallengeId(challenge!.id);
      setMfaStep(true);
      setLoading(false);
      return;
    }

    // No MFA — session is set, onAuthStateChange will handle it
    setLoading(false);
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: mfaChallengeId,
      code: mfaCode,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Verified — onAuthStateChange picks up the elevated session
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-2xl mb-3">
            W
          </div>
          <h1 className="text-xl font-bold text-white">Watchtower</h1>
          <p className="text-sm text-slate-500 mt-1">{mfaStep ? 'Verify Your Identity' : 'Admin Dashboard'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {!mfaStep ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={onForgotPassword}
              className="block w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-4 transition-colors"
            >
              Forgot password?
            </button>
          </>
        ) : (
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <p className="text-sm text-slate-400 text-center">A 6-digit code was sent to your phone.</p>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Verification Code</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm text-center font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setMfaStep(false); setMfaCode(''); setError(''); }}
              className="block w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
