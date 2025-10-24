'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealService, customerService, productService, dealStageService } from '@/lib/firebase-services';
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

export default function DealDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stage, setStage] = useState<DealStage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    loadData();
  }, [user, dealId, router]);

  const loadData = async () => {
    try {
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
      console.error('Error loading deal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || !deal) return;

    try {
      const dealProduct: DealProduct = {
        id: `${selectedProduct.id}-${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        price: selectedProduct.price,
        total: selectedProduct.price * quantity,
        isSubscription: selectedProduct.isSubscription,
        subscriptionInterval: selectedProduct.subscriptionInterval
      };

      const updatedProducts = [...(deal.products || []), dealProduct];
      const subscriptionValue = updatedProducts
        .filter(p => p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);
      const oneTimeValue = updatedProducts
        .filter(p => !p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);

      const updatedDeal: Deal = {
        ...deal,
        products: updatedProducts,
        subscriptionValue,
        oneTimeValue,
        value: subscriptionValue + oneTimeValue
      };

      await dealService.update(deal.id, updatedDeal);
      setDeal(updatedDeal);
      setShowAddProduct(false);
      setSelectedProduct(null);
      setQuantity(1);
    } catch (error) {
      console.error('Error adding product to deal:', error);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!deal) return;

    try {
      const updatedProducts = deal.products?.filter(p => p.id !== productId) || [];
      const subscriptionValue = updatedProducts
        .filter(p => p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);
      const oneTimeValue = updatedProducts
        .filter(p => !p.isSubscription)
        .reduce((sum, p) => sum + p.total, 0);

      const updatedDeal: Deal = {
        ...deal,
        products: updatedProducts,
        subscriptionValue,
        oneTimeValue,
        value: subscriptionValue + oneTimeValue
      };

      await dealService.update(deal.id, updatedDeal);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Error removing product from deal:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading deal...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deal) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Deal not found</h2>
          <button
            onClick={() => router.push('/deals')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Deals
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/deals')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
              <p className="text-gray-600">{stage?.name}</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/deals/${deal.id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Deal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Value</label>
                  <div className="flex items-center mt-1">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-xl font-bold text-gray-900">
                      ${deal.value.toLocaleString()}
                    </span>
                  </div>
                  {deal.subscriptionValue && deal.oneTimeValue && (
                    <div className="mt-1 text-sm text-gray-600">
                      <div>Subscription: ${deal.subscriptionValue.toLocaleString()}</div>
                      <div>One-time: ${deal.oneTimeValue.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Probability</label>
                  <div className="mt-1">
                    <span className="text-xl font-bold text-gray-900">{deal.probability}%</span>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {deal.expectedCloseDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expected Close Date</label>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {deal.expectedCloseDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Stage</label>
                  <div className="mt-1">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: stage?.color || '#6B7280' }}
                    >
                      {stage?.name}
                    </span>
                  </div>
                </div>
              </div>

              {deal.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900">{deal.description}</p>
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Product
                </button>
              </div>

              {deal.products && deal.products.length > 0 ? (
                <div className="space-y-3">
                  {deal.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-600">
                            Qty: {product.quantity} × ${product.price.toLocaleString()}
                            {product.isSubscription && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {product.subscriptionInterval}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">
                          ${product.total.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No products added to this deal yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              
              {customer ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{customer.name}</span>
                  </div>
                  
                  {customer.company && (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{customer.company}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-700">
                      {customer.email}
                    </a>
                  </div>
                  
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-700">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Customer information not available</div>
              )}
            </div>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Product</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
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
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a product...</option>
                    {products.filter(p => p.isActive).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price.toLocaleString()}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedProduct && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div>Price: ${selectedProduct.price.toLocaleString()}</div>
                      <div>Quantity: {quantity}</div>
                      <div className="font-semibold text-gray-900 mt-1">
                        Total: ${(selectedProduct.price * quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}