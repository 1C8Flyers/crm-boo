'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealService, dealStageService, customerService } from '@/lib/firebase-services';
import type { Deal, DealStage, Customer } from '@/types';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';

export default function Deals() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const [dealsData, stagesData, customersData] = await Promise.all([
        dealService.getAll(),
        dealStageService.getAll(),
        customerService.getAll(),
      ]);

      setDeals(dealsData);
      setCustomers(customersData);
      
      // Initialize default stages if none exist
      if (stagesData.length === 0) {
        await dealStageService.initializeDefaultStages();
        const newStages = await dealStageService.getAll();
        setStages(newStages);
      } else {
        setStages(stagesData);
      }
    } catch (error) {
      console.error('Error loading deals data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter(deal => deal.stageId === stageId);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
            <p className="text-gray-600">Track your sales opportunities</p>
          </div>
          <button
            onClick={() => router.push('/deals/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </button>
        </div>

        {isLoading ? (
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80">
                <div className="bg-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-24 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deal stages configured</h3>
            <p className="text-gray-500 mb-4">Deal stages will be created automatically when you add your first deal</p>
          </div>
        ) : (
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = getDealsByStage(stage.id);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div 
                      className="px-4 py-3 border-b border-gray-200"
                      style={{ borderTopColor: stage.color, borderTopWidth: '3px' }}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">{stage.name}</h3>
                        <span className="text-sm text-gray-500">
                          {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        ${stageValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {stageDeals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No deals in this stage</p>
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <h4 className="font-medium text-gray-900 mb-2">{deal.title}</h4>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span>${deal.value.toLocaleString()}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                <span>{getCustomerName(deal.customerId)}</span>
                              </div>
                              
                              {deal.expectedCloseDate && (
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span>{deal.expectedCloseDate.toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {deal.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {deal.description}
                              </p>
                            )}

                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Probability</span>
                                <span className="font-medium">{deal.probability}%</span>
                              </div>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${deal.probability}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{deals.length}</div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              ${deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              ${deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Weighted Value</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {deals.length > 0 ? Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg. Probability</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}