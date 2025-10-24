'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
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
  Star
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
            onClick={() => {
              console.log('Add Contact button clicked');
              setShowForm(true);
            }}
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
                id="contactSearch"
                name="contactSearch"
                type="text"
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
                style={{ fontFamily: 'PT Sans, sans-serif' }}
              />
            </div>

            {/* Customer Filter */}
            <div>
              <label htmlFor="customerFilter" className="sr-only">Filter by company</label>
              <select
                id="customerFilter"
                name="customerFilter"
                autoComplete="off"
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
        <>
          {console.log('Rendering ContactFormModal, showForm:', showForm)}
          <ContactFormModal
            contact={editingContact}
            customers={customers}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        </>
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