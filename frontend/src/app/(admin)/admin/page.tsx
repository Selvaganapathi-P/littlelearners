'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, authApi, schoolsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import type { VideoFormat } from '@/types';

interface Stats {
  totalLessons: number;
  publishedLessons: number;
  draftLessons: number;
  generatingLessons: number;
  totalChildren: number;
  lessonsByFormat: Record<string, number>;
  lessonsByGrade: { LKG: number; UKG: number };
}

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface SchoolRecord {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  contactEmail: string;
  plan: 'free' | 'basic' | 'premium';
  active: boolean;
  createdAt: string;
}

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 transition-all placeholder-slate-300';
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'analytics' | 'users' | 'schools' | 'system'>('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', contactEmail: '', city: '', state: '', plan: 'free' });
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolRecord | null>(null);
  const [editSchoolData, setEditSchoolData] = useState({ name: '', contactEmail: '', city: '', state: '', plan: 'free' });
  const [savingSchool, setSavingSchool] = useState(false);
  const [togglingSchool, setTogglingSchool] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();

  function openEditSchool(school: SchoolRecord) {
    setEditingSchool(school);
    setEditSchoolData({ name: school.name, contactEmail: school.contactEmail, city: school.city ?? '', state: school.state ?? '', plan: school.plan });
  }

  async function handleSaveSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSchool) return;
    setSavingSchool(true);
    try {
      await schoolsApi.update(editingSchool._id, editSchoolData);
      toast(`School "${editSchoolData.name}" updated`);
      setEditingSchool(null);
      const res = await schoolsApi.list() as { data: SchoolRecord[] };
      setSchools(res.data ?? []);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update school', 'error');
    } finally {
      setSavingSchool(false);
    }
  }

  async function toggleSchoolActive(id: string, name: string, currentlyActive: boolean) {
    if (!confirm(`${currentlyActive ? 'Deactivate' : 'Reactivate'} "${name}"?`)) return;
    setTogglingSchool(id);
    try {
      await schoolsApi.toggleActive(id);
      setSchools(prev => prev.map(s => s._id === id ? { ...s, active: !currentlyActive } : s));
      toast(`"${name}" ${currentlyActive ? 'deactivated' : 'reactivated'}`, currentlyActive ? 'warning' : 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update school', 'error');
    } finally {
      setTogglingSchool(null);
    }
  }

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!newSchool.name || !newSchool.contactEmail) { toast('Name and email required', 'warning'); return; }
    setCreatingSchool(true);
    try {
      await schoolsApi.create(newSchool);
      toast(`School "${newSchool.name}" created`);
      setNewSchool({ name: '', contactEmail: '', city: '', state: '', plan: 'free' });
      const res = await schoolsApi.list() as { data: SchoolRecord[] };
      setSchools(res.data ?? []);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create school', 'error');
    } finally {
      setCreatingSchool(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!changingPasswordUser) return;
    if (newPassword.length < 8) { toast('Password must be at least 8 characters', 'warning'); return; }
    setChangingPassword(true);
    try {
      await api.patch(`/auth/users/${changingPasswordUser._id}/password`, { password: newPassword });
      toast(`Password updated for ${changingPasswordUser.name}`);
      setChangingPasswordUser(null);
      setNewPassword('');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setChangingPassword(false);
    }
  }

  async function toggleUserActive(id: string, name: string, currentlyActive: boolean) {
    if (!confirm(`${currentlyActive ? 'Deactivate' : 'Reactivate'} ${name}?`)) return;
    setTogglingUser(id);
    try {
      await authApi.toggleUserActive(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, active: !currentlyActive } : u));
      toast(`${name} ${currentlyActive ? 'deactivated' : 'reactivated'}`, currentlyActive ? 'warning' : 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update user', 'error');
    } finally {
      setTogglingUser(null);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) { toast('All fields required', 'warning'); return; }
    setCreatingUser(true);
    try {
      await api.post('/auth/register', newUser);
      toast(`${newUser.role} account created for ${newUser.email}`);
      setNewUser({ name: '', email: '', password: '', role: 'staff' });
      const res = await api.get<unknown>('/auth/users').catch(() => ({ data: [] }));
      setUsers(((res as { data?: unknown[] }).data ?? []) as UserRecord[]);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create user', 'error');
    } finally {
      setCreatingUser(false);
    }
  }

  useEffect(() => {
    if (!user) { router.replace('/admin-login'); return; }
    if (!['admin', 'founder'].includes(user.role)) { router.replace('/'); return; }
    Promise.all([
      api.get<unknown>('/lessons?limit=1000&status=all').catch(() => ({ data: [] })),
      api.get<unknown>('/children?limit=1000').catch(() => ({ data: [] })),
      api.get<unknown>('/auth/users').catch(() => ({ data: [] })),
      schoolsApi.list().catch(() => ({ data: [] })),
    ]).then(([lRes, cRes, uRes, sRes]) => {
      const lessons = ((lRes as { data?: unknown[]; lessons?: unknown[] }).data
        ?? (lRes as { lessons: unknown[] }).lessons
        ?? []) as { status: string; videoFormat?: string; grade?: string }[];
      const byFormat: Record<string, number> = {};
      const byGrade = { LKG: 0, UKG: 0 };
      lessons.forEach(l => {
        if (l.videoFormat) byFormat[l.videoFormat] = (byFormat[l.videoFormat] || 0) + 1;
        if (l.grade === 'LKG') byGrade.LKG++;
        else if (l.grade === 'UKG') byGrade.UKG++;
      });
      setStats({
        totalLessons: lessons.length,
        publishedLessons: lessons.filter(l => l.status === 'published').length,
        draftLessons: lessons.filter(l => l.status === 'draft').length,
        generatingLessons: lessons.filter(l => l.status === 'generating').length,
        totalChildren: ((cRes as { data?: unknown[] }).data ?? []).length,
        lessonsByFormat: byFormat,
        lessonsByGrade: byGrade,
      });
      setUsers(((uRes as { data?: unknown[] }).data ?? []) as UserRecord[]);
      setSchools(((sRes as { data?: unknown[] }).data ?? []) as SchoolRecord[]);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user || !['admin', 'founder'].includes(user.role)) return null;

  const TABS = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'schools', label: 'Schools', icon: '🏫' },
    { id: 'system', label: 'System', icon: '⚙️' },
  ] as const;

  const staffUsers = users.filter(u => ['founder', 'admin', 'staff'].includes(u.role));
  const parentUsers = users.filter(u => u.role === 'parent');
  const searchQ = userSearch.toLowerCase();
  const filteredStaff = staffUsers.filter(u =>
    !searchQ || u.name.toLowerCase().includes(searchQ) || u.email.toLowerCase().includes(searchQ)
  );
  const filteredParents = parentUsers.filter(u =>
    !searchQ || u.name.toLowerCase().includes(searchQ) || u.email.toLowerCase().includes(searchQ)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-body">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-xl text-brand-purple">LittleLearners</Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-semibold text-slate-500">Admin Panel</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            user.role === 'founder' ? 'bg-pink-100 text-brand-pink' : 'bg-purple-100 text-brand-purple'
          }`}>
            {user.role.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <span className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </span>
            {user.name}
          </span>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
            Sign out
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id
                  ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading dashboard…</p>
          </div>
        ) : (
          <>

            {/* ══ ANALYTICS ══ */}
            {tab === 'analytics' && stats && (
              <div className="space-y-6">

                {/* KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Lessons', value: stats.totalLessons, icon: '🎬', accent: '#7C3AED', bg: '#F5F3FF' },
                    { label: 'Published', value: stats.publishedLessons, icon: '✅', accent: '#059669', bg: '#ECFDF5' },
                    { label: 'Drafts', value: stats.draftLessons, icon: '✏️', accent: '#D97706', bg: '#FFFBEB' },
                    { label: 'Children', value: stats.totalChildren, icon: '👧', accent: '#0891B2', bg: '#ECFEFF' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: stat.bg }}>
                          {stat.icon}
                        </div>
                        <span className="text-3xl font-bold" style={{ color: stat.accent }}>{stat.value}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Secondary stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Users Overview</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Staff & Admin', value: staffUsers.length, color: 'bg-purple-100 text-brand-purple' },
                        { label: 'Parents', value: parentUsers.length, color: 'bg-pink-100 text-brand-pink' },
                        { label: 'Schools', value: schools.length, color: 'bg-blue-100 text-blue-600' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{row.label}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade split */}
                  {(['LKG', 'UKG'] as const).map(g => {
                    const count = stats.lessonsByGrade[g];
                    const pct = stats.totalLessons ? Math.round((count / stats.totalLessons) * 100) : 0;
                    const color = g === 'LKG' ? '#FF6B9D' : '#7C3AED';
                    const bg = g === 'LKG' ? '#FFF0F5' : '#F5F3FF';
                    return (
                      <div key={g} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{g === 'LKG' ? '🐣' : '🦋'}</span>
                            <div>
                              <p className="font-bold text-slate-700">{g}</p>
                              <p className="text-xs text-slate-400">{pct}% of lessons</p>
                            </div>
                          </div>
                          <span className="text-2xl font-bold" style={{ color }}>{count}</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: bg }}>
                          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Format breakdown */}
                {Object.keys(stats.lessonsByFormat).length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-bold text-slate-700">Lessons by Format</h2>
                      <span className="text-xs text-slate-400">{Object.keys(stats.lessonsByFormat).length} formats</span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(stats.lessonsByFormat).sort((a, b) => b[1] - a[1]).map(([fmt, count]) => {
                        const pct = Math.round((count / stats.totalLessons) * 100);
                        return (
                          <div key={fmt} className="flex items-center gap-3">
                            <span className="text-lg w-7 text-center">{VIDEO_FORMAT_ICONS[fmt as VideoFormat] ?? '🎬'}</span>
                            <span className="text-sm text-slate-600 w-44 truncate">{VIDEO_FORMAT_LABELS[fmt as VideoFormat] ?? fmt}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full">
                              <div className="h-2 rounded-full bg-brand-purple transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold text-slate-700 w-6 text-right font-mono">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Staff Studio', href: '/studio', icon: '🎬', desc: 'Create & manage lessons', color: '#F5F3FF' },
                      { label: 'Content Calendar', href: '/calendar', icon: '📅', desc: 'Weekly schedule & festivals', color: '#FFF7ED' },
                      { label: 'Child View', href: '/dashboard?grade=LKG', icon: '🐣', desc: 'See it as a child would', color: '#FFF0F5' },
                    ].map(action => (
                      <a key={action.href} href={action.href}
                        className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-brand-purple hover:shadow-md transition-all group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: action.color }}>
                          {action.icon}
                        </div>
                        <p className="font-bold text-slate-700 group-hover:text-brand-purple transition-colors">{action.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ USERS ══ */}
            {tab === 'users' && (
              <div className="space-y-6">

                {/* Summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Users', value: users.length, icon: '👥', color: 'text-brand-purple', bg: 'bg-purple-50' },
                    { label: 'Active', value: users.filter(u => u.active !== false).length, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Staff / Admin', value: staffUsers.length, icon: '🧑‍💼', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Parents', value: parentUsers.length, icon: '👨‍👩‍👧', color: 'text-brand-pink', bg: 'bg-pink-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create user form */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-purple/5 to-transparent px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700">Create New Account</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Add a staff member or admin to the platform</p>
                  </div>
                  <form onSubmit={handleCreateUser} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Full Name</label>
                      <input
                        placeholder="e.g. Priya Sharma"
                        value={newUser.name}
                        onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Email Address</label>
                      <input
                        placeholder="email@school.com"
                        type="email"
                        value={newUser.email}
                        onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Password</label>
                      <input
                        placeholder="Min 8 characters"
                        type="password"
                        value={newUser.password}
                        onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Role</label>
                      <div className="flex gap-2">
                        <select
                          value={newUser.role}
                          onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                          className={INPUT + ' flex-1'}
                          style={{ width: 'auto' }}
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                          <option value="parent">Parent</option>
                        </select>
                        <button type="submit" disabled={creatingUser}
                          className="px-5 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm">
                          {creatingUser ? '…' : '+ Create'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Search users by name or email…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 transition-all placeholder-slate-300"
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">✕</button>
                  )}
                </div>

                {/* Staff & Admin table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-700">Staff & Admin</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Accounts with platform access</p>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                      {filteredStaff.length} account{filteredStaff.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {filteredStaff.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl mb-2">🧑‍💼</p>
                      <p className="text-slate-400 text-sm">{userSearch ? 'No matches found' : 'No staff accounts yet'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStaff.map(u => (
                            <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 text-brand-purple flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-700">{u.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  u.role === 'founder' ? 'bg-pink-100 text-brand-pink' :
                                  u.role === 'admin' ? 'bg-purple-100 text-brand-purple' :
                                  'bg-blue-100 text-blue-600'
                                }`}>{u.role}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  u.active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.active !== false ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                  {u.active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                              <td className="px-4 py-3.5">
                                {u.role !== 'founder' && (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => { setChangingPasswordUser(u); setNewPassword(''); }}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition-colors whitespace-nowrap">
                                      🔑 Password
                                    </button>
                                    <button
                                      onClick={() => toggleUserActive(u._id, u.name, u.active !== false)}
                                      disabled={togglingUser === u._id}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 whitespace-nowrap ${
                                        u.active !== false
                                          ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100'
                                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
                                      }`}>
                                      {togglingUser === u._id ? '…' : u.active !== false ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Parents table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-700">Parents</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Registered parent accounts</p>
                    </div>
                    <span className="text-xs font-semibold bg-pink-50 text-brand-pink px-2.5 py-1 rounded-full">
                      {filteredParents.length} account{filteredParents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {filteredParents.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl mb-2">👨‍👩‍👧</p>
                      <p className="text-slate-400 text-sm">{userSearch ? 'No matches found' : 'No parent accounts yet'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {['Name', 'Email', 'Status', 'Joined', 'Actions'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredParents.map(u => (
                            <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-pink-100 text-brand-pink flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-700">{u.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                              <td className="px-4 py-3.5">
                                <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  u.active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.active !== false ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                  {u.active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => { setChangingPasswordUser(u); setNewPassword(''); }}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition-colors whitespace-nowrap">
                                    🔑 Password
                                  </button>
                                  <button
                                    onClick={() => toggleUserActive(u._id, u.name, u.active !== false)}
                                    disabled={togglingUser === u._id}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 whitespace-nowrap ${
                                      u.active !== false
                                        ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
                                    }`}>
                                    {togglingUser === u._id ? '…' : u.active !== false ? 'Deactivate' : 'Activate'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ SCHOOLS ══ */}
            {tab === 'schools' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700">Add New School</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Onboard a new school to the platform</p>
                  </div>
                  <form onSubmit={handleCreateSchool} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>School Name *</label>
                      <input placeholder="e.g. Sunshine Montessori" value={newSchool.name}
                        onChange={e => setNewSchool(s => ({ ...s, name: e.target.value }))} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Contact Email *</label>
                      <input placeholder="principal@school.edu" type="email" value={newSchool.contactEmail}
                        onChange={e => setNewSchool(s => ({ ...s, contactEmail: e.target.value }))} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>City</label>
                      <input placeholder="Chennai" value={newSchool.city}
                        onChange={e => setNewSchool(s => ({ ...s, city: e.target.value }))} className={INPUT} />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className={LABEL}>State</label>
                        <input placeholder="Tamil Nadu" value={newSchool.state}
                          onChange={e => setNewSchool(s => ({ ...s, state: e.target.value }))} className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Plan</label>
                        <select value={newSchool.plan} onChange={e => setNewSchool(s => ({ ...s, plan: e.target.value }))}
                          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-brand-purple transition-all">
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                      <button type="submit" disabled={creatingSchool}
                        className="px-5 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm">
                        {creatingSchool ? '…' : '+ Add'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700">All Schools</h2>
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                      {schools.length} school{schools.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {schools.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-4xl mb-3">🏫</p>
                      <p className="text-slate-400">No schools yet. Add your first school above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {['School', 'Location', 'Contact', 'Plan', 'Status', 'Added', 'Actions'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {schools.map(s => (
                            <tr key={s._id} className={`transition-colors ${!s.active ? 'opacity-50' : 'hover:bg-slate-50/70'}`}>
                              <td className="px-4 py-3.5 font-semibold text-slate-700">{s.name}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{s.contactEmail}</td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  s.plan === 'premium' ? 'bg-amber-100 text-amber-600' :
                                  s.plan === 'basic' ? 'bg-blue-100 text-blue-600' :
                                  'bg-slate-100 text-slate-500'
                                }`}>{s.plan}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  s.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                  {s.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex gap-1.5">
                                  <button onClick={() => openEditSchool(s)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors whitespace-nowrap">
                                    ✏️ Edit
                                  </button>
                                  <button onClick={() => toggleSchoolActive(s._id, s.name, s.active)} disabled={togglingSchool === s._id}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 whitespace-nowrap ${
                                      s.active ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
                                    }`}>
                                    {togglingSchool === s._id ? '…' : s.active ? 'Deactivate' : 'Activate'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ SYSTEM ══ */}
            {tab === 'system' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', icon: '🔌' },
                    { label: 'Frontend Host', value: 'Vercel', icon: '▲' },
                    { label: 'Backend Host', value: 'Railway', icon: '🚂' },
                    { label: 'Database', value: 'MongoDB (Railway)', icon: '🗄️' },
                    { label: 'Frontend Stack', value: 'Next.js 16 (App Router)', icon: '⚛️' },
                    { label: 'Backend Stack', value: 'Express.js + Mongoose', icon: '🟢' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-700 mt-1 break-all">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700">Content Pillars</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Core learning areas on the platform</p>
                  </div>
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: '🔤', name: 'Alphabets & Phonics', color: 'bg-purple-50' },
                      { icon: '🔢', name: 'Numbers & Math', color: 'bg-blue-50' },
                      { icon: '🎤', name: 'Rhymes & Songs', color: 'bg-pink-50' },
                      { icon: '📖', name: 'Moral Stories', color: 'bg-amber-50' },
                      { icon: '🌿', name: 'EVS', color: 'bg-emerald-50' },
                      { icon: '🧘', name: 'Movement & Wellbeing', color: 'bg-cyan-50' },
                    ].map(p => (
                      <div key={p.name} className={`${p.color} rounded-xl px-4 py-3 flex items-center gap-3`}>
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-sm font-semibold text-slate-600">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700">Video Pipeline</h3>
                  </div>
                  <div className="p-6 flex items-center gap-2 flex-wrap">
                    {['Script Writing', '→', 'Text-to-Speech', '→', 'Remotion Render', '→', 'Publish'].map((step, i) => (
                      step === '→' ? (
                        <span key={i} className="text-slate-300 font-bold">→</span>
                      ) : (
                        <span key={i} className="bg-brand-purple/10 text-brand-purple text-sm font-semibold px-3 py-1.5 rounded-lg">{step}</span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ MODALS ══ */}

            {/* Change Password Modal */}
            {changingPasswordUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-sm shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
                    <button onClick={() => { setChangingPasswordUser(null); setNewPassword(''); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm">✕</button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      changingPasswordUser.role === 'parent' ? 'bg-pink-100 text-brand-pink' : 'bg-purple-100 text-brand-purple'
                    }`}>
                      {changingPasswordUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{changingPasswordUser.name}</p>
                      <p className="text-xs text-slate-400">{changingPasswordUser.email}</p>
                    </div>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className={LABEL}>New Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        autoFocus
                        required
                        minLength={8}
                        className={INPUT}
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => { setChangingPasswordUser(null); setNewPassword(''); }}
                        className="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={changingPassword}
                        className="flex-1 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm">
                        {changingPassword ? '…' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit School Modal */}
            {editingSchool && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-800">Edit School</h3>
                    <button onClick={() => setEditingSchool(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm">✕</button>
                  </div>
                  <form onSubmit={handleSaveSchool} className="space-y-4">
                    <div>
                      <label className={LABEL}>School Name *</label>
                      <input placeholder="School name" value={editSchoolData.name}
                        onChange={e => setEditSchoolData(d => ({ ...d, name: e.target.value }))} required className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Contact Email *</label>
                      <input placeholder="Contact email" type="email" value={editSchoolData.contactEmail}
                        onChange={e => setEditSchoolData(d => ({ ...d, contactEmail: e.target.value }))} required className={INPUT} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>City</label>
                        <input placeholder="City" value={editSchoolData.city}
                          onChange={e => setEditSchoolData(d => ({ ...d, city: e.target.value }))} className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>State</label>
                        <input placeholder="State" value={editSchoolData.state}
                          onChange={e => setEditSchoolData(d => ({ ...d, state: e.target.value }))} className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Plan</label>
                      <select value={editSchoolData.plan} onChange={e => setEditSchoolData(d => ({ ...d, plan: e.target.value }))}
                        className={INPUT}>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setEditingSchool(null)}
                        className="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={savingSchool}
                        className="flex-1 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm">
                        {savingSchool ? '…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
