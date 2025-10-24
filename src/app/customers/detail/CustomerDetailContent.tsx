'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { customerService, dealService, activityService, dealStageService, contactService } from '@/lib/firebase-services';
import type { Customer, Deal, Activity, DealStage, Contact } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Building, 
  Phone, 
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageSquare,
  User,
  Plus,
  Eye,
  CheckSquare,
  Edit,
  Save,
  X,
  Trash2,
  Users
} from 'lucide-react';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

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

export default function CustomerDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    const customerId = searchParams.get('id');
    const editMode = searchParams.get('edit') === 'true';
    
    if (!customerId || !user) return;

    setIsEditing(editMode);
    loadCustomerDetails(customerId);
  }, [searchParams, user]);

  const loadCustomerDetails = async (customerId: string) => {
    try {
      setLoading(true);
      
      const [customerData, dealsData, activitiesData, stagesData, contactsData] = await Promise.all([
        customerService.getById(customerId),
        dealService.getByCustomer(customerId),
        activityService.getByCustomerWithDeals(customerId),
        dealStageService.getAll(),
        contactService.getByCustomer(customerId)
      ]);

      if (!customerData) {
        router.push('/customers');
        return;
      }

      setCustomer(customerData);
      setDeals(dealsData);
      setActivities(activitiesData);
      setStages(stagesData);
      setContacts(contactsData);

      // Reset form with customer data
      reset({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || '',
        company: customerData.company || '',
        address: customerData.address || {},
      });
    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!customer) return;
    
    setIsSaving(true);
    try {
      const customerData = {
        ...data,
        phone: data.phone || undefined,
        company: data.company || undefined,
        address: data.address && Object.values(data.address).some(v => v) ? data.address : undefined,
      };

      await customerService.update(customer.id, customerData);
      
      // Reload customer data
      await loadCustomerDetails(customer.id);
      setIsEditing(false);
      
      // Remove edit parameter from URL
      router.push(`/customers/detail?id=${customer.id}`);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      setError('root', {
        message: error.message || 'Failed to update customer. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    const customerId = searchParams.get('id');
    if (!customerId) return;

    if (isEditing && customer) {
      // Reset form to original values when canceling
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || {},
      });
      // Remove edit parameter from URL
      router.push(`/customers/detail?id=${customerId}`);
    } else {
      // Add edit parameter to URL
      router.push(`/customers/detail?id=${customerId}&edit=true`);
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    if (confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      try {
        await customerService.delete(customer.id);
        router.push('/customers');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const handleContactFormSuccess = async () => {
    setShowContactForm(false);
    // Reload contacts
    if (customer) {
      const contactsData = await contactService.getByCustomer(customer.id);
      setContacts(contactsData);
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

  const getStageColor = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage?.color || '#6B7280';
  };

  const getStageName = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage?.name || 'Unknown Stage';
  };

  const totalDealValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const activeDealCount = deals.length;

  if (loading || !customer) {
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
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                {customer.name}
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                Customer Details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                >
                  <Edit className="h-4 w-4" />
                  Edit Customer
                </button>
                <button
                  onClick={() => router.push(`/deals/new?customerId=${customer.id}`)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
                >
                  <Plus className="h-4 w-4" />
                  New Deal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Active Deals</p>
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {activeDealCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#A38B5C' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Total Value</p>
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {formatCurrency(totalDealValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#2E4A62' }}>
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-pt-sans)' }}>Activities</p>
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  {activities.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deals */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                Deals ({deals.length})
              </h3>
              
              {deals.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                    No deals found for this customer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <div key={deal.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {deal.title}
                            </h4>
                            <span 
                              className="px-2 py-1 text-xs rounded-full text-white"
                              style={{ 
                                backgroundColor: getStageColor(deal.stageId),
                                fontFamily: 'var(--font-pt-sans)'
                              }}
                            >
                              {getStageName(deal.stageId)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(deal.value)}
                            </span>
                            <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <Calendar className="h-4 w-4" />
                              {formatDate(deal.createdAt)}
                            </span>
                          </div>
                          
                          {deal.description && (
                            <p className="text-gray-700 text-sm mt-2" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              {deal.description}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => router.push(`/deals/detail?id=${deal.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View deal details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contacts */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Contacts ({contacts.length})
                </h3>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
                >
                  <Plus className="h-4 w-4" />
                  Add Contact
                </button>
              </div>
              
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                    No contacts found for this customer
                  </p>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
                  >
                    <Plus className="h-4 w-4" />
                    Add First Contact
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {contact.firstName} {contact.lastName}
                              </h4>
                              {contact.isPrimary && (
                                <span 
                                  className="px-2 py-1 text-xs rounded-full text-white"
                                  style={{ 
                                    backgroundColor: '#2E4A62',
                                    fontFamily: 'var(--font-pt-sans)'
                                  }}
                                >
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {contact.phone}
                              </div>
                            )}
                            {contact.title && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {contact.title}
                                {contact.department && ` - ${contact.department}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/contacts/detail?id=${contact.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View contact details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                Recent Activities ({activities.length})
              </h3>
              
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                    No activities recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 10).map((activity) => {
                    const Icon = activityIcons[activity.type];
                    const colorClass = activityColors[activity.type];
                    
                    return (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 ${colorClass} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {activity.title}
                              </h4>
                              {activity.dealId && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                                  Deal: {deals.find(d => d.id === activity.dealId)?.title || 'Unknown'}
                                </span>
                              )}
                            </div>
                            
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
                  
                  {activities.length > 10 && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        Showing 10 of {activities.length} activities
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Contact Information
                </h3>
                {isEditing && errors.root && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{errors.root.message}</p>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Name *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter customer name"
                      style={{ fontFamily: 'var(--font-pt-sans)' }}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Email *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter email address"
                      style={{ fontFamily: 'var(--font-pt-sans)' }}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Phone
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter phone number"
                      style={{ fontFamily: 'var(--font-pt-sans)' }}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Company
                    </label>
                    <input
                      {...register('company')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter company name"
                      style={{ fontFamily: 'var(--font-pt-sans)' }}
                    />
                    {errors.company && (
                      <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                    )}
                  </div>

                  {/* Address Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                      Address
                    </label>
                    <div className="space-y-3">
                      <div>
                        <input
                          {...register('address.street')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Street address"
                          style={{ fontFamily: 'var(--font-pt-sans)' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            {...register('address.city')}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="City"
                            style={{ fontFamily: 'var(--font-pt-sans)' }}
                          />
                        </div>
                        <div>
                          <input
                            {...register('address.state')}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="State/Province"
                            style={{ fontFamily: 'var(--font-pt-sans)' }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            {...register('address.zipCode')}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="ZIP/Postal code"
                            style={{ fontFamily: 'var(--font-pt-sans)' }}
                          />
                        </div>
                        <div>
                          <input
                            {...register('address.country')}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Country"
                            style={{ fontFamily: 'var(--font-pt-sans)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>Name</p>
                      <p className="text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>{customer.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>Email</p>
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                        {customer.email}
                      </a>
                    </div>
                  </div>

                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>Phone</p>
                        <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {customer.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>Company</p>
                        <p className="text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>{customer.company}</p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>Address</p>
                        <div className="text-gray-900" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                          {customer.address.street && <p>{customer.address.street}</p>}
                          {(customer.address.city || customer.address.state || customer.address.zipCode) && (
                            <p>
                              {customer.address.city}
                              {customer.address.city && customer.address.state && ', '}
                              {customer.address.state} {customer.address.zipCode}
                            </p>
                          )}
                          {customer.address.country && <p>{customer.address.country}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Stats */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
                Customer Since
              </h3>
              <p className="text-2xl font-bold" style={{ color: '#2E4A62', fontFamily: 'var(--font-poppins)' }}>
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && customer && (
        <ContactFormModal
          contact={null}
          customers={[customer]}
          defaultCustomerId={customer.id}
          onClose={() => setShowContactForm(false)}
          onSuccess={handleContactFormSuccess}
        />
      )}
    </DashboardLayout>
  );
}