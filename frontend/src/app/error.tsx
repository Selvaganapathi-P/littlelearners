'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[LittleLearners error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 px-4 text-center">
      <div className="text-8xl mb-6 animate-bounce">🙈</div>
      <h1 className="text-3xl font-display text-brand-pink mb-2">Oops! Something went wrong</h1>
      <p className="text-gray-500 font-body mb-8 max-w-sm">
        Don&apos;t worry — it&apos;s not you. Let&apos;s get you back to the fun stuff.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-brand-pink text-white rounded-2xl font-bold hover:bg-pink-600 transition-colors">
          Try Again
        </button>
        <Link href="/"
          className="px-6 py-3 bg-white text-gray-600 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
          Go Home
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-gray-300 mt-8 font-body">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
