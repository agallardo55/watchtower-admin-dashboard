import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ForgotPasswordProps {
  onBack: () => void;
}

type Step = 'email' | 'code' | 'done';

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneHint, setPhoneHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('password-reset-send', {
        body: { email },
      });

      if (fnError) {
        setError('Failed to send reset code. Please try again.');
      } else if (data?.phone_hint) {
        setPhoneHint(data.phone_hint);
        setStep('code');
      } else {
        // No phone_hint means no phone on file or user not found — show generic message
        setStep('code');
        setPhoneHint('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('password-reset-verify', {
        body: { email, code, new_password: newPassword },
      });

      if (fnError || data?.error) {
        setError(data?.error || 'Invalid or expired code. Please try again.');
      } else {
        setStep('done');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);

    try {
      const { data } = await supabase.functions.invoke('password-reset-send', {
        body: { email },
      });
      if (data?.phone_hint) {
        setPhoneHint(data.phone_hint);
      }
      setError('');
      setCode('');
    } catch {
      setError('Failed to resend code.');
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
          <p className="text-sm text-slate-500 mt-1">
            {step === 'email' && "We'll send a code to your phone"}
            {step === 'code' && (phoneHint ? `Code sent to ${phoneHint}` : 'Enter the code sent to your phone')}
            {step === 'done' && 'Your password has been updated'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <>
            <form onSubmit={handleSendCode} className="space-y-4">
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
                {loading ? 'Sending...' : 'Send Reset Code'}
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

        {/* Step 2: Code + New Password */}
        {step === 'code' && (
          <>
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors tracking-widest text-center text-lg"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
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
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-400">
              Password updated successfully. You can now sign in.
            </div>
            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
