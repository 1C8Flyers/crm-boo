'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Users, TrendingUp, Package, FileText, DollarSign, Calendar } from 'lucide-react';
import { customerService, dealService, productService, invoiceService } from '@/lib/firebase-services';

interface DashboardStats {
  totalCustomers: number;
  totalDeals: number;
  totalProducts: number;
  totalInvoices: number;
  totalRevenue: number;
  totalDealValue: number;
  subscriptionDealValue: number;
  oneTimeDealValue: number;
  upcomingTasks: number;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalDeals: 0,
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalDealValue: 0,
    subscriptionDealValue: 0,
    oneTimeDealValue: 0,
    upcomingTasks: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      const [customers, deals, products, invoices] = await Promise.all([
        customerService.getAll(),
        dealService.getAll(),
        productService.getAll(),
        invoiceService.getAll(),
      ]);

      const totalRevenue = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.total, 0);

      // Calculate deal values
      const totalDealValue = deals.reduce((sum, deal) => sum + deal.value, 0);
      const subscriptionDealValue = deals.reduce((sum, deal) => sum + (deal.subscriptionValue || 0), 0);
      const oneTimeDealValue = deals.reduce((sum, deal) => sum + (deal.oneTimeValue || 0), 0);

      setStats({
        totalCustomers: customers.length,
        totalDeals: deals.length,
        totalProducts: products.length,
        totalInvoices: invoices.length,
        totalRevenue,
        totalDealValue,
        subscriptionDealValue,
        oneTimeDealValue,
        upcomingTasks: 0, // TODO: Implement tasks
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-primary',
      href: '/customers',
    },
    {
      name: 'Active Deals',
      value: stats.totalDeals,
      icon: TrendingUp,
      color: 'bg-primary',
      href: '/deals',
    },
    {
      name: 'Total Deal Value',
      value: `$${stats.totalDealValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-accent',
      href: '/deals',
    },
    {
      name: 'Subscription Value',
      value: `$${stats.subscriptionDealValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-accent',
      href: '/deals',
    },
    {
      name: 'One-time Value',
      value: `$${stats.oneTimeDealValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-accent',
      href: '/deals',
    },
    {
      name: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-primary',
      href: '/products',
    },
    {
      name: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'bg-primary',
      href: '/invoices',
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-accent',
      href: '/invoices',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Dashboard</h1>
          <p className="text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>Welcome back! Here's your business overview.</p>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card) => (
              <div
                key={card.name}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => card.href && router.push(card.href)}
              >
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mr-4`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>{card.name}</p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Recent Activity</h3>
            <div className="space-y-4">
              <div className="text-center text-gray-700 py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p style={{ fontFamily: 'PT Sans, sans-serif' }}>No recent activity</p>
                <p className="text-sm" style={{ fontFamily: 'PT Sans, sans-serif' }}>Activity will appear here as you use the CRM</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/customers?new=true')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <Users className="w-6 h-6 mb-2" style={{ color: '#2E4A62' }} />
                <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Add Customer</p>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>Create new customer</p>
              </button>
              <button
                onClick={() => router.push('/deals?new=true')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <TrendingUp className="w-6 h-6 mb-2" style={{ color: '#2E4A62' }} />
                <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>New Deal</p>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>Create new deal</p>
              </button>
              <button
                onClick={() => router.push('/products?new=true')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <Package className="w-6 h-6 mb-2" style={{ color: '#A38B5C' }} />
                <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Add Product</p>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>Create new product</p>
              </button>
              <button
                onClick={() => router.push('/invoices?new=true')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <FileText className="w-6 h-6 mb-2" style={{ color: '#A38B5C' }} />
                <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>New Invoice</p>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>Create new invoice</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}