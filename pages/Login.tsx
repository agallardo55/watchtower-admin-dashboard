import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  theme: 'light' | 'dark';
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ theme, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const logoSrc = theme === 'light' ? '/watchtower-icon-light.svg' : '/watchtower-icon.png';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-[1.2fr_0.9fr] items-center">
        <div className="hidden lg:block">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
              <img src={logoSrc} alt="Watchtower" className="h-6 w-6" />
              Watchtower
            </div>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900">
              Defaulting to clarity.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
              Review applications, users, and activity across the portfolio from one clean control center.
            </p>
          </div>
        </div>
        <div className="w-full max-w-sm justify-self-center rounded-[28px] border border-slate-200/80 bg-white/92 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="flex flex-col items-center mb-8">
            <img src={logoSrc} alt="Watchtower" className="w-12 h-12 rounded-none mb-3" />
            <h2 className="text-xl font-bold text-slate-900">Watchtower</h2>
            <p className="text-sm text-slate-500 mt-1">Admin Dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 mb-4">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={onForgotPassword}
            className="block w-full text-center text-sm text-slate-500 hover:text-slate-900 mt-4 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
