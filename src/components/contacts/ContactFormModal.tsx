'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { contactService } from '@/lib/firebase-services';
import type { Contact, Customer } from '@/types';

interface ContactFormModalProps {
  contact: Contact | null;
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactFormModal({ 
  contact, 
  customers, 
  onClose, 
  onSuccess 
}: ContactFormModalProps) {
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

      // Only add social media if at least one field is provided
      const socialMedia: any = {};
      if (formData.linkedin.trim()) socialMedia.linkedin = formData.linkedin.trim();
      if (formData.twitter.trim()) socialMedia.twitter = formData.twitter.trim();
      if (Object.keys(socialMedia).length > 0) {
        contactData.socialMedia = socialMedia;
      }

      // Only add address if at least one field is provided
      const address: any = {};
      if (formData.street.trim()) address.street = formData.street.trim();
      if (formData.city.trim()) address.city = formData.city.trim();
      if (formData.state.trim()) address.state = formData.state.trim();
      if (formData.zipCode.trim()) address.zipCode = formData.zipCode.trim();
      if (formData.country.trim()) address.country = formData.country.trim();
      if (Object.keys(address).length > 0) {
        contactData.address = address;
      }

      let contactId: string;

      if (contact) {
        await contactService.update(contact.id, contactData);
        contactId = contact.id;
      } else {
        contactId = await contactService.create(contactData);
      }

      // If setting as primary and has customer, update primary contact
      if (formData.isPrimary && formData.customerId) {
        await contactService.setPrimary(contactId, formData.customerId);
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
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {contact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Basic Information
                </h4>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
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
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
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

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
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

                {/* Phone Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      autoComplete="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Job Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      autoComplete="organization-title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      autoComplete="organization"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Company Selection */}
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    autoComplete="organization"
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

                {/* Primary Contact Checkbox */}
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

              {/* Right Column - Additional Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Additional Details
                </h4>

                {/* Social Media */}
                <div>
                  <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    autoComplete="url"
                    value={formData.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                </div>

                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Profile
                  </label>
                  <input
                    id="twitter"
                    name="twitter"
                    type="url"
                    autoComplete="url"
                    value={formData.twitter}
                    onChange={(e) => handleChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    id="street"
                    name="street"
                    type="text"
                    autoComplete="street-address"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ fontFamily: 'PT Sans, sans-serif' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      autoComplete="address-level1"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      autoComplete="postal-code"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      autoComplete="country-name"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'PT Sans, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    autoComplete="off"
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

            {/* Form Actions */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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