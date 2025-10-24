'use client';

import { Suspense } from 'react';
import CustomerDetailContent from './CustomerDetailContent';

function CustomerDetailLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2E4A62' }}></div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<CustomerDetailLoading />}>
      <CustomerDetailContent />
    </Suspense>
  );
}