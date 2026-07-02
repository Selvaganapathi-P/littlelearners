'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      if (res.resetUrl) setResetUrl(res.resetUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-3xl text-brand-pink mb-1">Forgot Password</h1>
          <p className="text-gray-500 font-body text-sm">Enter your email to get a reset link</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-4xl p-8 card-shadow text-center space-y-4">
            <div className="text-5xl">{resetUrl ? '🔑' : '📬'}</div>
            <h2 className="text-xl font-bold text-gray-800">
              {resetUrl ? 'Click below to reset' : 'Check your email!'}
            </h2>
            <p className="text-gray-500 font-body text-sm">
              {resetUrl
                ? 'Use the button below to set a new password:'
                : 'A reset link has been sent to your email. Check your inbox (and spam folder).'}
            </p>
            {resetUrl && (
              <a href={resetUrl}
                className="block w-full py-3 bg-brand-purple text-white rounded-2xl font-bold text-center hover:bg-purple-700 transition-colors">
                🔑 Reset My Password →
              </a>
            )}
            <Link href="/login" className="block w-full py-3 bg-brand-pink text-white rounded-2xl font-bold text-center hover:bg-pink-600 transition-colors">
              Back to Login
            </Link>
          </div>
        ) : (
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
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-400 mt-6 font-body">
          Remember it?{' '}
          <Link href="/login" className="text-brand-pink hover:underline font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
