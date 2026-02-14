
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { icons } from '../constants';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    mobile: '',
    timezone: 'America/Los_Angeles',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({
          fullName: data.full_name || '',
          email: data.email || '',
          mobile: data.phone || '',
          timezone: data.timezone || 'America/Los_Angeles',
        });
      }
      setProfileLoading(false);
    })();
  }, []);

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profile.fullName,
      phone: profile.mobile,
      timezone: profile.timezone,
    }).eq('id', user.id);
    setProfileSaving(false);
    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSuccess('Profile saved.');
      setTimeout(() => setProfileSuccess(''), 3000);
    }
  };

  // Security state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwords.newPass !== passwords.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (passwords.newPass.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess('Password updated successfully.');
      setPasswords({ newPass: '', confirm: '' });
      setTimeout(() => { setShowChangePassword(false); setPasswordSuccess(''); }, 2000);
    }
  };
  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState<'idle' | 'enroll' | 'verify'>('idle');
  const [mfaPhone, setMfaPhone] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');

  useEffect(() => {
    if (profile.mobile) setMfaPhone(profile.mobile);
  }, [profile.mobile]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) {
        const phoneFactor = data.all.find((f: any) => f.factor_type === 'phone' && f.status === 'verified');
        if (phoneFactor) {
          setMfaEnabled(true);
          setMfaFactorId(phoneFactor.id);
        }
      }
    })();
  }, []);

  const handleEnrollMfa = async () => {
    setMfaError('');
    if (!mfaPhone.replace(/\D/g, '').length) {
      setMfaError('Enter a valid phone number.');
      return;
    }
    const phone = mfaPhone.startsWith('+') ? mfaPhone : `+1${mfaPhone.replace(/\D/g, '')}`;
    setMfaLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'phone', phone });
    setMfaLoading(false);
    if (error) {
      setMfaError(error.message);
      return;
    }
    if (data) {
      setMfaFactorId(data.id);
      // Create a challenge to send the SMS code
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challengeErr) {
        setMfaError(challengeErr.message);
        return;
      }
      if (challenge) {
        setMfaChallengeId(challenge.id);
      }
      setMfaStep('verify');
    }
  };

  const handleVerifyMfa = async () => {
    setMfaError('');
    if (mfaCode.length < 6) {
      setMfaError('Enter the 6-digit code.');
      return;
    }
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: mfaChallengeId, code: mfaCode });
    setMfaLoading(false);
    if (error) {
      setMfaError(error.message);
      return;
    }
    setMfaEnabled(true);
    setMfaStep('idle');
    setMfaCode('');
    setMfaSuccess('Two-factor authentication enabled.');
    setTimeout(() => setMfaSuccess(''), 3000);
  };

  const handleUnenrollMfa = async () => {
    setMfaError('');
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    setMfaLoading(false);
    if (error) {
      setMfaError(error.message);
      return;
    }
    setMfaEnabled(false);
    setMfaFactorId('');
    setMfaStep('idle');
    setMfaSuccess('Two-factor authentication disabled.');
    setTimeout(() => setMfaSuccess(''), 3000);
  };

  const [sessions] = useState([
    { device: 'MacBook Air — Chrome', location: 'Los Angeles, CA', lastActive: 'Now', current: true },
    { device: 'iPhone 15 Pro — Safari', location: 'Los Angeles, CA', lastActive: '2 hours ago', current: false },
    { device: 'Mac Mini — Terminal', location: 'Los Angeles, CA', lastActive: '1 day ago', current: false },
  ]);

  // Notification state
  const [notifications, setNotifications] = useState({
    emailNewUser: true,
    emailAppStatus: true,
    emailWeeklyDigest: false,
    emailSecurityAlerts: true,
    pushDeployments: true,
    pushErrors: true,
    pushNewSignups: false,
    pushTaskUpdates: true,
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account, security, and preferences.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PROFILE TAB                                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar + name header */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{profile.fullName || 'No Name Set'}</h3>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors">
                Change Avatar
              </button>
            </div>
          </div>

          {/* Profile form */}
          <div className="glass rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-lg">Personal Information</h3>

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-400">{profileSuccess}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                <input
                  type="tel"
                  value={profile.mobile}
                  maxLength={14}
                  onChange={(e) => setProfile({ ...profile, mobile: formatPhone(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECURITY TAB                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Password</h3>
                <p className="text-xs text-slate-500">Last changed 30 days ago</p>
              </div>
              {!showChangePassword && (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {showChangePassword && (
              <form className="space-y-4 pt-2" onSubmit={handleUpdatePassword}>
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-400">{passwordSuccess}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.newPass}
                      onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowChangePassword(false); setPasswords({ newPass: '', confirm: '' }); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={passwordLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Two-Factor */}
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500">SMS verification via Twilio for extra security</p>
              </div>
              <div className="flex items-center gap-3">
                {mfaEnabled ? (
                  <>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Enabled</span>
                    <button
                      onClick={handleUnenrollMfa}
                      disabled={mfaLoading}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {mfaLoading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </>
                ) : mfaStep === 'idle' ? (
                  <>
                    <span className="text-[10px] font-bold uppercase text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">Not Enabled</span>
                    <button
                      onClick={() => setMfaStep('enroll')}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Enable 2FA
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {mfaError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{mfaError}</div>
            )}
            {mfaSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-400">{mfaSuccess}</div>
            )}

            {mfaStep === 'enroll' && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-slate-400">
                  We'll send a verification code to <span className="text-white font-medium">{mfaPhone || 'your phone'}</span>.
                </p>
                {!profile.mobile && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <input
                      type="tel"
                      value={mfaPhone}
                      onChange={(e) => setMfaPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setMfaStep('idle'); setMfaError(''); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollMfa}
                    disabled={mfaLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {mfaLoading ? 'Sending code...' : 'Send Verification Code'}
                  </button>
                </div>
              </div>
            )}

            {mfaStep === 'verify' && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-slate-400">Enter the 6-digit code sent to your phone.</p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Verification Code</label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setMfaStep('idle'); setMfaCode(''); setMfaError(''); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyMfa}
                    disabled={mfaLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Active Sessions</h3>
                <p className="text-xs text-slate-500">Devices currently signed into your account</p>
              </div>
              <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-colors">
                Revoke All Others
              </button>
            </div>

            <div className="space-y-2">
              {sessions.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <div>
                      <p className="text-sm font-semibold">{session.device}</p>
                      <p className="text-[10px] text-slate-500">{session.location} &bull; {session.lastActive}</p>
                    </div>
                  </div>
                  {session.current ? (
                    <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Current</span>
                  ) : (
                    <button className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* NOTIFICATIONS TAB                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="glass rounded-xl p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Email Notifications</h3>
              <p className="text-xs text-slate-500">Choose what email notifications you receive</p>
            </div>

            <div className="space-y-1">
              {[
                { key: 'emailNewUser' as const, label: 'New User Signups', desc: 'Get notified when a new user registers on any app' },
                { key: 'emailAppStatus' as const, label: 'App Status Changes', desc: 'Alerts when an app goes live, pauses, or encounters errors' },
                { key: 'emailWeeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of activity, signups, and metrics across all apps' },
                { key: 'emailSecurityAlerts' as const, label: 'Security Alerts', desc: 'Suspicious login attempts, failed auth, and permission changes' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(item.key)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${notifications[item.key] ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications[item.key] ? 'left-5.5 right-0.5' : 'left-0.5'}`}
                      style={{ left: notifications[item.key] ? '22px' : '2px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="glass rounded-xl p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Push Notifications</h3>
              <p className="text-xs text-slate-500">In-app and browser push notification preferences</p>
            </div>

            <div className="space-y-1">
              {[
                { key: 'pushDeployments' as const, label: 'Deployments', desc: 'Notify when builds deploy successfully or fail' },
                { key: 'pushErrors' as const, label: 'Error Alerts', desc: 'Real-time notifications for runtime errors and crashes' },
                { key: 'pushNewSignups' as const, label: 'New Signups', desc: 'Push notification for each new user registration' },
                { key: 'pushTaskUpdates' as const, label: 'Task Updates', desc: 'Notifications when development tasks change status' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(item.key)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${notifications[item.key] ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all`}
                      style={{ left: notifications[item.key] ? '22px' : '2px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
