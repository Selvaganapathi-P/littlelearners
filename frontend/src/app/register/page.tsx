'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await authApi.register(name.trim(), email, password, 'parent');
      login(res.token, res.user as User);
      router.push('/parent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <h1 className="text-3xl text-brand-purple mb-1">Join LittleLearners</h1>
          <p className="text-gray-500 font-body text-sm">Create a parent account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-4xl p-8 card-shadow space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Name</label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-purple outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
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
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-purple outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Same password again"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-purple outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-purple text-white rounded-2xl font-bold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? '⏳ Creating account…' : 'Create Account 🚀'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6 font-body">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-purple hover:underline font-semibold">Sign in</Link>
        </p>
        <p className="text-center text-sm text-gray-400 mt-2 font-body">
          No account needed for kids!{' '}
          <Link href="/onboarding" className="text-brand-pink hover:underline font-semibold">Just start here →</Link>
        </p>
      </div>
    </div>
  );
}
