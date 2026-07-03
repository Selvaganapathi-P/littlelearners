'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'founder') router.replace('/admin');
    else if (user?.role === 'staff') router.replace('/staff');
    else if (user?.role === 'parent') router.replace('/parent');
  }, [user, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (!['admin', 'founder'].includes(res.user.role)) {
        setError('This login is for admins only. Use Staff Login if you are a staff member.');
        return;
      }
      login(res.token, res.user as User);
      router.replace('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-3xl text-brand-pink mb-1">Admin Login</h1>
          <p className="text-gray-400 font-body text-sm">Full control — authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-4xl p-8 shadow-2xl space-y-5">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-2xl text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@school.com"
              className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500 font-body">
            Are you a staff member?{' '}
            <Link href="/staff-login" className="text-brand-purple hover:underline font-semibold">Staff Login →</Link>
          </p>
          <p className="text-sm text-gray-500 font-body">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
