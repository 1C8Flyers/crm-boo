'use client';

import { useState, useEffect } from 'react';
import { proposalService } from '@/lib/firebase-services';
import type { Proposal } from '@/types';
import { Plus, FileText, Calendar, DollarSign, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProposalListProps {
  customerId?: string;
  dealId?: string;
  onUpdate?: () => void;
}

export default function ProposalList({ customerId, dealId, onUpdate }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        let data: Proposal[];
        if (customerId) {
          data = await proposalService.getByCustomer(customerId);
        } else if (dealId) {
          data = await proposalService.getByDeal(dealId);
        } else {
          data = await proposalService.getAll();
        }
        setProposals(data);
        // Trigger update callback when proposals change
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [customerId, dealId, onUpdate]);

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'sent':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {customerId || dealId ? 'Proposals' : 'All Proposals'}
        </h2>
        <Link
          href={`/proposals/new${customerId ? `?customerId=${customerId}` : ''}${dealId ? `?dealId=${dealId}` : ''}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Proposal
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new proposal.
          </p>
          <div className="mt-6">
            <Link
              href={`/proposals/new${customerId ? `?customerId=${customerId}` : ''}${dealId ? `?dealId=${dealId}` : ''}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {proposals.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/proposals/detail?id=${proposal.id}`}
                  className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(proposal.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {proposal.title}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                            {proposal.status}
                          </span>
                        </div>
                        {proposal.description && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {proposal.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatCurrency(proposal.total)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(proposal.createdAt)}
                      </div>
                      {proposal.validUntil && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Valid until {formatDate(proposal.validUntil)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}