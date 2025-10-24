'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ backgroundColor: '#F0F4F7' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#2E4A62' }}></div>
      </div>
    );
  }

  if (!user) {
    return null; // This will be handled by the auth check in pages
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F4F7' }}>
      <Sidebar />
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}