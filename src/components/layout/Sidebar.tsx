'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  TrendingUp,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Deals', href: '/deals', icon: TrendingUp },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { signOut, userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-50 lg:hidden">
        <button
          type="button"
          className="m-4 inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-xl font-bold text-gray-900">CRM-BOO</h1>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent pathname={pathname} handleSignOut={handleSignOut} userProfile={userProfile} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">CRM-BOO</h1>
          </div>
          <SidebarContent pathname={pathname} handleSignOut={handleSignOut} userProfile={userProfile} />
        </div>
      </div>
    </>
  );
}

function SidebarContent({ pathname, handleSignOut, userProfile }: {
  pathname: string;
  handleSignOut: () => void;
  userProfile: any;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-900 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* User profile and sign out */}
      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        <div className="w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">{userProfile?.name}</p>
              <p className="text-xs text-gray-500">{userProfile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}