'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProposalForm from '@/components/proposals/ProposalForm';

function NewProposalContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') || undefined;
  const dealId = searchParams.get('dealId') || undefined;

  return <ProposalForm customerId={customerId} dealId={dealId} />;
}

function NewProposalLoading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    </DashboardLayout>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<NewProposalLoading />}>
      <NewProposalContent />
    </Suspense>
  );
}