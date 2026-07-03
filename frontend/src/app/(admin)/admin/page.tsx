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

export default function FounderPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'analytics' | 'users' | 'schools' | 'system'>('analytics');
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
    if (!confirm(`${currentlyActive ? 'Deactivate' : 'Reactivate'} ${name}? ${currentlyActive ? 'They will no longer be able to sign in.' : 'They will be able to sign in again.'}`)) return;
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
      // Refresh users list
      const res = await api.get<unknown>('/auth/users').catch(() => ({ data: [] }));
      const list = ((res as { data?: unknown[] }).data ?? []) as UserRecord[];
      setUsers(list);
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
      const childList = ((cRes as { data?: unknown[] }).data ?? []) as unknown[];
      setStats({
        totalLessons: lessons.length,
        publishedLessons: lessons.filter(l => l.status === 'published').length,
        draftLessons: lessons.filter(l => l.status === 'draft').length,
        generatingLessons: lessons.filter(l => l.status === 'generating').length,
        totalChildren: childList.length,
        lessonsByFormat: byFormat,
        lessonsByGrade: byGrade,
      });
      const userList = ((uRes as { data?: unknown[]; users?: unknown[] }).data
        ?? (uRes as { users?: unknown[] }).users
        ?? []) as UserRecord[];
      setUsers(userList);
      const schoolList = ((sRes as { data?: unknown[] }).data ?? []) as SchoolRecord[];
      setSchools(schoolList);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user || !['admin', 'founder'].includes(user.role)) return null;

  const TABS = [
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'users', label: '👥 Users' },
    { id: 'schools', label: '🏫 Schools' },
    { id: 'system', label: '⚙️ System' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl text-brand-pink font-display">LittleLearners</Link>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'founder' ? 'bg-brand-pink/20 text-brand-pink' : 'bg-purple-500/20 text-purple-400'}`}>
            {user.role.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">Hi, {user.name}</span>
          <button onClick={() => { logout(); router.push('/admin-login'); }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === t.id ? 'border-brand-pink text-brand-pink' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-5xl animate-spin">⚙️</div>
          </div>
        ) : (
          <>
            {/* ── ANALYTICS ── */}
            {tab === 'analytics' && stats && (
              <div className="space-y-8">
                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Lessons', value: stats.totalLessons, icon: '🎬', color: '#FF6B9D' },
                    { label: 'Published', value: stats.publishedLessons, icon: '✅', color: '#10B981' },
                    { label: 'Draft', value: stats.draftLessons, icon: '✏️', color: '#F59E0B' },
                    { label: 'Children', value: stats.totalChildren, icon: '👧', color: '#06B6D4' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-gray-900 rounded-3xl p-5 border border-gray-800">
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-gray-400 mt-1 font-body">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Grade split */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['LKG', 'UKG'] as const).map(g => {
                    const count = stats.lessonsByGrade[g];
                    const pct = stats.totalLessons ? Math.round((count / stats.totalLessons) * 100) : 0;
                    return (
                      <div key={g} className="bg-gray-900 rounded-3xl p-5 border border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-lg">{g === 'LKG' ? '🐣' : '🦋'} {g}</span>
                          <span className="text-2xl font-bold" style={{ color: g === 'LKG' ? '#FF6B9D' : '#7C3AED' }}>{count}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g === 'LKG' ? '#FF6B9D' : '#7C3AED' }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-body">{pct}% of all lessons</p>
                      </div>
                    );
                  })}
                </div>

                {/* Format breakdown */}
                {Object.keys(stats.lessonsByFormat).length > 0 && (
                  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                    <h2 className="text-lg font-bold mb-5 text-gray-200">Lessons by Format</h2>
                    <div className="space-y-3">
                      {Object.entries(stats.lessonsByFormat).sort((a, b) => b[1] - a[1]).map(([fmt, count]) => {
                        const pct = Math.round((count / stats.totalLessons) * 100);
                        return (
                          <div key={fmt} className="flex items-center gap-3">
                            <span className="text-lg w-6 text-center">{VIDEO_FORMAT_ICONS[fmt as VideoFormat] ?? '🎬'}</span>
                            <span className="text-sm text-gray-400 w-40 font-body truncate">{VIDEO_FORMAT_LABELS[fmt as VideoFormat] ?? fmt}</span>
                            <div className="flex-1 bg-gray-800 rounded-full h-2">
                              <div className="h-2 rounded-full bg-brand-pink" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold text-gray-300 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Staff Studio', href: '/studio', icon: '🎬', desc: 'Create & manage lessons' },
                    { label: 'Content Calendar', href: '/calendar', icon: '📅', desc: 'Weekly mix & festivals' },
                    { label: 'Child View (LKG)', href: '/dashboard?grade=LKG', icon: '🐣', desc: 'As a child sees it' },
                  ].map(action => (
                    <a key={action.href} href={action.href}
                      className="bg-gray-900 border border-gray-800 rounded-3xl p-5 hover:border-brand-pink transition-colors group">
                      <div className="text-3xl mb-2">{action.icon}</div>
                      <div className="font-bold text-white group-hover:text-brand-pink transition-colors">{action.label}</div>
                      <div className="text-xs text-gray-400 font-body mt-0.5">{action.desc}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <div className="space-y-6">
                {/* Create new user */}
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                  <h3 className="font-bold text-gray-200 mb-4">Create Staff Account</h3>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      placeholder="Full name"
                      value={newUser.name}
                      onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                    />
                    <input
                      placeholder="Email address"
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                    />
                    <input
                      placeholder="Password (min 8 chars)"
                      type="password"
                      value={newUser.password}
                      onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newUser.role}
                        onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="submit" disabled={creatingUser}
                        className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                        {creatingUser ? '⏳' : '+ Create'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Staff & Admin table */}
                {(() => {
                  const staffUsers = users.filter(u => ['founder','admin','staff'].includes(u.role));
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-200">Staff & Admin</h2>
                        <span className="text-sm text-gray-500">{staffUsers.length} account{staffUsers.length !== 1 ? 's' : ''}</span>
                      </div>
                      {staffUsers.length === 0 ? (
                        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 text-center text-gray-500 text-sm">No staff accounts yet.</div>
                      ) : (
                        <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-800">
                              <tr>
                                {['Name', 'Email', 'Role', 'Joined', ''].map(h => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {staffUsers.map(u => (
                                <tr key={u._id} className={`transition-colors ${u.active === false ? 'opacity-40' : 'hover:bg-gray-800/50'}`}>
                                  <td className="px-4 py-3 font-semibold text-gray-200">{u.name}</td>
                                  <td className="px-4 py-3 text-gray-400 font-body text-xs">{u.email}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                      u.role === 'founder' ? 'bg-brand-pink/20 text-brand-pink' :
                                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-blue-500/20 text-blue-400'
                                    }`}>{u.role}</span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 font-body text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-1.5">
                                      {u.role !== 'founder' && (
                                        <>
                                          <button
                                            onClick={() => { setChangingPasswordUser(u); setNewPassword(''); }}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors whitespace-nowrap">
                                            🔑 Password
                                          </button>
                                          <button
                                            onClick={() => toggleUserActive(u._id, u.name, u.active !== false)}
                                            disabled={togglingUser === u._id}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${
                                              u.active === false ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}>
                                            {togglingUser === u._id ? '⏳' : u.active === false ? '✓ Activate' : 'Deactivate'}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Parents table */}
                {(() => {
                  const parents = users.filter(u => u.role === 'parent');
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-200">Parents</h2>
                        <span className="text-sm text-gray-500">{parents.length} account{parents.length !== 1 ? 's' : ''}</span>
                      </div>
                      {parents.length === 0 ? (
                        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 text-center text-gray-500 text-sm">No parent accounts yet.</div>
                      ) : (
                        <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-800">
                              <tr>
                                {['Name', 'Email', 'Joined', ''].map(h => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {parents.map(u => (
                                <tr key={u._id} className={`transition-colors ${u.active === false ? 'opacity-40' : 'hover:bg-gray-800/50'}`}>
                                  <td className="px-4 py-3 font-semibold text-gray-200">{u.name}</td>
                                  <td className="px-4 py-3 text-gray-400 font-body text-xs">{u.email}</td>
                                  <td className="px-4 py-3 text-gray-500 font-body text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => { setChangingPasswordUser(u); setNewPassword(''); }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors whitespace-nowrap">
                                        🔑 Password
                                      </button>
                                      <button
                                        onClick={() => toggleUserActive(u._id, u.name, u.active !== false)}
                                        disabled={togglingUser === u._id}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${
                                          u.active === false ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        }`}>
                                        {togglingUser === u._id ? '⏳' : u.active === false ? '✓ Activate' : 'Deactivate'}
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
                  );
                })()}
              </div>
            )}

            {/* Change Password Modal */}
            {changingPasswordUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-200">Change Password</h3>
                    <button onClick={() => { setChangingPasswordUser(null); setNewPassword(''); }} className="text-gray-500 hover:text-white text-xl">✕</button>
                  </div>
                  <p className="text-sm text-gray-400 font-body mb-4">
                    Setting new password for <span className="text-white font-semibold">{changingPasswordUser.name}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{changingPasswordUser.email}</span>
                  </p>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoFocus
                      required
                      minLength={8}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400 transition-colors"
                    />
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setChangingPasswordUser(null); setNewPassword(''); }}
                        className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-300 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={changingPassword}
                        className="flex-1 py-2.5 bg-yellow-500 text-gray-900 rounded-xl text-sm font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                        {changingPassword ? '⏳ Saving…' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── SCHOOLS ── */}
            {tab === 'schools' && (
              <div className="space-y-6">
                {/* Create school form */}
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                  <h3 className="font-bold text-gray-200 mb-4">Add New School</h3>
                  <form onSubmit={handleCreateSchool} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      placeholder="School name *"
                      value={newSchool.name}
                      onChange={e => setNewSchool(s => ({ ...s, name: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                    />
                    <input
                      placeholder="Contact email *"
                      type="email"
                      value={newSchool.contactEmail}
                      onChange={e => setNewSchool(s => ({ ...s, contactEmail: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                    />
                    <input
                      placeholder="City"
                      value={newSchool.city}
                      onChange={e => setNewSchool(s => ({ ...s, city: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="State"
                        value={newSchool.state}
                        onChange={e => setNewSchool(s => ({ ...s, state: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                      />
                      <select
                        value={newSchool.plan}
                        onChange={e => setNewSchool(s => ({ ...s, plan: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                      </select>
                      <button type="submit" disabled={creatingSchool}
                        className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                        {creatingSchool ? '⏳' : '+ Add'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-200">Schools</h2>
                  <span className="text-sm text-gray-500">{schools.length} school{schools.length !== 1 ? 's' : ''}</span>
                </div>

                {schools.length === 0 ? (
                  <div className="bg-gray-900 rounded-3xl p-10 border border-gray-800 text-center text-gray-500">
                    <div className="text-4xl mb-3">🏫</div>
                    <p>No schools yet. Add your first school above.</p>
                  </div>
                ) : (
                  <>
                  <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-800">
                        <tr>
                          {['School', 'Location', 'Plan', 'Added', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {schools.map(s => (
                          <tr key={s._id} className={`transition-colors ${!s.active ? 'opacity-40' : 'hover:bg-gray-800/50'}`}>
                            <td className="px-4 py-3 font-semibold text-gray-200">{s.name}</td>
                            <td className="px-4 py-3 text-gray-400 font-body text-xs">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                s.plan === 'premium' ? 'bg-yellow-500/20 text-yellow-400' :
                                s.plan === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-700 text-gray-400'
                              }`}>
                                {s.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-body text-xs">
                              {new Date(s.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => openEditSchool(s)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors whitespace-nowrap">
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => toggleSchoolActive(s._id, s.name, s.active)}
                                  disabled={togglingSchool === s._id}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${
                                    s.active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  }`}>
                                  {togglingSchool === s._id ? '⏳' : s.active ? 'Deactivate' : '✓ Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Edit school modal */}
                  {editingSchool && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-bold text-gray-200">Edit School</h3>
                          <button onClick={() => setEditingSchool(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSaveSchool} className="space-y-3">
                          <input
                            placeholder="School name *"
                            value={editSchoolData.name}
                            onChange={e => setEditSchoolData(d => ({ ...d, name: e.target.value }))}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                          />
                          <input
                            placeholder="Contact email *"
                            type="email"
                            value={editSchoolData.contactEmail}
                            onChange={e => setEditSchoolData(d => ({ ...d, contactEmail: e.target.value }))}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              placeholder="City"
                              value={editSchoolData.city}
                              onChange={e => setEditSchoolData(d => ({ ...d, city: e.target.value }))}
                              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                            />
                            <input
                              placeholder="State"
                              value={editSchoolData.state}
                              onChange={e => setEditSchoolData(d => ({ ...d, state: e.target.value }))}
                              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                            />
                          </div>
                          <select
                            value={editSchoolData.plan}
                            onChange={e => setEditSchoolData(d => ({ ...d, plan: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-pink transition-colors"
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                          </select>
                          <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setEditingSchool(null)}
                              className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-300 transition-colors">
                              Cancel
                            </button>
                            <button type="submit" disabled={savingSchool}
                              className="flex-1 py-2.5 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors">
                              {savingSchool ? '⏳' : 'Save Changes'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            )}

            {/* ── SYSTEM ── */}
            {tab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-200">System & Environment</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'API URL', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api' },
                    { label: 'Platform', value: 'Vercel (frontend) + Railway (backend + MongoDB)' },
                    { label: 'Frameworks', value: 'Next.js 16 + Express.js + Mongoose' },
                    { label: 'Video Pipeline', value: 'Script → TTS → Remotion (planned)' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                      <p className="text-sm text-gray-300 font-body break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                  <h3 className="font-bold text-gray-200 mb-4">Content Pillars</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: '🔤', name: 'Alphabets & Phonics' },
                      { icon: '🔢', name: 'Numbers & Math' },
                      { icon: '🎤', name: 'Rhymes & Songs' },
                      { icon: '📖', name: 'Moral Stories' },
                      { icon: '🌿', name: 'EVS' },
                      { icon: '🧘', name: 'Movement & Wellbeing' },
                    ].map(p => (
                      <div key={p.name} className="bg-gray-800 rounded-2xl px-3 py-2 flex items-center gap-2 text-sm">
                        <span>{p.icon}</span>
                        <span className="text-gray-300 font-body">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
