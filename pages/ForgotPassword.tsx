import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://watchtower.buildinthewild.app/',
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
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
          <h1 className="text-xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1">We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-400">
              Check your email for a password reset link.
            </div>
            <button
              onClick={onBack}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button
              onClick={onBack}
              className="block w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-4 transition-colors"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
