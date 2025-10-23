'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { invoiceService } from '@/lib/services/invoiceService';
import { customerService, productService } from '@/lib/firebase-services';
import type { Customer, Product, InvoiceItem } from '@/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertCircle, Plus, Trash2 } from 'lucide-react';

const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function NewInvoice() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

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

  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customerService.getAll(),
        productService.getAll(),
      ]);

      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const invoiceItems = data.items.map((item, index) => {
        const product = products.find(p => p.id === item.productId);
        return {
          id: `item-${index}`,
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.quantity * item.unitPrice,
        };
      });

      const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
      const tax = 0; // You can add tax calculation later
      const total = subtotal + tax;

      const invoiceNumber = await invoiceService.generateInvoiceNumber();

      await invoiceService.createInvoice({
        invoiceNumber,
        customerId: data.customerId,
        dueDate: new Date(data.dueDate),
        items: invoiceItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'draft',
        notes: data.notes,
      });

      router.push('/invoices');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setError('root', {
        message: error.message || 'Failed to create invoice',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Auto-fill the unit price when a product is selected
      const currentItems = watchedItems;
      currentItems[index] = {
        ...currentItems[index],
        productId,
        unitPrice: product.price,
      };
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Invoices
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
          <p className="text-gray-600">Generate a new invoice for your customer</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  Customer *
                </label>
                <select
                  {...register('customerId')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Due Date *
                </label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Items *
                </label>
                <button
                  type="button"
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-md">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <select
                        {...register(`items.${index}.productId` as const)}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.productId && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index]?.productId?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">$</span>
                        </div>
                        <input
                          {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {errors.items?.[index]?.unitPrice && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index]?.unitPrice?.message}</p>
                      )}
                    </div>

                    <div className="flex items-end">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="inline-flex items-center px-2 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.items && (
                <p className="mt-1 text-sm text-red-600">{errors.items.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes or terms (optional)"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}