'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'founder') router.replace('/');
  }, [user, isLoading, router]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-4xl animate-spin">⚙️</div>
    </div>
  );

  if (!user) return null;
  return <>{children}</>;
}
