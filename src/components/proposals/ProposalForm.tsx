'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { proposalService, customerService, dealService, productService } from '@/lib/firebase-services';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Proposal, ProposalItem, Customer, Deal, Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ContactSelector } from '@/components/contacts/ContactSelector';
import ProductQuickCreate from '@/components/proposals/ProductQuickCreate';

interface ProposalFormProps {
  proposalId?: string;
  customerId?: string;
  dealId?: string;
}

export default function ProposalForm({ proposalId, customerId, dealId }: ProposalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: customerId || '',
    dealId: dealId || '',
    contactIds: [] as string[],
    validUntil: '',
    notes: '',
    terms: '',
    discountPercentage: 0,
    taxPercentage: 0,
  });

  const [items, setItems] = useState<ProposalItem[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, productsData] = await Promise.all([
          customerService.getAll(),
          productService.getAll(),
        ]);
        
        setCustomers(customersData);
        setProducts(productsData);

        if (formData.customerId) {
          const customerDeals = await dealService.getByCustomer(formData.customerId);
          setDeals(customerDeals);
        }

        if (proposalId) {
          const proposal = await proposalService.getById(proposalId);
          if (proposal) {
            setFormData({
              title: proposal.title,
              description: proposal.description || '',
              customerId: proposal.customerId,
              dealId: proposal.dealId || '',
              contactIds: proposal.contactIds || [],
              validUntil: proposal.validUntil ? proposal.validUntil.toISOString().split('T')[0] : '',
              notes: proposal.notes || '',
              terms: proposal.terms || '',
              discountPercentage: proposal.discountPercentage || 0,
              taxPercentage: proposal.taxPercentage || 0,
            });
            setItems(proposal.items);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [proposalId, formData.customerId]);

  const handleCustomerChange = async (customerId: string) => {
    setFormData({ ...formData, customerId, dealId: '' });
    if (customerId) {
      const customerDeals = await dealService.getByCustomer(customerId);
      setDeals(customerDeals);
    } else {
      setDeals([]);
    }
  };

  const addProductItem = (product: Product) => {
    const newItem: ProposalItem = {
      id: uuidv4(),
      type: 'product',
      productId: product.id,
      productName: product.name,
      description: product.description || '',
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
      isSubscription: product.isSubscription || false,
      subscriptionInterval: product.subscriptionInterval || undefined,
    };
    setItems([...items, newItem]);
  };

  const addCustomItem = () => {
    const newItem: ProposalItem = {
      id: uuidv4(),
      type: 'custom',
      productName: '',
      customDescription: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleProductCreated = (product: Product) => {
    setProducts([...products, product]);
    addProductItem(product);
    setShowQuickCreate(false);
  };

  const updateItem = (id: string, updates: Partial<ProposalItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = proposalService.calculateSubtotal(items);
  const discountAmount = proposalService.calculateDiscountAmount(subtotal, formData.discountPercentage);
  const taxAmount = proposalService.calculateTaxAmount(subtotal, discountAmount, formData.taxPercentage);
  const total = proposalService.calculateTotal(subtotal, discountAmount, taxAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.customerId || items.length === 0) {
      alert('Please fill in all required fields and add at least one item.');
      return;
    }

    setLoading(true);
    try {
      // Helper function to remove undefined fields
      const cleanData = (obj: any) => {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      // Clean items to remove undefined fields
      const cleanedItems = items.map(item => {
        const cleanedItem: any = { ...item };
        Object.keys(cleanedItem).forEach(key => {
          if (cleanedItem[key] === undefined) {
            delete cleanedItem[key];
          }
        });
        return cleanedItem;
      });

      const baseProposalData = {
        title: formData.title,
        description: formData.description,
        customerId: formData.customerId,
        dealId: formData.dealId,
        contactIds: formData.contactIds.length > 0 ? formData.contactIds : null,
        items: cleanedItems,
        subtotal,
        discountPercentage: formData.discountPercentage > 0 ? formData.discountPercentage : null,
        discountAmount: formData.discountPercentage > 0 ? discountAmount : null,
        taxPercentage: formData.taxPercentage > 0 ? formData.taxPercentage : null,
        taxAmount: formData.taxPercentage > 0 ? taxAmount : null,
        total,
        status: 'draft' as const,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        notes: formData.notes,
        terms: formData.terms,
      };

      const proposalData = cleanData(baseProposalData);

      if (proposalId) {
        await proposalService.update(proposalId, proposalData);
      } else {
        await proposalService.create(proposalData);
      }

      router.push('/proposals');
    } catch (error) {
      console.error('Error saving proposal:', error);
      alert('Error saving proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/proposals"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {proposalId ? 'Edit Proposal' : 'New Proposal'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal (Optional)
              </label>
              <select
                value={formData.dealId}
                onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a deal</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {formData.customerId && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacts
              </label>
              <ContactSelector
                customerId={formData.customerId}
                selectedContacts={formData.contactIds}
                onSelectionChange={(contactIds: string[]) => setFormData({ ...formData, contactIds })}
                multiSelect={true}
              />
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Items</h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowQuickCreate(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Product
              </button>
              <button
                type="button"
                onClick={addCustomItem}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Custom Item
              </button>
            </div>
          </div>

          {/* Quick Product Creation */}
          {showQuickCreate && (
            <div className="mb-6">
              <ProductQuickCreate
                onProductCreated={handleProductCreated}
                onCancel={() => setShowQuickCreate(false)}
              />
            </div>
          )}

          {/* Product Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Product
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const product = products.find(p => p.id === e.target.value);
                  if (product) {
                    addProductItem(product);
                    e.target.value = '';
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a product to add</option>
              {products.filter(p => p.isActive).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.price)}
                  {product.isSubscription && ` (${product.subscriptionInterval})`}
                </option>
              ))}
            </select>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-900">
                    Item {index + 1} ({item.type === 'product' ? 'Product' : 'Custom'})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, { productName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={item.type === 'product'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(item.total)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                {item.type === 'custom' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={item.customDescription || ''}
                      onChange={(e) => updateItem(item.id, { customDescription: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.taxPercentage}
                onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {formData.discountPercentage > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Discount ({formData.discountPercentage}%)
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              {formData.taxPercentage > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Tax ({formData.taxPercentage}%)
                  </span>
                  <span className="text-sm font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-base font-medium text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Internal notes about this proposal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Terms and conditions for this proposal"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/proposals"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {proposalId ? 'Update' : 'Create'} Proposal
          </button>
        </div>
      </form>
      </div>
    </DashboardLayout>
  );
}