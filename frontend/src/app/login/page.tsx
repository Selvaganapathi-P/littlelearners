'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

export default function LoginPage() {
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
      if (res.user.role === 'founder') router.push('/founder');
      else if (['admin', 'staff'].includes(res.user.role)) router.push('/studio');
      else router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl text-brand-pink mb-1">LittleLearners</h1>
          <p className="text-gray-500 font-body">Staff & Admin Login</p>
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
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@school.com"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
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
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed card-shadow-sm"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6 font-body">
          Children&apos;s access →{' '}
          <a href="/" className="text-brand-pink hover:underline">Home</a>
        </p>
      </div>
    </div>
  );
}
