'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { invoiceService } from '@/lib/services/invoiceService';
import { companyService } from '@/lib/services/companyService';
import { customerService } from '@/lib/firebase-services';
import type { Invoice, Customer, Company } from '@/types';
import { 
  FileText, 
  Download, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Edit,
  ArrowLeft,
  Building2,
  User,
  Calendar
} from 'lucide-react';

const statusConfig = {
  draft: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
  sent: { icon: Send, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Sent' },
  paid: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Paid' },
  overdue: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: 'Overdue' },
  cancelled: { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Cancelled' },
};

function InvoiceDetailContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && invoiceId) {
      loadInvoiceData();
    }
  }, [user, invoiceId]);

  const loadInvoiceData = async () => {
    if (!invoiceId) return;
    
    setIsLoading(true);
    try {
      const [invoiceData, companyData] = await Promise.all([
        invoiceService.getInvoice(invoiceId),
        companyService.getCompany(),
      ]);

      if (invoiceData) {
        setInvoice(invoiceData);
        
        // Load customer data
        const customerData = await customerService.getById(invoiceData.customerId);
        setCustomer(customerData);
      }

      setCompany(companyData);
    } catch (error) {
      console.error('Error loading invoice data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: Invoice['status']) => {
    if (!invoice) return;

    setIsUpdating(true);
    try {
      await invoiceService.updateInvoiceStatus(invoice.id, newStatus);
      setInvoice({ ...invoice, status: newStatus });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const generatePDF = () => {
    console.log('generatePDF called', { 
      hasInvoice: !!invoice, 
      hasCustomer: !!customer, 
      hasCompany: !!company 
    });

    if (!invoice || !customer) {
      console.log('Missing required data:', { invoice: !!invoice, customer: !!customer, company: !!company });
      alert('Missing invoice or customer data. Please try refreshing the page.');
      return;
    }

    try {
      // Use company data if available, otherwise use default
      const companyInfo = company || {
        id: 'default',
        name: 'Your Company Name',
        email: 'email@company.com',
        phone: '',
        website: '',
        taxId: '',
        address: {
          street: '123 Business St',
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'Country'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Generating HTML for invoice:', invoice.invoiceNumber);

      // Create HTML content for PDF
      const htmlContent = generateInvoiceHTML(invoice, customer, companyInfo);
      
      console.log('HTML content generated, opening window...');

      // Open in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        console.log('PDF window opened successfully');
      } else {
        // Fallback: create downloadable HTML file
        console.log('Popup blocked, creating downloadable file...');
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('PDF generation via popup was blocked. Downloaded HTML file instead. Open it in your browser and print to PDF.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  };

  const generateInvoiceHTML = (invoice: Invoice, customer: Customer, company: Company): string => {
    // Ensure dates are Date objects
    const formatDate = (date: any): string => {
      if (!date) return new Date().toLocaleDateString();
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company-info { text-align: left; }
          .invoice-info { text-align: right; }
          .customer-info { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f8f9fa; }
          .totals { text-align: right; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 0.875em; font-weight: 500; }
          .notes { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${company.name}</h1>
            <p>${company.address.street}<br>
            ${company.address.city}, ${company.address.state} ${company.address.zipCode}<br>
            ${company.address.country}</p>
            <p>Email: ${company.email}</p>
            ${company.phone ? `<p>Phone: ${company.phone}</p>` : ''}
            ${company.website ? `<p>Website: ${company.website}</p>` : ''}
            ${company.taxId ? `<p>Tax ID: ${company.taxId}</p>` : ''}
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <span class="status">${statusConfig[invoice.status].label}</span>
          </div>
        </div>

        <div class="customer-info">
          <h3>Bill To:</h3>
          <p><strong>${customer.name}</strong></p>
          ${customer.company ? `<p>${customer.company}</p>` : ''}
          <p>${customer.email}</p>
          ${customer.phone ? `<p>${customer.phone}</p>` : ''}
          ${customer.address ? `
            <p>${customer.address.street}<br>
            ${customer.address.city}, ${customer.address.state} ${customer.address.zipCode}<br>
            ${customer.address.country}</p>
          ` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal: $${invoice.subtotal.toFixed(2)}</strong></p>
          <p><strong>Tax: $${invoice.tax.toFixed(2)}</strong></p>
          <p class="total-row">Total: $${invoice.total.toFixed(2)}</p>
        </div>

        ${invoice.notes ? `
          <div class="notes">
            <h4>Notes:</h4>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
        </div>
      </body>
      </html>
    `;
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The invoice you're looking for doesn't exist or has been deleted.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/invoices')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon = statusConfig[invoice.status].icon;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/invoices')}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Invoices
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  console.log('PDF button clicked', { invoice: !!invoice, customer: !!customer, company: !!company });
                  generatePDF();
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {/* Invoice Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Invoice {invoice.invoiceNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  Created on {invoice.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[invoice.status].bg} ${statusConfig[invoice.status].color}`}>
                  <StatusIcon className="mr-2 h-4 w-4" />
                  {statusConfig[invoice.status].label}
                </div>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          {invoice.status === 'draft' && (
            <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  This invoice is still in draft mode. Send it to make it official.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateStatus('sent')}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Send className="mr-1 h-3 w-3" />
                    Mark as Sent
                  </button>
                </div>
              </div>
            </div>
          )}

          {invoice.status === 'sent' && (
            <div className="px-6 py-4 bg-yellow-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  Invoice has been sent. Mark as paid when payment is received.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateStatus('paid')}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Mark as Paid
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rest of the component content stays the same... */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Company Info */}
              {company && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    From
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p>{company.address.street}</p>
                    <p>{company.address.city}, {company.address.state} {company.address.zipCode}</p>
                    <p>{company.address.country}</p>
                    <p className="mt-2">{company.email}</p>
                    {company.phone && <p>{company.phone}</p>}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              {customer && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Bill To
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.company && <p>{customer.company}</p>}
                    <p>{customer.email}</p>
                    {customer.phone && <p>{customer.phone}</p>}
                    {customer.address && (
                      <>
                        <p className="mt-2">{customer.address.street}</p>
                        <p>{customer.address.city}, {customer.address.state} {customer.address.zipCode}</p>
                        <p>{customer.address.country}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {invoice.dueDate.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</p>
                <p className="text-lg font-semibold text-gray-900">${invoice.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status].bg} ${statusConfig[invoice.status].color}`}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig[invoice.status].label}
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="text-gray-900">${invoice.subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Tax</dt>
                    <dd className="text-gray-900">${invoice.tax.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <dt className="text-gray-900">Total</dt>
                    <dd className="text-gray-900">${invoice.total.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <InvoiceDetailContent />
    </Suspense>
  );
}