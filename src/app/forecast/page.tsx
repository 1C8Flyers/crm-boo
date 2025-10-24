'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { dealService, dealStageService, customerService } from '@/lib/firebase-services';
import type { Deal, DealStage, Customer } from '@/types';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString(undefined, { month: 'short', year: 'numeric' });
}

export default function ForecastPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currency = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }), []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const load = async () => {
    try {
      const [dealsData, stagesData, customersData] = await Promise.all([
        dealService.getAll(),
        dealStageService.getAll(),
        customerService.getAll(),
      ]);
      // Ensure stage order
      setStages(stagesData.sort((a, b) => a.order - b.order));
      setCustomers(customersData);
      setDeals(dealsData);
    } catch (e) {
      console.error('Failed to load forecast data', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Assumptions:
  // - Forecast includes all deals not in "Closed Lost". Closed Won is treated as actuals.
  // - Weighted value = value * (probability / 100).
  // - Group by expectedCloseDate month if present, otherwise bucket into "No date".
  const closedLostStageIds = useMemo(() =>
    stages.filter(s => s.name.toLowerCase().includes('lost')).map(s => s.id), [stages]
  );
  const closedWonStageIds = useMemo(() =>
    stages.filter(s => s.name.toLowerCase().includes('won')).map(s => s.id), [stages]
  );

  const openDeals = deals.filter(d => !closedLostStageIds.includes(d.stageId));
  const openPipelineTotal = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100), 0);

  const now = new Date();
  const monthsAhead = 6;
  const monthBucketsOrder: string[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthBucketsOrder.push(monthKey(dt));
  }

  const byMonth = useMemo(() => {
    const map: Record<string, { count: number; sum: number; weighted: number }> = {};
    for (const key of monthBucketsOrder) map[key] = { count: 0, sum: 0, weighted: 0 };
    for (const d of openDeals) {
      if (d.expectedCloseDate) {
        const k = monthKey(startOfMonth(d.expectedCloseDate));
        if (map[k]) {
          map[k].count += 1;
          map[k].sum += d.value || 0;
          map[k].weighted += (d.value || 0) * ((d.probability || 0) / 100);
        }
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDeals, monthsAhead, now.getMonth(), now.getFullYear()]);

  const byStage = useMemo(() => {
    const map: Record<string, { name: string; count: number; sum: number; weighted: number }> = {};
    for (const s of stages) map[s.id] = { name: s.name, count: 0, sum: 0, weighted: 0 };
    for (const d of openDeals) {
      const bucket = map[d.stageId];
      if (!bucket) continue;
      bucket.count += 1;
      bucket.sum += d.value || 0;
      bucket.weighted += (d.value || 0) * ((d.probability || 0) / 100);
    }
    return map;
  }, [openDeals, stages]);

  const closedWonThisMonth = useMemo(() => {
    const start = startOfMonth(now);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return deals
      .filter(d => closedWonStageIds.includes(d.stageId) && d.updatedAt >= start && d.updatedAt < end)
      .reduce((sum, d) => sum + (d.value || 0), 0);
  }, [deals, closedWonStageIds]);

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
            <h1 className="text-2xl font-bold text-gray-900">Forecast</h1>
            <p className="text-gray-900">Weighted pipeline and projected revenue</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-t-4" style={{ borderTopColor: '#2E4A62' }}>
            <div className="text-sm text-gray-800">Open Pipeline</div>
            <div className="text-2xl font-bold text-gray-900">{currency.format(openPipelineTotal)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-t-4" style={{ borderTopColor: '#2E4A62' }}>
            <div className="text-sm text-gray-800">Weighted Pipeline</div>
            <div className="text-2xl font-bold text-gray-900">{currency.format(Math.round(weightedPipeline))}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-t-4" style={{ borderTopColor: '#2E4A62' }}>
            <div className="text-sm text-gray-800">Closed Won (This Month)</div>
            <div className="text-2xl font-bold text-gray-900">{currency.format(closedWonThisMonth)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-t-4" style={{ borderTopColor: '#A38B5C' }}>
            <div className="text-sm text-gray-800">Forecast Horizon</div>
            <div className="text-2xl font-bold text-gray-900">Next {monthsAhead} mo</div>
          </div>
        </div>

        {/* Forecast by Month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-t-4" style={{ borderTopColor: '#2E4A62' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Forecast by Month</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Forecast by month">
              <caption className="sr-only">Projected revenue by month (count, sum, and weighted sum)</caption>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Deals</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Sum</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Weighted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {monthBucketsOrder.map((key) => (
                  <tr key={key}>
                    <td className="px-4 py-2">{formatMonthLabel(key)}</td>
                    <td className="px-4 py-2">{byMonth[key]?.count || 0}</td>
                    <td className="px-4 py-2">{currency.format(Math.round(byMonth[key]?.sum || 0))}</td>
                    <td className="px-4 py-2">{currency.format(Math.round(byMonth[key]?.weighted || 0))}</td>
                  </tr>
                ))}
                {monthBucketsOrder.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-800" colSpan={4}>No forecast data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-t-4" style={{ borderTopColor: '#2E4A62' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pipeline by Stage</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Pipeline by stage">
              <caption className="sr-only">Open pipeline totals grouped by stage</caption>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Deals</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Sum</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Weighted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stages.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.color || '#CBD5E1' }} aria-hidden="true"></span>
                        {s.name}
                      </span>
                    </td>
                    <td className="px-4 py-2">{byStage[s.id]?.count || 0}</td>
                    <td className="px-4 py-2">{currency.format(Math.round(byStage[s.id]?.sum || 0))}</td>
                    <td className="px-4 py-2">{currency.format(Math.round(byStage[s.id]?.weighted || 0))}</td>
                  </tr>
                ))}
                {stages.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-800" colSpan={4}>No stages configured</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
