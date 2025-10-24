'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealService, customerService, dealStageService } from '@/lib/firebase-services';
import type { Deal, Customer, DealStage } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditDealContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('id');

  const [deal, setDeal] = useState<Deal | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(0);
  const [customerId, setCustomerId] = useState('');
  const [stageId, setStageId] = useState('');
  const [probability, setProbability] = useState(50);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  useEffect(() => {
    if (!user || !dealId) {
      router.push('/deals');
      return;
    }

    loadData();
  }, [user, dealId, router]);

  const loadData = async () => {
    if (!dealId) return;

    try {
      const [dealData, customersData, stagesData] = await Promise.all([
        dealService.getById(dealId),
        customerService.getAll(),
        dealStageService.getAll()
      ]);

      if (!dealData) {
        router.push('/deals');
        return;
      }

      setDeal(dealData);
      setCustomers(customersData);
      setStages(stagesData.sort((a, b) => a.order - b.order));

      // Populate form
      setTitle(dealData.title);
      setDescription(dealData.description || '');
      setValue(dealData.value);
      setCustomerId(dealData.customerId);
      setStageId(dealData.stageId);
      setProbability(dealData.probability);
      setExpectedCloseDate(
        dealData.expectedCloseDate 
          ? dealData.expectedCloseDate.toISOString().split('T')[0]
          : ''
      );
    } catch (error) {
      console.error('Error loading deal data:', error);
      router.push('/deals');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || saving) return;

    setSaving(true);
    try {
      // Create clean update object without undefined values
      const updateData: any = {
        title,
        value,
        customerId,
        stageId,
        probability,
        updatedAt: new Date()
      };

      // Only include optional fields if they have values
      if (description.trim()) {
        updateData.description = description.trim();
      }
      
      if (expectedCloseDate) {
        updateData.expectedCloseDate = new Date(expectedCloseDate);
      }

      await dealService.update(deal.id!, updateData);
      router.push(`/deals/detail?id=${deal.id}`);
    } catch (error) {
      console.error('Error updating deal:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deal) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Deal not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/deals/detail?id=${dealId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Deal</h1>
              <p className="text-gray-600">{deal.title}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Deal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage *
                </label>
                <select
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a stage</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probability (%)
                </label>
                <input
                  type="number"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter deal description (optional)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(`/deals/detail?id=${dealId}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title || !customerId || !stageId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}