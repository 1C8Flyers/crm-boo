'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealService, customerService, dealStageService, contactService } from '@/lib/firebase-services';
import Notes from '@/components/Notes';
import ProposalList from '@/components/proposals/ProposalList';
import type { Deal, Customer, DealStage, Contact } from '@/types';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  Mail,
  Edit3,
  Package,
  Eye,
  Users,
  ClipboardList
} from 'lucide-react';

export default function DealDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [deal, setDeal] = useState<Deal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stage, setStage] = useState<DealStage | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dealId = searchParams.get('id');
    const editActivityId = searchParams.get('editActivity');
    if (!dealId || !user) return;

    const loadDealDetails = async () => {
      try {
        setLoading(true);
        
        // Load deal data
        const dealData = await dealService.getById(dealId);
        
        if (!dealData) {
          router.push('/deals');
          return;
        }
        
        setDeal(dealData);
        
        // Load customer and stage
        const [customerData, stageData] = await Promise.all([
          customerService.getById(dealData.customerId),
          dealStageService.getById(dealData.stageId)
        ]);
        
        setCustomer(customerData);
        setStage(stageData);

        // Load contacts for this deal (for now, we'll show customer contacts)
        if (customerData) {
          const contactsData = await contactService.getByCustomer(customerData.id);
          setContacts(contactsData);
        }
      } catch (error) {
        console.error('Error loading deal details:', error);
        router.push('/deals');
      } finally {
        setLoading(false);
      }
    };

    loadDealDetails();
  }, [searchParams, user, router]);

  const refreshDealValues = async () => {
    if (!deal) return;
    
    try {
      await dealService.updateValuesFromProposals(deal.id);
      // Reload the deal to get updated values
      const updatedDeal = await dealService.getById(deal.id);
      if (updatedDeal) {
        setDeal(updatedDeal);
      }
    } catch (error) {
      console.error('Error refreshing deal values:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2E4A62' }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deal) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Deal not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The deal you're looking for doesn't exist or has been deleted.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/deals')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deals
            </button>
          </div>
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
              onClick={() => router.push('/deals')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                {deal.title}
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                {deal.description || 'Deal Details'}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/deals/edit?id=${deal.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
          >
            <Edit3 className="h-4 w-4" />
            Edit Deal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#A38B5C' }}>
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Deal Value</p>
                      <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {formatCurrency(deal.value)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Probability</p>
                      <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {deal.probability}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Expected Close</p>
                      <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Stage</p>
                      <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {stage?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Values Card */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Proposal Values
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#A38B5C' }}>
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Total Value</p>
                          <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                            {formatCurrency(deal.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {deal.subscriptionValue !== undefined && deal.subscriptionValue > 0 && (
                      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Subscription</p>
                            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {formatCurrency(deal.subscriptionValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {deal.oneTimeValue !== undefined && deal.oneTimeValue > 0 && (
                      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>One-time</p>
                            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {formatCurrency(deal.oneTimeValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Values are automatically calculated from all proposals linked to this deal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes & Activities */}
              <Notes 
                deal={deal} 
                customer={customer || undefined} 
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Customer Card */}
              {customer && (
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                      <Building className="mr-2 h-5 w-5" />
                      Customer
                    </h2>
                    <button
                      onClick={() => router.push(`/customers/detail?id=${customer.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View customer details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{customer.name}</h3>
                      {customer.company && (
                        <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>{customer.company}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        <Mail className="mr-2 h-4 w-4" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                          <Phone className="mr-2 h-4 w-4" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Card */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                    <Users className="mr-2 h-5 w-5" />
                    Contacts ({contacts.length})
                  </h2>
                </div>
                {contacts.length > 0 ? (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {contact.firstName} {contact.lastName}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>{contact.email}</p>
                          {contact.title && (
                            <div className="flex items-center gap-2 text-sm text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <User className="h-4 w-4" />
                              {contact.title}
                              {contact.department && ` - ${contact.department}`}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/contacts/detail?id=${contact.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View contact details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm" style={{ fontFamily: 'var(--font-pt-sans)' }}>No contacts found</p>
                  </div>
                )}
              </div>

              {/* Proposals Card */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Proposals
                  </h2>
                  <button
                    onClick={() => router.push(`/proposals/new?dealId=${deal.id}`)}
                    className="text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
                  >
                    Create Proposal
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <ProposalList dealId={deal.id} onUpdate={refreshDealValues} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
}