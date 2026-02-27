
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { icons } from '../constants';
import { useApps } from '../hooks/useApps';
import { EdgeFunctionUser } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase, supabaseAdmin, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

type UserRole = 'admin' | 'manager' | 'user' | 'viewer';
type UserStatus = 'active' | 'inactive' | 'suspended' | 'invited';

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  app: string;
  lastSeen: string;
  createdAt: string;
}


const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-400',
  manager: 'bg-purple-500/10 text-purple-400',
  user: 'bg-blue-500/10 text-blue-400',
  viewer: 'bg-slate-500/10 text-slate-400',
};

const statusColors: Record<UserStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  inactive: 'bg-yellow-500/10 text-yellow-400',
  suspended: 'bg-red-500/10 text-red-400',
  invited: 'bg-sky-500/10 text-sky-400',
};

const statusDot: Record<UserStatus, string> = {
  active: 'bg-emerald-400',
  inactive: 'bg-yellow-400',
  suspended: 'bg-red-400',
  invited: 'bg-sky-400',
};

const tabs = [
  { id: 'users', label: 'All Users' },
  { id: 'salesloghq', label: 'SaleslogHQ' },
  { id: 'buybidhq', label: 'BuybidHQ' },
  { id: 'salesboardhq', label: 'SalesboardHQ' },
  { id: 'demolight', label: 'Demolight' },
  { id: 'activity', label: 'Activity' },
];

// App tab IDs mapped to the app name returned by the all-users edge function
const appTabMap: Record<string, string> = {
  buybidhq: 'BuybidHQ',
  salesboardhq: 'SalesboardHQ',
  demolight: 'Demolight',
};

