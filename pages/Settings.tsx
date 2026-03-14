
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

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#666666',
  marginBottom: '4px',
};

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ color: '#444444', fontSize: '13px' }}>Loading settings...</div>
      </div>
    );
  }

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '896px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '10px', color: '#444444', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          WATCHTOWER
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#e0e0e0', margin: 0, letterSpacing: '-0.01em' }}>
          // SETTINGS
        </h1>
        <p style={{ color: '#444444', fontSize: '12px', marginTop: '4px' }}>
          Manage your account, security, and preferences.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', gap: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #4ADE80' : '2px solid transparent',
              color: activeTab === tab.id ? '#4ADE80' : '#666666',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: '-1px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#e0e0e0'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#666666'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Avatar + name header */}
          <div className="terminal-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                color: '#4ADE80',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0', margin: '0 0 4px 0' }}>
                  {profile.firstName} {profile.lastName}
                </h3>
                <p style={{ fontSize: '12px', color: '#444444', margin: 0 }}>
                  {profile.title} &bull; {profile.company}
                </p>
              </div>
              <button
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  border: '1px solid #222222',
                  borderRadius: '4px',
                  color: '#666666',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.color = '#4ADE80'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#666666'; }}
              >
                Change Avatar
              </button>
            </div>
          </div>

          {/* Profile form */}
          <div className="terminal-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={sectionHeaderStyle}>Personal Information</div>

            {saveMessage && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '13px',
                background: saveMessage.type === 'success' ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${saveMessage.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: saveMessage.type === 'success' ? '#4ADE80' : '#EF4444',
              }}>
                {saveMessage.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '10px', color: '#333333', marginTop: '4px' }}>Email changes require re-verification</p>
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input
                  type="tel"
                  value={profile.mobile}
                  maxLength={14}
                  onChange={(e) => setProfile({ ...profile, mobile: formatPhone(e.target.value) })}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                />
                <p style={{ fontSize: '10px', color: '#333333', marginTop: '4px' }}>Used for MFA and password reset</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Company / Org</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  padding: '9px 24px',
                  background: saving ? '#2d5a3d' : '#4ADE80',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'background 0.15s, opacity 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#6EE7A0'; }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#4ADE80'; }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Change Password */}
          <div className="terminal-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={sectionHeaderStyle}>Password</div>
                <p style={{ fontSize: '12px', color: '#444444', margin: 0 }}>Last changed 30 days ago</p>
              </div>
              {!showChangePassword && (
                <button
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    border: '1px solid #222222',
                    borderRadius: '4px',
                    color: '#666666',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.color = '#4ADE80'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#666666'; }}
                >
                  Change Password
                </button>
              )}
            </div>

            {showChangePassword && (
              <form
                style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowChangePassword(false);
                  setPasswords({ current: '', newPass: '', confirm: '' });
                }}
              >
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.newPass}
                      onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#4ADE80'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#222222'; }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowChangePassword(false); setPasswords({ current: '', newPass: '', confirm: '' }); }}
                    style={{
                      padding: '7px 14px',
                      background: 'transparent',
                      border: '1px solid #222222',
                      borderRadius: '4px',
                      color: '#666666',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#444444'; e.currentTarget.style.color = '#e0e0e0'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#666666'; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '7px 16px',
                      background: '#4ADE80',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#6EE7A0'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#4ADE80'; }}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Two-Factor */}
          <div className="terminal-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={sectionHeaderStyle}>Two-Factor Authentication</div>
                <p style={{ fontSize: '12px', color: '#444444', margin: 0 }}>Add an extra layer of security to your account</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#F59E0B',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  padding: '2px 8px',
                  borderRadius: '3px',
                }}>
                  Not Enabled
                </span>
                <button
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    border: '1px solid #222222',
                    borderRadius: '4px',
                    color: '#666666',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.color = '#4ADE80'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#666666'; }}
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Notifications */}
          <div className="terminal-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={sectionHeaderStyle}>Email Notifications</div>
              <p style={{ fontSize: '12px', color: '#444444', margin: 0 }}>Choose what email notifications you receive</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { key: 'emailNewUser' as const, label: 'New User Signups', desc: 'Get notified when a new user registers on any app' },
                { key: 'emailAppStatus' as const, label: 'App Status Changes', desc: 'Alerts when an app goes live, pauses, or encounters errors' },
                { key: 'emailWeeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of activity, signups, and metrics across all apps' },
                { key: 'emailSecurityAlerts' as const, label: 'Security Alerts', desc: 'Suspicious login attempts, failed auth, and permission changes' },
              ].map(item => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    transition: 'background 0.1s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0', margin: '0 0 2px 0' }}>{item.label}</p>
                    <p style={{ fontSize: '10px', color: '#444444', margin: 0 }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(item.key)}
                    style={{
                      width: '36px',
                      height: '20px',
                      borderRadius: '10px',
                      background: notifications[item.key] ? '#4ADE80' : '#1a1a1a',
                      border: `1px solid ${notifications[item.key] ? '#4ADE80' : '#333333'}`,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        background: notifications[item.key] ? '#000000' : '#444444',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: notifications[item.key] ? '19px' : '2px',
                        transition: 'left 0.2s, background 0.2s',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="terminal-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={sectionHeaderStyle}>Push Notifications</div>
              <p style={{ fontSize: '12px', color: '#444444', margin: 0 }}>In-app and browser push notification preferences</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { key: 'pushDeployments' as const, label: 'Deployments', desc: 'Notify when builds deploy successfully or fail' },
                { key: 'pushErrors' as const, label: 'Error Alerts', desc: 'Real-time notifications for runtime errors and crashes' },
                { key: 'pushNewSignups' as const, label: 'New Signups', desc: 'Push notification for each new user registration' },
                { key: 'pushTaskUpdates' as const, label: 'Task Updates', desc: 'Notifications when development tasks change status' },
              ].map(item => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    transition: 'background 0.1s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0', margin: '0 0 2px 0' }}>{item.label}</p>
                    <p style={{ fontSize: '10px', color: '#444444', margin: 0 }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(item.key)}
                    style={{
                      width: '36px',
                      height: '20px',
                      borderRadius: '10px',
                      background: notifications[item.key] ? '#4ADE80' : '#1a1a1a',
                      border: `1px solid ${notifications[item.key] ? '#4ADE80' : '#333333'}`,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        background: notifications[item.key] ? '#000000' : '#444444',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: notifications[item.key] ? '19px' : '2px',
                        transition: 'left 0.2s, background 0.2s',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{
                padding: '9px 24px',
                background: '#4ADE80',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6EE7A0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4ADE80'; }}
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
