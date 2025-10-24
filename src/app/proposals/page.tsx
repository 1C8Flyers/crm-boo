'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProposalList from '@/components/proposals/ProposalList';

export default function ProposalsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your sales proposals and track their progress
            </p>
          </div>
          <ProposalList />
        </div>
      </div>
    </DashboardLayout>
  );
}