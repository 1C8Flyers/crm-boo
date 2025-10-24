"use client";

import { useMemo, useState } from 'react';
import type { Deal, DealStage, Customer } from '@/types';
import { dealService } from '@/lib/firebase-services';
import { useRouter } from 'next/navigation';

interface DealsListTableProps {
  deals: Deal[];
  stages: DealStage[];
  customers: Customer[];
  onLocalUpdate: (id: string, patch: Partial<Deal>) => void;
}

export default function DealsListTable({ deals, stages, customers, onLocalUpdate }: DealsListTableProps) {
  const router = useRouter();
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkStageId, setBulkStageId] = useState<string>('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const stagesById = useMemo(() => Object.fromEntries(stages.map(s => [s.id, s])), [stages]);
  const customerById = useMemo(() => Object.fromEntries(customers.map(c => [c.id, c])), [customers]);

  const updateDeal = async (id: string, patch: Partial<Deal>) => {
    try {
      setSavingIds(prev => ({ ...prev, [id]: true }));
      onLocalUpdate(id, patch); // optimistic
      await dealService.update(id, patch);
    } catch (err) {
      console.error('Failed to update deal', err);
      // In a fuller implementation, reload or revert
    } finally {
      setSavingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const visibleIds = useMemo(() => deals.map(d => d.id), [deals]);
  const selectedCount = useMemo(() => visibleIds.filter(id => selected[id]).length, [visibleIds, selected]);
  const allSelected = selectedCount > 0 && selectedCount === visibleIds.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      // clear only visible
      setSelected(prev => {
        const copy = { ...prev };
        for (const id of visibleIds) delete copy[id];
        return copy;
      });
    } else {
      setSelected(prev => {
        const copy = { ...prev };
        for (const id of visibleIds) copy[id] = true;
        return copy;
      });
    }
  };

  const bulkUpdateStage = async () => {
    if (!bulkStageId) return;
    const ids = visibleIds.filter(id => selected[id]);
    if (ids.length === 0) return;
    try {
      setBulkSaving(true);
      await Promise.all(ids.map(id => updateDeal(id, { stageId: bulkStageId })));
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      {/* Bulk actions bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700">Selected: {selectedCount}</div>
        <select
          value={bulkStageId}
          onChange={e => setBulkStageId(e.currentTarget.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
        >
          <option value="">Bulk change stage…</option>
          {stages.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          disabled={!bulkStageId || selectedCount === 0 || bulkSaving}
          onClick={bulkUpdateStage}
          className={`text-sm text-white px-3 py-1 rounded-md disabled:opacity-50 ${bulkSaving ? 'opacity-70' : ''}`}
          style={{ backgroundColor: '#2E4A62' }}
        >
          {bulkSaving ? 'Updating…' : 'Update Stage'}
        </button>
        {selectedCount > 0 && (
          <button
            onClick={() => setSelected({})}
            className="text-sm text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
          >
            Clear selection
          </button>
        )}
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Stage</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Probability</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Expected Close</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {deals.map((deal) => {
            const saving = !!savingIds[deal.id];
            return (
              <tr key={deal.id} className={saving ? 'opacity-60' : ''}>
                <td className="px-4 py-2 align-top">
                  <input
                    type="checkbox"
                    aria-label={`Select ${deal.title}`}
                    checked={!!selected[deal.id]}
                    onChange={(e) => setSelected(prev => ({ ...prev, [deal.id]: e.currentTarget.checked }))}
                  />
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    type="text"
                    defaultValue={deal.title}
                    onBlur={(e) => {
                      const v = e.currentTarget.value.trim();
                      if (v && v !== deal.title) updateDeal(deal.id, { title: v });
                    }}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {deal.description && (
                    <div className="text-xs text-gray-700 mt-1 line-clamp-2">{deal.description}</div>
                  )}
                </td>
                <td className="px-4 py-2 align-top">
                  <div className="text-sm text-gray-900">{customerById[deal.customerId]?.name || 'Unknown'}</div>
                </td>
                <td className="px-4 py-2 align-top">
                  <select
                    defaultValue={deal.stageId}
                    onChange={(e) => updateDeal(deal.id, { stageId: e.currentTarget.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={deal.value}
                    onBlur={(e) => {
                      const num = Number(e.currentTarget.value);
                      if (!Number.isNaN(num) && num !== deal.value) updateDeal(deal.id, { value: num });
                    }}
                    className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={deal.probability}
                    onBlur={(e) => {
                      let num = Number(e.currentTarget.value);
                      if (Number.isNaN(num)) return;
                      num = Math.max(0, Math.min(100, num));
                      if (num !== deal.probability) updateDeal(deal.id, { probability: num });
                    }}
                    className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    type="date"
                    defaultValue={deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().slice(0,10) : ''}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      const d = val ? new Date(val + 'T12:00:00') : undefined;
                      updateDeal(deal.id, { expectedCloseDate: d });
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 align-top text-right">
                  <button
                    onClick={() => router.push(`/deals/detail?id=${deal.id}`)}
                    className="text-sm text-white px-3 py-1 rounded-md"
                    style={{ backgroundColor: '#2E4A62' }}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
