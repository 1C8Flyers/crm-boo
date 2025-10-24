'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { activityService, customerService, dealService } from '@/lib/firebase-services';
import type { Activity, Customer, Deal } from '@/types';
import { 
  CheckSquare,
  Clock,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  User,
  TrendingUp,
  Check,
  X
} from 'lucide-react';

const activityIcons = {
  note: MessageSquare,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  task: CheckSquare,
};

const activityColors = {
  note: 'text-blue-500',
  call: 'text-green-500',
  meeting: 'text-purple-500',
  email: 'text-orange-500',
  task: 'text-red-500',
};

export default function ActivitiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [openItems, setOpenItems] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [openActivities, allActivitiesData, allCustomers, allDeals] = await Promise.all([
        activityService.getOpenItems(),
        activityService.getAll(),
        customerService.getAll(),
        dealService.getAll()
      ]);
      
      setOpenItems(openActivities);
      setAllActivities(allActivitiesData);
      setCustomers(allCustomers);
      setDeals(allDeals);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkComplete = async (activityId: string) => {
    try {
      setCompletingItems(prev => new Set(prev).add(activityId));
      const activity = (showAllActivities ? allActivities : openItems).find(a => a.id === activityId);
      
      if (activity?.completed) {
        // Mark as incomplete
        await activityService.update(activityId, { completed: false });
      } else {
        // Mark as complete
        await activityService.markAsComplete(activityId);
      }
      
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error toggling activity completion:', error);
    } finally {
      setCompletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
    }
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return '';
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || '';
  };

  const getDealTitle = (dealId?: string) => {
    if (!dealId) return '';
    const deal = deals.find(d => d.id === dealId);
    return deal?.title || '';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateOnly = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const isOverdue = (date: Date) => {
    return date < new Date();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Activities
            </h1>
            <p className="text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>
              {showAllActivities ? 'All activities in your CRM' : 'Manage your incomplete tasks and overdue follow-ups'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllActivities(!showAllActivities)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showAllActivities 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              style={{ fontFamily: 'PT Sans, sans-serif' }}
            >
              {showAllActivities ? 'Show Open Only' : 'Show All Activities'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (!showAllActivities && openItems.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                No open activities
              </p>
              <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                Great job staying on top of things!
              </p>
              {allActivities.length > 0 && (
                <button
                  onClick={() => setShowAllActivities(true)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  style={{ fontFamily: 'PT Sans, sans-serif' }}
                >
                  View all {allActivities.length} activities
                </button>
              )}
            </div>
          </div>
        ) : (showAllActivities && allActivities.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                No activities yet
              </p>
              <p className="text-sm text-gray-400" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                Activities will appear here as you add them to deals and customers
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {(showAllActivities ? allActivities : openItems).map((activity) => {
                const Icon = activityIcons[activity.type];
                const colorClass = activityColors[activity.type];
                const customerName = getCustomerName(activity.customerId);
                const dealTitle = getDealTitle(activity.dealId);
                const isItemOverdue = activity.dueDate && isOverdue(activity.dueDate);
                const isCompleting = completingItems.has(activity.id);

                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-6 hover:bg-gray-50 transition-colors">
                    <div 
                      className="flex items-start space-x-4 flex-1 cursor-pointer"
                      onClick={() => router.push(`/deals/detail?id=${activity.dealId}&editActivity=${activity.id}`)}
                    >
                      <Icon className={`w-5 h-5 ${colorClass} mt-1 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {activity.title}
                          </h3>
                          {isItemOverdue && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Overdue
                            </span>
                          )}
                          {activity.completed && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        
                        {activity.description && (
                          <p className="text-gray-700 text-sm mb-2" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                            {activity.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                          {customerName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {customerName}
                            </span>
                          )}
                          {dealTitle && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {dealTitle}
                            </span>
                          )}
                          {activity.meetingDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Meeting: {formatDate(activity.meetingDate)}
                            </span>
                          )}
                          {activity.dueDate && (
                            <span className={`flex items-center gap-1 ${isItemOverdue ? 'text-red-600' : ''}`}>
                              <Clock className="w-3 h-3" />
                              Due: {formatDateOnly(activity.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening the activity when clicking the button
                        handleMarkComplete(activity.id);
                      }}
                      disabled={isCompleting}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        activity.completed 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    >
                      {isCompleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {activity.completed ? 'Updating...' : 'Completing...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {activity.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}