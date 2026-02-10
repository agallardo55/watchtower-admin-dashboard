
import React, { useState } from 'react';
import { icons, apps } from '../constants';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
  apps: string[];
  lastSeen: string;
  createdAt: string;
}

const mockUsers: AppUser[] = [
  { id: '1', name: 'Adam Gallardo', email: 'adam@buybidhq.com', avatar: 'AG', role: 'admin', status: 'active', apps: ['BuybidHQ', 'SalesboardHQ', 'Watchtower'], lastSeen: '2 min ago', createdAt: '2025-06-01' },
  { id: '2', name: 'Maria Santos', email: 'maria@dealership.com', avatar: 'MS', role: 'manager', status: 'active', apps: ['BuybidHQ', 'SalesboardHQ'], lastSeen: '1 hour ago', createdAt: '2025-08-15' },
  { id: '3', name: 'Jake Turner', email: 'jake@autogroup.com', avatar: 'JT', role: 'user', status: 'active', apps: ['SalesboardHQ'], lastSeen: '3 hours ago', createdAt: '2025-09-22' },
  { id: '4', name: 'Priya Patel', email: 'priya@carsales.io', avatar: 'PP', role: 'user', status: 'active', apps: ['BuybidHQ'], lastSeen: '5 hours ago', createdAt: '2025-10-10' },
  { id: '5', name: 'Derek Mitchell', email: 'derek@wholesale.net', avatar: 'DM', role: 'manager', status: 'inactive', apps: ['BuybidHQ', 'SalesboardHQ'], lastSeen: '2 weeks ago', createdAt: '2025-07-03' },
  { id: '6', name: 'Lauren Chen', email: 'lauren@motors.com', avatar: 'LC', role: 'user', status: 'suspended', apps: ['SalesboardHQ'], lastSeen: '1 month ago', createdAt: '2025-11-18' },
  { id: '7', name: 'Carlos Reyes', email: 'carlos@autobuy.com', avatar: 'CR', role: 'viewer', status: 'active', apps: ['BuybidHQ'], lastSeen: '30 min ago', createdAt: '2026-01-05' },
  { id: '8', name: 'Nina Brooks', email: 'nina@fleet.co', avatar: 'NB', role: 'user', status: 'invited', apps: ['BuybidHQ'], lastSeen: 'Never', createdAt: '2026-02-07' },
  { id: '9', name: 'Omar Hassan', email: 'omar@dealernet.com', avatar: 'OH', role: 'user', status: 'active', apps: ['SalesboardHQ', 'BuybidHQ'], lastSeen: '12 hours ago', createdAt: '2025-12-01' },
  { id: '10', name: 'Sophie Tran', email: 'sophie@autocorp.io', avatar: 'ST', role: 'viewer', status: 'active', apps: ['SalesboardHQ'], lastSeen: '1 day ago', createdAt: '2026-01-20' },
];

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

export default function AllUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', mobile: '', role: 'admin' as UserRole, accountType: 'dealer' as string, app: '' });

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });


  const counts = {
    total: mockUsers.length,
    active: mockUsers.filter((u) => u.status === 'active').length,
    inactive: mockUsers.filter((u) => u.status === 'inactive').length,
    suspended: mockUsers.filter((u) => u.status === 'suspended').length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Users</h2>
          <p className="text-slate-500 mt-1">Manage users across all applications.</p>
        </div>
        <button
          onClick={() => { setNewUser({ firstName: '', lastName: '', email: '', mobile: '', role: 'admin', accountType: 'dealer', app: '' }); setShowInvite(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
        >
          <icons.users className="w-4 h-4" />
          Add Admin User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: counts.total, color: 'text-slate-100' },
          { label: 'Active', value: counts.active, color: 'text-emerald-400' },
          { label: 'Inactive', value: counts.inactive, color: 'text-yellow-400' },
          { label: 'Suspended', value: counts.suspended, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
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
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">User</th>
              <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Role</th>
              <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</th>
              <th className="p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Apps</th>
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
                  <div className="flex flex-wrap gap-1">
                    {user.apps.map((app) => (
                      <span key={app} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-slate-400 font-medium">
                        {app}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-xs text-slate-400">{user.lastSeen}</td>
                <td className="p-4 text-xs text-slate-400">{user.createdAt}</td>
                <td className="p-4">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    <icons.more />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">No users match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Admin User Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Add Admin User</h3>
                <p className="text-xs text-slate-500 mt-1">Create a new admin user and assign them to an application.</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <form
              className="p-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setShowInvite(false);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smith"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                />
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

              <div className="grid grid-cols-3 gap-4">
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
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-white/10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Manage User</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
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
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select defaultValue={editingUser.role} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select defaultValue={editingUser.status} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">App Access</label>
                <div className="flex flex-wrap gap-2">
                  {apps.filter(a => a.status === 'live').map((app) => (
                    <label key={app.name} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs cursor-pointer hover:border-blue-500/30 transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked={editingUser.apps.includes(app.name)}
                        className="rounded border-slate-600 bg-slate-800 accent-blue-600"
                      />
                      <span>{app.icon} {app.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
