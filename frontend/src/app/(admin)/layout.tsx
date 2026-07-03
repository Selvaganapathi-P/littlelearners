'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
    if (!isLoading && user && !['admin', 'founder'].includes(user.role)) router.replace('/');
  }, [user, isLoading, router]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;
  return <>{children}</>;
}
