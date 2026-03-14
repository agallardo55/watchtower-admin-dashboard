import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onForgotPassword: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0d0d0d',
  border: '1px solid #222222',
  borderRadius: '4px',
  padding: '10px 14px',
  fontSize: '13px',
  color: '#e0e0e0',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#666666',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: '6px',
};

const Login: React.FC<LoginProps> = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 28, color: '#4ADE80', fontWeight: 700, marginBottom: 8 }}>◆</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0', letterSpacing: '0.1em', marginBottom: 4 }}>WATCHTOWER</div>
          <div style={{ fontSize: 11, color: '#444444' }}>// admin access only</div>
        </div>

        {/* Card */}
        <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '4px', padding: '28px 28px' }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#EF4444',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="you@example.com"
                onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(74,222,128,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 40 }}
                  placeholder="••••••••"
                  onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(74,222,128,0.2)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#444444',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: loading ? '#2d5a3d' : '#4ADE80',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.15s, opacity 0.15s',
                fontFamily: 'inherit',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#6EE7A0'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#4ADE80'; }}
            >
              {loading ? 'signing in...' : '$ sign_in'}
            </button>
          </form>
        </div>

        <button
          onClick={onForgotPassword}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            fontSize: '12px',
            color: '#444444',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            marginTop: '16px',
            padding: '4px',
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
        >
          forgot password?
        </button>
      </div>
    </div>
  );
};

export default Login;
