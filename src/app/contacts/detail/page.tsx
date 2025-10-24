'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { contactService, customerService, dealService, activityService } from '@/lib/firebase-services';
import type { Contact, Customer, Deal, Activity } from '@/types';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Building,
  Calendar,
  Edit,
  Trash2,
  Star,
  MessageSquare,
  TrendingUp,
  CheckSquare,
  Eye
} from 'lucide-react';

const activityIcons = {
  note: MessageSquare,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  task: CheckSquare,
};

const activityColors = {
  note: 'text-blue-500',
  call: 'text-green-500',
  meeting: 'text-purple-500',
  email: 'text-orange-500',
  task: 'text-red-500',
};

function ContactDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contact, setContact] = useState<Contact | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contactId = searchParams.get('id');
    
    if (!contactId || !user) return;

    loadContactDetails(contactId);
  }, [searchParams, user]);

  const loadContactDetails = async (contactId: string) => {
    try {
      setLoading(true);
      
      const contactData = await contactService.getById(contactId);
      
      if (!contactData) {
        router.push('/contacts');
        return;
      }

      setContact(contactData);

      // Load customer if contact has one
      if (contactData.customerId) {
        const [customerData, dealsData, activitiesData] = await Promise.all([
          customerService.getById(contactData.customerId),
          dealService.getByCustomer(contactData.customerId),
          activityService.getByCustomerWithDeals(contactData.customerId)
        ]);
        
        setCustomer(customerData);
        setDeals(dealsData);
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error loading contact details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    
    if (confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`)) {
      try {
        await contactService.delete(contact.id);
        router.push('/contacts');
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact. Please try again.');
      }
    }
  };

  const handleEditFormSuccess = async () => {
    setShowEditForm(false);
    // Reload contact data
    if (contact) {
      await loadContactDetails(contact.id);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading || !contact) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2E4A62' }}></div>
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
              onClick={() => router.push('/contacts')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {contact.firstName} {contact.lastName}
                </h1>
                {contact.isPrimary && (
                  <div title="Primary Contact">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                )}
              </div>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                Contact Details
                {contact.title && ` • ${contact.title}`}
                {contact.department && ` • ${contact.department}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'var(--font-pt-sans)' }}
            >
              <Edit className="h-4 w-4" />
              Edit Contact
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              style={{ fontFamily: 'var(--font-pt-sans)' }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Email</p>
                    <a 
                      href={`mailto:${contact.email}`} 
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                      style={{ fontFamily: 'var(--font-pt-sans)' }}
                    >
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </a>
                  </div>

                  {contact.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Phone</p>
                      <a 
                        href={`tel:${contact.phone}`} 
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                        style={{ fontFamily: 'var(--font-pt-sans)' }}
                      >
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </a>
                    </div>
                  )}

                  {contact.title && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Job Title</p>
                      <p className="text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        {contact.title}
                      </p>
                    </div>
                  )}

                  {contact.department && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Department</p>
                      <p className="text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        {contact.department}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {contact.address && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Address</p>
                      <div className="flex items-start gap-2 text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-gray-500" />
                        <div>
                          {contact.address.street && <p>{contact.address.street}</p>}
                          {(contact.address.city || contact.address.state || contact.address.zipCode) && (
                            <p>
                              {contact.address.city}
                              {contact.address.city && contact.address.state && ', '}
                              {contact.address.state} {contact.address.zipCode}
                            </p>
                          )}
                          {contact.address.country && <p>{contact.address.country}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {customer && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Company</p>
                      <button
                        onClick={() => router.push(`/customers/detail?id=${customer.id}`)}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                        style={{ fontFamily: 'var(--font-pt-sans)' }}
                      >
                        <Building className="h-4 w-4" />
                        {customer.name}
                      </button>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>Contact Since</p>
                    <div className="flex items-center gap-2 text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {formatDate(contact.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            {contact.socialMedia && Object.keys(contact.socialMedia).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Social Media
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(contact.socialMedia).map(([platform, url]) => (
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline capitalize"
                        style={{ fontFamily: 'var(--font-pt-sans)' }}
                      >
                        {platform}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Related Deals */}
            {customer && deals.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Related Deals ({deals.length})
                </h3>
                
                <div className="space-y-4">
                  {deals.slice(0, 5).map((deal) => (
                    <div 
                      key={deal.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/deals/detail?id=${deal.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            {deal.title}
                          </h4>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <TrendingUp className="h-4 w-4" />
                              {formatCurrency(deal.value)}
                            </span>
                            <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <Calendar className="h-4 w-4" />
                              {formatDate(deal.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {deals.length > 5 && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        Showing 5 of {deals.length} deals
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            {customer && activities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Recent Activities ({activities.length})
                </h3>
                
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => {
                    const Icon = activityIcons[activity.type];
                    const colorClass = activityColors[activity.type];
                    
                    return (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 ${colorClass} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {activity.title}
                            </h4>
                            
                            {activity.description && (
                              <p className="text-gray-700 text-sm mb-2" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                                {activity.description}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {activities.length > 5 && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        Showing 5 of {activities.length} activities
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </a>
                
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    style={{ fontFamily: 'var(--font-pt-sans)' }}
                  >
                    <Phone className="h-4 w-4" />
                    Call Contact
                  </a>
                )}
                
                {customer && (
                  <button
                    onClick={() => router.push(`/customers/detail?id=${customer.id}`)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: 'var(--font-pt-sans)' }}
                  >
                    <Building className="h-4 w-4" />
                    View Company
                  </button>
                )}
              </div>
            </div>

            {/* Contact Stats */}
            {customer && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Company Overview
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#2E4A62', fontFamily: 'var(--font-poppins)' }}>
                      {deals.length}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Active Deals
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#A38B5C', fontFamily: 'var(--font-poppins)' }}>
                      {formatCurrency(deals.reduce((sum, deal) => sum + deal.value, 0))}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Total Deal Value
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#2E4A62', fontFamily: 'var(--font-poppins)' }}>
                      {activities.length}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Total Activities
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {showEditForm && customer && (
        <ContactFormModal
          contact={contact}
          customers={[customer]}
          defaultCustomerId={customer.id}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditFormSuccess}
        />
      )}
    </DashboardLayout>
  );
}

export default function ContactDetailPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2E4A62' }}></div>
        </div>
      </DashboardLayout>
    }>
      <ContactDetailContent />
    </Suspense>
  );
}