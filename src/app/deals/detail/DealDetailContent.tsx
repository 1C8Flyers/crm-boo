'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealService, customerService, productService, dealStageService } from '@/lib/firebase-services';
import Notes from '@/components/Notes';
import type { Deal, Customer, Product, DealStage, DealProduct } from '@/types';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  Mail,
  Edit3,
  Plus,
  X,
  Package
} from 'lucide-react';

export default function DealDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [deal, setDeal] = useState<Deal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stage, setStage] = useState<DealStage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);

  useEffect(() => {
    const dealId = searchParams.get('id');
    const editActivityId = searchParams.get('editActivity');
    if (!dealId || !user) return;

    const loadDealDetails = async () => {
      try {
        setLoading(true);
        
        // Load deal and products in parallel
        const [dealData, productsData] = await Promise.all([
          dealService.getById(dealId),
          productService.getAll()
        ]);
        
        if (!dealData) {
          router.push('/deals');
          return;
        }
        
        setDeal(dealData);
        setProducts(productsData);
        
        // Load customer and stage
        const [customerData, stageData] = await Promise.all([
          customerService.getById(dealData.customerId),
          dealStageService.getById(dealData.stageId)
        ]);
        
        setCustomer(customerData);
        setStage(stageData);
      } catch (error) {
        console.error('Error loading deal details:', error);
        router.push('/deals');
      } finally {
        setLoading(false);
      }
    };

    loadDealDetails();
  }, [searchParams, user, router]);

  const handleAddProduct = async () => {
    if (!selectedProduct || !deal || quantity <= 0) return;

    const priceToUse = customPrice > 0 ? customPrice : selectedProduct.price;

    try {
      // Create clean deal product object without undefined values
      const dealProduct: DealProduct = {
        id: `${selectedProduct.id}-${Date.now()}`, // Generate unique ID for the deal product
        productId: selectedProduct.id!,
        productName: selectedProduct.name,
        price: priceToUse,
        quantity,
        total: priceToUse * quantity,
        isSubscription: selectedProduct.isSubscription,
        ...(selectedProduct.isSubscription && selectedProduct.subscriptionInterval && {
          subscriptionInterval: selectedProduct.subscriptionInterval
        })
      };

      const updatedProducts = [...(deal.products || []), dealProduct];
      const subscriptionValue = updatedProducts
        .filter(p => p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);
      const oneTimeValue = updatedProducts
        .filter(p => !p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);

      // Create clean update object without undefined values
      const updateData: any = {
        products: updatedProducts,
        value: subscriptionValue + oneTimeValue
      };

      // Only include subscription/oneTime values if they exist
      if (subscriptionValue > 0) {
        updateData.subscriptionValue = subscriptionValue;
      }
      if (oneTimeValue > 0) {
        updateData.oneTimeValue = oneTimeValue;
      }

      await dealService.update(deal.id!, updateData);

      setDeal({
        ...deal,
        products: updatedProducts,
        value: subscriptionValue + oneTimeValue,
        subscriptionValue: subscriptionValue > 0 ? subscriptionValue : undefined,
        oneTimeValue: oneTimeValue > 0 ? oneTimeValue : undefined
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setCustomPrice(0);
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error adding product to deal:', error);
    }
  };

  const handleRemoveProduct = async (index: number) => {
    if (!deal) return;

    try {
      const updatedProducts = deal.products?.filter((_, i) => i !== index) || [];
      const subscriptionValue = updatedProducts
        .filter(p => p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);
      const oneTimeValue = updatedProducts
        .filter(p => !p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);

      // Create clean update object without undefined values
      const updateData: any = {
        products: updatedProducts,
        value: subscriptionValue + oneTimeValue
      };

      // Only include subscription/oneTime values if they exist
      if (subscriptionValue > 0) {
        updateData.subscriptionValue = subscriptionValue;
      }
      if (oneTimeValue > 0) {
        updateData.oneTimeValue = oneTimeValue;
      }

      await dealService.update(deal.id!, updateData);

      setDeal({
        ...deal,
        products: updatedProducts,
        value: subscriptionValue + oneTimeValue,
        subscriptionValue: subscriptionValue > 0 ? subscriptionValue : undefined,
        oneTimeValue: oneTimeValue > 0 ? oneTimeValue : undefined
      });
    } catch (error) {
      console.error('Error removing product from deal:', error);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deal || !customer || !stage) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-800">Deal not found</p>
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
              <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
            </div>
          </div>
          <button
            onClick={() => {
              console.log('Edit button clicked, deal ID:', deal.id);
              router.push(`/deals/edit?id=${deal.id}`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            Edit Deal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deal Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Overview Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-black">Deal Overview</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-black font-bold">Total Value</p>
                    <p className="font-bold text-black">{formatCurrency(deal.value)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-black font-bold">Expected Close</p>
                    <p className="font-bold text-black">
                      {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-black font-bold">Stage</p>
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: stage.color + '20', 
                        color: stage.color 
                      }}
                    >
                      {stage.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-black font-bold">Probability</p>
                    <p className="font-bold text-black">{deal.probability}%</p>
                  </div>
                </div>
              </div>
              
              {deal.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-black font-bold">Description</p>
                  <p className="mt-1 text-black font-medium">{deal.description}</p>
                </div>
              )}
            </div>

            {/* Products Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">Products & Services</h2>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>

              {deal.products && deal.products.length > 0 ? (
                <div className="space-y-3">
                  {deal.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-black">{product.productName}</h3>
                          {product.subscriptionInterval && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {product.subscriptionInterval}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">
                          {formatCurrency(product.price)} × {product.quantity} = {formatCurrency(product.total)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-black">Total:</span>
                      <span className="font-semibold text-lg text-black">{formatCurrency(deal.value)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-800">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No products added yet</p>
                  <p className="text-sm">Click "Add Product" to get started</p>
                </div>
              )}
            </div>

            {/* Notes & Activities */}
            <Notes 
              deal={deal} 
              customer={customer || undefined} 
              editActivityId={searchParams.get('editActivity') || undefined}
            />
          </div>

          {/* Customer Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                <button
                  onClick={() => router.push(`/customers/detail?id=${customer.id}`)}
                  className="text-sm px-3 py-1 rounded-md transition-colors"
                  style={{ 
                    backgroundColor: '#2E4A62',
                    color: 'white',
                    fontFamily: 'var(--font-pt-sans)'
                  }}
                >
                  View Customer
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-700" />
                  <div>
                    <p className="font-bold text-black">{customer.name}</p>
                    <p className="text-sm text-black font-semibold">Company</p>
                  </div>
                </div>
                
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-700" />
                    <div>
                      <p className="font-bold text-black">{customer.email}</p>
                      <p className="text-sm text-black font-semibold">Email</p>
                    </div>
                  </div>
                )}
                
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-700" />
                    <div>
                      <p className="font-bold text-black">{customer.phone}</p>
                      <p className="text-sm text-black font-semibold">Phone</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Add Product to Deal</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product
                  </label>
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = products.find(p => p.id === e.target.value);
                      setSelectedProduct(product || null);
                      setCustomPrice(product?.price || 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price)}
                        {product.isSubscription && ` (${product.subscriptionInterval})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {selectedProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (Default: {formatCurrency(selectedProduct.price)})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                      placeholder={selectedProduct.price.toString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-900 mt-1">
                      Leave as {formatCurrency(selectedProduct.price)} to use default price, or enter custom price
                    </p>
                  </div>
                )}

                {selectedProduct && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-800">Total:</span>
                      <span className="font-semibold text-black">
                        {formatCurrency((customPrice > 0 ? customPrice : selectedProduct.price) * quantity)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    disabled={!selectedProduct || quantity <= 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}