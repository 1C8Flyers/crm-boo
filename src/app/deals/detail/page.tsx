'use client';

import { Suspense } from 'react';
import DealDetailContent from './DealDetailContent';

function DealDetailLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function DealDetailPage() {
  return (
    <Suspense fallback={<DealDetailLoading />}>
      <DealDetailContent />
    </Suspense>
  );
}