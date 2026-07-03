'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

export default function ParentLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      login(res.token, res.user as User);
      if (res.user.role === 'parent') router.push('/parent');
      else router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <h1 className="text-3xl text-brand-purple mb-1">Parent Login</h1>
          <p className="text-gray-500 font-body text-sm">Welcome back! Sign in to track your child&apos;s learning</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-4xl p-8 card-shadow space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-purple outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-purple outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-purple text-white rounded-2xl font-bold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6 font-body">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-purple hover:underline font-semibold">Sign Up</Link>
        </p>
        <p className="text-center text-sm text-gray-400 mt-2 font-body">
          <Link href="/" className="text-brand-pink hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
