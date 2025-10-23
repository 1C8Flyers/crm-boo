'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Save, Upload } from 'lucide-react';
import { companyService } from '@/lib/services/companyService';
import { Company } from '@/types';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      email: '',
      phone: '',
      website: '',
      taxId: '',
    },
  });

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    setIsLoading(true);
    try {
      const companyData = await companyService.getCompany();
      if (companyData) {
        setCompany(companyData);
        reset({
          name: companyData.name,
          address: companyData.address,
          email: companyData.email,
          phone: companyData.phone || '',
          website: companyData.website || '',
          taxId: companyData.taxId || '',
        });
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSaving(true);
    try {
      await companyService.upsertCompany(data);
      await loadCompany(); // Reload to get the latest data
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Building2 className="h-6 w-6 text-gray-400 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Building2 className="h-6 w-6 text-gray-400 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
        </div>
        <p className="text-sm text-gray-600">
          This information will appear on your invoices and documents
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Company Name *
          </label>
          <input
            {...register('name')}
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter company name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Address *
          </label>
          <div className="space-y-3">
            <div>
              <input
                {...register('address.street')}
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Street address"
              />
              {errors.address?.street && (
                <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  {...register('address.city')}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="City"
                />
                {errors.address?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                )}
              </div>
              <div>
                <input
                  {...register('address.state')}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="State/Province"
                />
                {errors.address?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                )}
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
                {errors.address?.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
                )}
              </div>
              <div>
                <input
                  {...register('address.country')}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Country"
                />
                {errors.address?.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.country.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Website and Tax ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              {...register('website')}
              type="url"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
              Tax ID / EIN
            </label>
            <input
              {...register('taxId')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter tax ID"
            />
            {errors.taxId && (
              <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>
            )}
          </div>
        </div>

        {/* Logo Upload - Placeholder for future implementation */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company Logo
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <p>Logo upload coming soon</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Company Info
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}