// Reusable user table for per-app tabs
function UserTable({ users: tableUsers, onEdit, onAppInfo }: {
  users: AppUser[];
  onEdit: (user: AppUser) => void;
  onAppInfo: (app: string) => void;
}) {
  if (tableUsers.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center text-slate-500">No users found.</div>
    );
  }

  return (
    <>
      {/* Stat bar */}
      <div className="glass rounded-xl px-4 lg:px-6 py-3 flex flex-wrap items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-100">{tableUsers.length}</span>
          <span className="text-xs text-slate-500">total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-400">{tableUsers.filter(u => u.status === 'active').length}</span>
          <span className="text-xs text-slate-500">active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-yellow-400">{tableUsers.filter(u => u.status === 'inactive').length}</span>
          <span className="text-xs text-slate-500">inactive</span>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {tableUsers.map((user) => (
          <div key={user.id} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={() => onEdit(user)} className="text-slate-500 hover:text-slate-200 transition-colors p-2">
                <icons.more />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${roleColors[user.role]}`}>{user.role}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${statusColors[user.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[user.status]}`} />
                {user.status}
              </span>
              <button onClick={() => onAppInfo(user.app)} className="px-1.5 py-0.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 rounded text-[10px] text-slate-400 font-medium transition-colors">{user.app}</button>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Last seen: {user.lastSeen}</span>
              <span>Joined: {user.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="glass rounded-xl overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">User</th>
                <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Role</th>
                <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</th>
                <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">App</th>
                <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Last Seen</th>
                <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Joined</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {tableUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${roleColors[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${statusColors[user.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[user.status]}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => onAppInfo(user.app)} className="px-1.5 py-0.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 rounded text-[10px] text-slate-400 font-medium transition-colors">
                      {user.app}
                    </button>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{user.lastSeen}</td>
                  <td className="p-4 text-xs text-slate-400">{user.createdAt}</td>
                  <td className="p-4">
                    <button onClick={() => onEdit(user)} className="text-slate-500 hover:text-slate-200 transition-colors">
                      <icons.more />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AllUsers() {
  const { apps } = useApps();
  const { appSlug } = useParams<{ appSlug?: string }>();
  const currentApp = appSlug
    ? apps.find(a => a.name.toLowerCase().replace(/\s+/g, '-') === appSlug)?.name || null
    : null;

  const barData = apps.slice(0, 8).map(app => ({
    name: app.name,
    users: app.users + Math.floor(Math.random() * 10),
    color: app.status === 'live' ? '#10b981' : app.status === 'paused' ? '#f59e0b' : '#325AE7'
  }));

  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [appFilter, setAppFilter] = useState<string>(currentApp || 'all');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '' as string, status: '' as string, app: '' });
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', mobile: '', role: 'admin' as UserRole, accountType: 'dealer' as string, app: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [inviting, setInviting] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [appRegistry, setAppRegistry] = useState<Record<string, string>>({});

  // SaleslogHQ state
  interface SlUser {
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    is_active: boolean;
    hire_date: string | null;
    employee_number: string | null;
    created_at: string;
    sl_dealerships: { name: string } | null;
  }
  const [slUsers, setSlUsers] = useState<SlUser[]>([]);
  const [slLoading, setSlLoading] = useState(false);

  const validateField = (field: string, value: string) => {
    const errors = { ...formErrors };
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.email = 'Enter a valid email address';
    } else if (field === 'firstName' && !value.trim()) {
      errors.firstName = 'First name is required';
    } else if (field === 'lastName' && !value.trim()) {
      errors.lastName = 'Last name is required';
    } else {
      delete errors[field];
    }
    setFormErrors(errors);
  };

  useEffect(() => {
    setAppFilter(currentApp || 'all');
  }, [currentApp]);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch all users across all projects via edge function (service role bypasses JWT auth)
        const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        const res = await fetch(
          `${supabaseUrl}/functions/v1/all-users`,
          { headers: { Authorization: `Bearer ${serviceKey}` } }
        );

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Edge function error ${res.status}: ${body}`);
        }
        const data = await res.json();

        if (Array.isArray(data)) {
          const mapped: AppUser[] = data.map((u: EdgeFunctionUser) => {
            const name = u.name || 'Unknown';
            const initials = name.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
            const roleMap: Record<string, UserRole> = { super_admin: 'admin', admin: 'admin', Admin: 'admin', manager: 'manager', Manager: 'manager', consultant: 'user', Salesperson: 'user', user: 'user', viewer: 'viewer' };
            return {
              id: u.id,
              name,
              email: u.email || '',
              avatar: initials || 'U',
              role: roleMap[u.role] || 'user',
              status: (u.status || 'active') as UserStatus,
              app: u.app || 'Unknown',
              lastSeen: u.last_sign_in_at ? formatRelativeTime(u.last_sign_in_at) : 'Never',
              createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
            };
          });
          setUsers(mapped);
        } else {
          console.error('all-users returned non-array:', data);
          setFetchError('Unexpected response from user service');
          setUsers([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load users';
        console.error('fetchUsers error:', msg);
        setFetchError(msg);
        setUsers([]);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Fetch SaleslogHQ users when tab is active
  useEffect(() => {
    if (activeTab !== 'salesloghq' || slUsers.length > 0) return;
    async function fetchSlUsers() {
      setSlLoading(true);
      try {
        const { data, error } = await supabaseAdmin
          .from('sl_users')
          .select('id, display_name, email, phone, role, is_active, hire_date, employee_number, created_at, sl_dealerships(name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        // Supabase returns joined relations as arrays; flatten to single object
        const normalized = (data || []).map((row: any) => ({
          ...row,
          sl_dealerships: Array.isArray(row.sl_dealerships) ? row.sl_dealerships[0] || null : row.sl_dealerships,
        }));
        setSlUsers(normalized as SlUser[]);
      } catch {
        setSlUsers([]);
      }
      setSlLoading(false);
    }
    fetchSlUsers();
  }, [activeTab]);

  const displayUsers = currentApp ? users.filter(u => u.app === currentApp) : users;

  const filtered = displayUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchApp = appFilter === 'all' || u.app === appFilter;
    return matchSearch && matchRole && matchStatus && matchApp;
  });
  const counts = {
    total: displayUsers.length,
    active: displayUsers.filter((u) => u.status === 'active').length,
    inactive: displayUsers.filter((u) => u.status === 'inactive').length,
    suspended: displayUsers.filter((u) => u.status === 'suspended').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {currentApp ? `${apps.find(a => a.name === currentApp)?.icon || ''} ${currentApp} Users` : 'Users'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentApp ? `Manage users for ${currentApp}.` : 'Manage users across all applications.'}
          </p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => { setNewUser({ firstName: '', lastName: '', email: '', mobile: '', role: 'admin', accountType: 'dealer', app: '' }); setShowInvite(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
          >
            <icons.users className="w-4 h-4" />
            Add Admin User
          </button>
        )}
      </div>

      {/* Compact Stat Bar */}
      <div className="glass rounded-xl px-4 lg:px-6 py-3 flex flex-wrap items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-100">{counts.total}</span>
          <span className="text-xs text-slate-500">users</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-400">{counts.active}</span>
          <span className="text-xs text-slate-500">active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-yellow-400">{counts.inactive}</span>
          <span className="text-xs text-slate-500">inactive</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-red-400">{counts.suspended}</span>
          <span className="text-xs text-slate-500">suspended</span>
        </div>
      </div>

      {/* Tab Bar — only on main /users route */}
      {!currentApp && (
        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>{tab.label}</button>
          ))}
        </div>
      )}

      {/* All Users Tab */}
      {activeTab === 'users' && loading && (
        <div className="glass rounded-xl p-12 text-center animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-slate-800 rounded w-64 mx-auto" />
        </div>
      )}

      {activeTab === 'users' && !loading && displayUsers.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">{fetchError ? '⚠️' : '👥'}</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">{fetchError ? 'Failed to load users' : 'No users yet'}</h3>
          <p className="text-sm text-slate-500 mb-6">{fetchError || (currentApp ? `No users found for ${currentApp}.` : 'Add your first admin user to get started.')}</p>
          <button
            onClick={() => { setNewUser({ firstName: '', lastName: '', email: '', mobile: '', role: 'admin', accountType: 'dealer', app: '' }); setShowInvite(true); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Add Admin User
          </button>
        </div>
      )}

      {activeTab === 'users' && !loading && displayUsers.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <icons.search />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-slate-900 border border-white/5 focus:outline-none focus:border-blue-500"
              />
            </div>
            {!currentApp && (
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Apps</option>
                {apps.filter(a => a.status === 'live').map((app) => (
                  <option key={app.name} value={app.name}>{app.name}</option>
                ))}
              </select>
            )}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
              className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="invited">Invited</option>
            </select>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((user) => (
              <div key={user.id} className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const parts = user.name.split(' ');
                      setEditForm({ firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: user.email, phone: '', role: user.role, status: user.status, app: user.app });
                      setEditingUser(user);
                    }}
                    className="text-slate-500 hover:text-slate-200 transition-colors p-2"
                  >
                    <icons.more />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${roleColors[user.role]}`}>{user.role}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${statusColors[user.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[user.status]}`} />
                    {user.status}
                  </span>
                  <button onClick={() => setShowAppInfo(user.app)} className="px-1.5 py-0.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 rounded text-[10px] text-slate-400 font-medium transition-colors">{user.app}</button>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Last seen: {user.lastSeen}</span>
                  <span>Joined: {user.createdAt}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="glass rounded-xl p-12 text-center text-slate-500">No users match your filters.</div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="glass rounded-xl overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">User</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Role</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">App</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Last Seen</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Joined</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0">
                          {user.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${statusColors[user.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[user.status]}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setShowAppInfo(user.app)}
                        className="px-1.5 py-0.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 rounded text-[10px] text-slate-400 font-medium transition-colors"
                      >
                        {user.app}
                      </button>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{user.lastSeen}</td>
                    <td className="p-4 text-xs text-slate-400">{user.createdAt}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          const parts = user.name.split(' ');
                          setEditForm({
                            firstName: parts[0] || '',
                            lastName: parts.slice(1).join(' ') || '',
                            email: user.email,
                            phone: '',
                            role: user.role,
                            status: user.status,
                            app: user.app,
                          });
                          setEditingUser(user);
                        }}
                        className="text-slate-500 hover:text-slate-200 transition-colors"
                      >
                        <icons.more />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">No users match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* SaleslogHQ Tab */}
      {activeTab === 'salesloghq' && slLoading && (
        <div className="glass rounded-xl p-12 text-center animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-slate-800 rounded w-64 mx-auto" />
        </div>
      )}

      {activeTab === 'salesloghq' && !slLoading && slUsers.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No SaleslogHQ users yet</h3>
          <p className="text-sm text-slate-500">Users will appear here once they're added to SaleslogHQ.</p>
        </div>
      )}

      {activeTab === 'salesloghq' && !slLoading && slUsers.length > 0 && (
        <>
          <div className="glass rounded-xl px-4 lg:px-6 py-3 flex flex-wrap items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-100">{slUsers.length}</span>
              <span className="text-xs text-slate-500">total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-400">{slUsers.filter(u => u.is_active).length}</span>
              <span className="text-xs text-slate-500">active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-yellow-400">{slUsers.filter(u => !u.is_active).length}</span>
              <span className="text-xs text-slate-500">inactive</span>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {slUsers.map((u) => (
              <div key={u.id} className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0">
                    {(u.display_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{u.display_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400">{u.role || 'user'}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {u.sl_dealerships?.name && (
                    <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-slate-400 font-medium">{u.sl_dealerships.name}</span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{u.phone || '—'}</span>
                  <span>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="glass rounded-xl overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">User</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Role</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dealership</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phone</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hire Date</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {slUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg flex-shrink-0">
                            {(u.display_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{u.display_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400">
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{u.sl_dealerships?.name || '—'}</td>
                      <td className="p-4 text-xs text-slate-400">{u.phone || '—'}</td>
                      <td className="p-4 text-xs text-slate-400">{u.hire_date ? new Date(u.hire_date).toLocaleDateString() : '—'}</td>
                      <td className="p-4 text-xs text-slate-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Per-App Tabs (BuybidHQ, SalesboardHQ, Demolight) */}
      {appTabMap[activeTab] && (
        loading ? (
          <div className="glass rounded-xl p-12 text-center animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-48 mx-auto mb-4" />
            <div className="h-4 bg-slate-800 rounded w-64 mx-auto" />
          </div>
        ) : (
          <UserTable
            users={users.filter(u => u.app === appTabMap[activeTab])}
            onEdit={(user) => {
              const parts = user.name.split(' ');
              setEditForm({ firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: user.email, phone: '', role: user.role, status: user.status, app: user.app });
              setEditingUser(user);
            }}
            onAppInfo={setShowAppInfo}
          />
        )
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overlap Matrix */}
            <div className="glass rounded-xl p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg">User Overlap Heatmap</h3>
                <p className="text-xs text-slate-500">Number of shared users between different applications</p>
              </div>
              <div className="relative overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {apps.slice(0, 5).map(app => (
                        <th key={app.name} className="p-2 font-mono text-slate-500 -rotate-45 h-20 origin-bottom-left text-[10px]">{app.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apps.slice(0, 5).map((appY, idxY) => (
                      <tr key={appY.name}>
                        <td className="p-2 font-bold text-right text-slate-500 border-r border-white/5">{appY.name}</td>
                        {apps.slice(0, 5).map((appX, idxX) => {
                          const count = idxX === idxY ? appY.users : Math.floor(Math.random() * 15);
                          const intensity = idxX === idxY ? 'bg-blue-600/60' : count > 10 ? 'bg-blue-600/40' : count > 5 ? 'bg-blue-600/20' : 'bg-blue-600/5';
                          return (
                            <td key={appX.name} className={`p-4 border border-white/5 text-center ${intensity} font-bold text-slate-100`}>
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Engagement Bar Chart */}
            <div className="glass rounded-xl p-4 lg:p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg">Total Engagement by App</h3>
                <p className="text-xs text-slate-500">Active sessions per app in the last 30 days</p>
              </div>
              <div style={{ width: '100%', minHeight: 250 }} className="h-[250px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} hide />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                    <Tooltip
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px'}}
                      itemStyle={{color: '#f1f5f9'}}
                    />
                    <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </>
      )}

      {/* Add Admin User Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg lg:text-xl font-bold">Add Admin User</h3>
                <p className="text-xs text-slate-500 mt-1">Create a new admin user and assign them to an application.</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form
              className="p-4 lg:p-6 space-y-4 lg:space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (Object.keys(formErrors).length > 0 || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.app) return;
                setInviting(true);
                // Simulate API call
                setTimeout(() => {
                  setInviting(false);
                  setShowInvite(false);
                  setFormErrors({});
                }, 500);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    onBlur={(e) => validateField('firstName', e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 ${formErrors.firstName ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                  {formErrors.firstName && <p className="text-xs text-red-400">{formErrors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smith"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    onBlur={(e) => validateField('lastName', e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 ${formErrors.lastName ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                  {formErrors.lastName && <p className="text-xs text-red-400">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  onBlur={(e) => validateField('email', e.target.value)}
                  className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 ${formErrors.email ? 'border-red-500/50' : 'border-white/10'}`}
                />
                {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newUser.mobile}
                  maxLength={14}
                  onChange={(e) => setNewUser({ ...newUser, mobile: formatPhone(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Assign to App</label>
                  <select
                    required
                    value={newUser.app}
                    onChange={(e) => setNewUser({ ...newUser, app: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Select an app...</option>
                    {apps.map((app) => (
                      <option key={app.name} value={app.name}>
                        {app.icon} {app.name} ({app.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Account Type</label>
                  <select
                    value={newUser.accountType}
                    onChange={(e) => setNewUser({ ...newUser, accountType: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="dealer">Dealer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="internal">Internal</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              {newUser.app && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="text-2xl">{apps.find(a => a.name === newUser.app)?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{newUser.app}</p>
                    <p className="text-[10px] text-slate-500 truncate">{apps.find(a => a.name === newUser.app)?.description}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    apps.find(a => a.name === newUser.app)?.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' :
                    apps.find(a => a.name === newUser.app)?.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {apps.find(a => a.name === newUser.app)?.status}
                  </span>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || Object.keys(formErrors).length > 0 || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.app}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
                >
                  {inviting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App Info Modal */}
      {showAppInfo && (() => {
        const appData = apps.find(a => a.name === showAppInfo);
        const appUsers = users.filter(u => u.app === showAppInfo);
        const activeCount = appUsers.filter(u => u.status === 'active').length;
        const roleBreakdown = appUsers.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="glass w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {appData && (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-2xl">
                      {appData.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{showAppInfo}</h3>
                    <p className="text-xs text-slate-500">{appData?.description || 'Application overview'}</p>
                  </div>
                </div>
                <button onClick={() => setShowAppInfo(null)} className="text-slate-500 hover:text-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 text-center">
                    <p className="text-lg font-bold">{appUsers.length}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Total Users</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 text-center">
                    <p className="text-lg font-bold text-emerald-400">{activeCount}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Active</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 text-center">
                    <p className="text-lg font-bold text-blue-400">{appData?.tableCount || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Tables</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 text-center">
                    <p className="text-lg font-bold text-purple-400">{appData?.status || '—'}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                  </div>
                </div>

                {/* Role breakdown */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Role Breakdown</p>
                  <div className="flex gap-2">
                    {Object.entries(roleBreakdown).map(([role, count]) => (
                      <span key={role} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${roleColors[role as UserRole] || 'bg-slate-500/10 text-slate-400'}`}>
                        {role}: {count}
                      </span>
                    ))}
                    {Object.keys(roleBreakdown).length === 0 && (
                      <span className="text-xs text-slate-600">No users assigned</span>
                    )}
                  </div>
                </div>

                {/* App details */}
                {appData && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Database</p>
                      <p className="text-xs font-medium truncate">{appData.db}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Schema Prefix</p>
                      <p className="text-xs font-mono text-blue-400">{appData.schemaPrefix || '—'}</p>
                    </div>
                  </div>
                )}

                {/* User list */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Assigned Users</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {appUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {u.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{u.name}</p>
                            <p className="text-[10px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${roleColors[u.role]}`}>{u.role}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${statusColors[u.status]}`}>
                            <span className={`w-1 h-1 rounded-full ${statusDot[u.status]}`} />
                            {u.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {appUsers.length === 0 && (
                      <div className="text-center py-6 text-slate-600 text-sm">No users assigned to this app.</div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button onClick={() => setShowAppInfo(null)} className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Manage User</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const res = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
                  body: JSON.stringify({ userId: editingUser.id, app: editingUser.app, fields: editForm }),
                });
                const result = await res.json();
                if (!res.ok) { alert(`Error: ${result.error}`); return; }
                // Update local state
                setUsers(prev => prev.map(u => u.id === editingUser.id ? {
                  ...u,
                  name: [editForm.firstName, editForm.lastName].filter(Boolean).join(' ') || u.name,
                  email: editForm.email || u.email,
                  role: (editForm.role || u.role) as UserRole,
                  status: (editForm.status || u.status) as UserStatus,
                } : u));
                setEditingUser(null);
              } catch (err) { alert(`Save failed: ${(err as Error).message}`); }
              finally { setSaving(false); }
            }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                  {editingUser.avatar}
                </div>
                <div>
                  <p className="font-bold text-lg">{editingUser.name}</p>
                  <p className="text-sm text-slate-500">{editingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    maxLength={14}
                    onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Assigned App</label>
                  <select
                    value={editForm.app}
                    disabled
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 opacity-60"
                  >
                    {apps.map((app) => (
                      <option key={app.name} value={app.name}>
                        {app.icon} {app.name} ({app.status})
                      </option>
                    ))}
                    <option value="Watchtower">Watchtower</option>
                    <option value="Demolight">Demolight</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                <div>
                  <p className="text-sm font-semibold">Password Reset</p>
                  <p className="text-[10px] text-slate-500">Send a password reset email to {editingUser.email}</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold transition-colors"
                >
                  Send Reset Email
                </button>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
