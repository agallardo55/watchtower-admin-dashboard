
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    company: 'CMIG Partners',
    title: '',
    timezone: 'America/Los_Angeles',
  });

  // Security state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
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

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: wtUser } = await supabase
        .from('wt_users')
        .select('display_name, role, mfa_phone')
        .eq('id', user.id)
        .single();

      const names = (wtUser?.display_name || '').split(' ');
      setProfile({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        mobile: wtUser?.mfa_phone ? formatPhone(wtUser.mfa_phone.replace('+1', '')) : '',
        company: 'CMIG Partners',
        title: wtUser?.role || '',
        timezone: 'America/Los_Angeles',
      });
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      // Update wt_users via edge function
      const phone = profile.mobile.replace(/\D/g, '');
      const formattedPhone = phone ? `+1${phone}` : '';

      const { data, error: fnError } = await supabase.functions.invoke('update-user', {
        body: {
          userId,
          app: 'Watchtower',
          fields: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: formattedPhone || undefined,
          },
        },
      });

      if (fnError || data?.error) {
        setSaveMessage({ type: 'error', text: data?.error || 'Failed to save profile.' });
      } else {
        // Also update mfa_phone directly for password reset SMS
        if (formattedPhone) {
          await supabase
            .from('wt_users')
            .update({ mfa_phone: formattedPhone })
            .eq('id', userId);
        }
        setSaveMessage({ type: 'success', text: 'Profile saved successfully.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Something went wrong.' });
    }

    setSaving(false);
    setTimeout(() => setSaveMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading settings...</div>
      </div>
    );
  }

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h2>
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

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar + name header */}
          <div className="glass rounded-xl p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {initials}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h3>
                <p className="text-sm text-slate-500">{profile.title} &bull; {profile.company}</p>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors">
                Change Avatar
              </button>
            </div>
          </div>

          {/* Profile form */}
          <div className="glass rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-lg">Personal Information</h3>

            {saveMessage && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                saveMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {saveMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-600">Email changes require re-verification</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                <input
                  type="tel"
                  value={profile.mobile}
                  maxLength={14}
                  onChange={(e) => setProfile({ ...profile, mobile: formatPhone(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-600">Used for MFA and password reset</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Company / Org</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
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
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
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
              <form className="space-y-4 pt-2" onSubmit={(e) => { e.preventDefault(); setShowChangePassword(false); setPasswords({ current: '', newPass: '', confirm: '' }); }}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onClick={() => { setShowChangePassword(false); setPasswords({ current: '', newPass: '', confirm: '' }); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20">
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Two-Factor */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">Not Enabled</span>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>
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

      {/* NOTIFICATIONS TAB */}
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
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all`}
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
