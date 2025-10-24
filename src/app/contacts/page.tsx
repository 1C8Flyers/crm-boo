'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { contactService, customerService } from '@/lib/firebase-services';
import type { Contact, Customer } from '@/types';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building, 
  Edit3, 
  Trash2,
  User,
  Star,
  X
} from 'lucide-react';

function ContactsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    // Check if we should open the form for a new contact
    const newContact = searchParams.get('new');
    if (newContact === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, selectedCustomer]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [contactsData, customersData] = await Promise.all([
        contactService.getAll(),
        customerService.getAll()
      ]);
      setContacts(contactsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.firstName.toLowerCase().includes(term) ||
        contact.lastName.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        (contact.title && contact.title.toLowerCase().includes(term)) ||
        (contact.department && contact.department.toLowerCase().includes(term))
      );
    }

    if (selectedCustomer) {
      filtered = filtered.filter(contact => contact.customerId === selectedCustomer);
    }

    setFilteredContacts(filtered);
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'No Company';
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Company';
  };

  const handleDelete = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const confirmMessage = `Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await contactService.delete(contactId);
      await loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
    // Remove the 'new' parameter from URL if it exists
    if (searchParams.get('new')) {
      router.replace('/contacts');
    }
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadData();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Contacts
            </h1>
            <p className="text-gray-700" style={{ fontFamily: 'PT Sans, sans-serif' }}>
              Manage your business contacts and relationships
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
                style={{ fontFamily: 'PT Sans, sans-serif' }}
              />
            </div>

            {/* Customer Filter */}
            <div>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                style={{ fontFamily: 'PT Sans, sans-serif' }}
              >
                <option value="">All Companies</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || selectedCustomer) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                Showing {filteredContacts.length} of {contacts.length} contacts
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCustomer('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
                style={{ fontFamily: 'PT Sans, sans-serif' }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Contacts List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {searchTerm || selectedCustomer ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-gray-500 mb-4" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                {searchTerm || selectedCustomer 
                  ? 'Try adjusting your search or filters' 
                  : 'Start by adding your first business contact'}
              </p>
              {!searchTerm && !selectedCustomer && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Contact
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {contact.firstName} {contact.lastName}
                          </h3>
                          {contact.isPrimary && (
                            <div title="Primary Contact">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {contact.title && (
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'PT Sans, sans-serif' }}>
                              {contact.title}
                              {contact.department && ` • ${contact.department}`}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                {contact.email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.customerId && (
                              <div className="flex items-center">
                                <Building className="w-4 h-4 mr-1" />
                                <span>{getCustomerName(contact.customerId)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Edit contact"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {showForm && (
        <ContactFormModal
          contact={editingContact}
          customers={customers}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </DashboardLayout>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ContactsContent />
    </Suspense>
  );
}

// Contact Form Modal Component (placeholder - will be implemented next)
function ContactFormModal({ 
  contact, 
  customers, 
  onClose, 
  onSuccess 
}: { 
  contact: Contact | null;
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    title: contact?.title || '',
    department: contact?.department || '',
    customerId: contact?.customerId || '',
    isPrimary: contact?.isPrimary || false,
    notes: contact?.notes || '',
    linkedin: contact?.socialMedia?.linkedin || '',
    twitter: contact?.socialMedia?.twitter || '',
    street: contact?.address?.street || '',
    city: contact?.address?.city || '',
    state: contact?.address?.state || '',
    zipCode: contact?.address?.zipCode || '',
    country: contact?.address?.country || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const contactData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        mobile: formData.mobile.trim() || undefined,
        title: formData.title.trim() || undefined,
        department: formData.department.trim() || undefined,
        customerId: formData.customerId || undefined,
        isPrimary: formData.isPrimary,
        notes: formData.notes.trim() || undefined,
        dealIds: contact?.dealIds || [],
      };

      // Add social media if provided
      if (formData.linkedin.trim() || formData.twitter.trim()) {
        contactData.socialMedia = {
          linkedin: formData.linkedin.trim() || undefined,
          twitter: formData.twitter.trim() || undefined,
        };
      }

      // Add address if provided
      if (formData.street.trim() || formData.city.trim() || formData.state.trim() || formData.zipCode.trim() || formData.country.trim()) {
        contactData.address = {
          street: formData.street.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          zipCode: formData.zipCode.trim() || undefined,
          country: formData.country.trim() || undefined,
        };
      }

      if (contact) {
        await contactService.update(contact.id, contactData);
      } else {
        await contactService.create(contactData);
      }

      // If setting as primary, update the contact service
      if (formData.isPrimary && formData.customerId) {
        const newContactId = contact ? contact.id : await contactService.create(contactData);
        await contactService.setPrimary(newContactId, formData.customerId);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving contact:', error);
      setErrors({ submit: 'Failed to save contact. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {contact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Basic Information
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleChange('customerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  >
                    <option value="">Select a company...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.customerId && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) => handleChange('isPrimary', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700">
                      Primary contact for this company
                    </label>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Additional Details
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Profile
                  </label>
                  <input
                    type="url"
                    value={formData.twitter}
                    onChange={(e) => handleChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                    placeholder="Additional notes about this contact..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    {contact ? 'Update Contact' : 'Create Contact'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}