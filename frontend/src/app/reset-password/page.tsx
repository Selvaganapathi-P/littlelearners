'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Missing reset token — use the link from your email'); return; }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      login(res.token, res.user as User);
      setDone(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed — the link may have expired');
    } finally {
      setLoading(false);
    }
  }, [password, confirm, token, login, router]);

  if (!token) return (
    <div className="bg-white rounded-4xl p-8 card-shadow text-center space-y-4">
      <div className="text-5xl">⚠️</div>
      <p className="text-gray-600 font-body">No reset token found. Please use the link from your email.</p>
      <Link href="/forgot-password" className="inline-block px-6 py-3 bg-brand-pink text-white rounded-2xl font-bold hover:bg-pink-600 transition-colors">
        Request new link
      </Link>
    </div>
  );

  if (done) return (
    <div className="bg-white rounded-4xl p-8 card-shadow text-center space-y-4">
      <div className="text-5xl animate-bounce">✅</div>
      <h2 className="text-xl font-bold text-gray-800">Password reset!</h2>
      <p className="text-gray-500 font-body text-sm">You are now logged in. Redirecting…</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-4xl p-8 card-shadow space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-body">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
        <input
          type="password"
          required
          autoFocus
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Same password again"
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
      >
        {loading ? '⏳ Resetting…' : 'Set New Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔓</div>
          <h1 className="text-3xl text-brand-pink mb-1">Reset Password</h1>
          <p className="text-gray-500 font-body text-sm">Choose a new password for your account</p>
        </div>
        <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading…</div>}>
          <ResetPasswordContent />
        </Suspense>
        <p className="text-center text-sm text-gray-400 mt-6 font-body">
          <Link href="/login" className="text-brand-pink hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
