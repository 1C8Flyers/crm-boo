'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { customerService, contactService } from '@/lib/firebase-services';
import { ContactSelector } from '@/components/contacts/ContactSelector';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import type { Customer, Contact } from '@/types';

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

interface CustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
  onSave: () => void;
}

export function CustomerModal({ customer, onClose, onSave }: CustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || {},
    } : {
      address: {},
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || {},
      });
      setSelectedContactIds(customer.contactIds || []);
    }
  }, [customer, reset]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const contacts = await contactService.getAll();
      setAllContacts(contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleContactFormSuccess = async () => {
    setShowContactForm(false);
    await loadContacts(); // Reload contacts after adding new one
    // Note: We don't automatically select the new contact here since we don't know its ID
    // The user can manually select it from the refreshed list
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    try {
      const customerData = {
        ...data,
        phone: data.phone || undefined,
        company: data.company || undefined,
        address: data.address && Object.values(data.address).some(v => v) ? data.address : undefined,
        contactIds: selectedContactIds.length > 0 ? selectedContactIds : undefined,
      };

      let customerId: string;
      if (isEditing && customer) {
        await customerService.update(customer.id, customerData);
        customerId = customer.id;
      } else {
        customerId = await customerService.create(customerData);
      }

      // Update contact relationships
      if (selectedContactIds.length > 0) {
        await Promise.all(selectedContactIds.map(contactId => 
          contactService.update(contactId, { customerId })
        ));
      }

      // Remove customer relationship from contacts that were deselected
      if (isEditing && customer?.contactIds) {
        const removedContactIds = customer.contactIds.filter(id => !selectedContactIds.includes(id));
        await Promise.all(removedContactIds.map(contactId => 
          contactService.update(contactId, { customerId: undefined })
        ));
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError('root', {
        message: error.message || 'Failed to save customer. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEditing ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter customer name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    {...register('company')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter company name"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                  )}
                </div>

                {/* Address Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Address
                  </label>
                  <div className="space-y-3">
                    <div>
                      <input
                        {...register('address.street')}
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          {...register('address.city')}
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <input
                          {...register('address.state')}
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="State/Province"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          {...register('address.zipCode')}
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="ZIP/Postal code"
                        />
                      </div>
                      <div>
                        <input
                          {...register('address.country')}
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Associated Contacts
                  </label>
                  <ContactSelector
                    selectedContacts={selectedContactIds}
                    onSelectionChange={setSelectedContactIds}
                    multiSelect={true}
                    placeholder="Search and select contacts..."
                    showAddButton={true}
                    onAddContact={() => setShowContactForm(true)}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    Select existing contacts to associate with this customer, or add new contacts.
                  </p>
                </div>
              </div>

              {errors.root && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isEditing ? 'Update Customer' : 'Add Customer'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactFormModal
          contact={null}
          customers={[]}
          onClose={() => setShowContactForm(false)}
          onSuccess={handleContactFormSuccess}
        />
      )}
    </div>
  );
}