'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProposalForm from '@/components/proposals/ProposalForm';

function EditProposalContent() {
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('id') || undefined;

  if (!proposalId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Proposal not found</h1>
            <p className="mt-2 text-sm text-gray-600">
              No proposal ID was provided.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <ProposalForm proposalId={proposalId} />;
}

function EditProposalLoading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    </DashboardLayout>
  );
}

export default function EditProposalPage() {
  return (
    <Suspense fallback={<EditProposalLoading />}>
      <EditProposalContent />
    </Suspense>
  );
}