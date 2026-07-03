'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { StaffNav } from '@/components/StaffNav';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/staff-login');
    }
    if (!isLoading && user && !['staff', 'admin', 'founder'].includes(user.role)) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">✨</div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav />
      {children}
    </div>
  );
}
