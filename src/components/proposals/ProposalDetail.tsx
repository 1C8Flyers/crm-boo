'use client';

import { useState, useEffect } from 'react';
import { proposalService, customerService, dealService, contactService } from '@/lib/firebase-services';
import { companyService } from '@/lib/services/companyService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Proposal, Customer, Deal, Contact, Company } from '@/types';
import { Edit2, Send, CheckCircle, XCircle, Download, ArrowLeft, Eye, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProposalDetailProps {
  proposalId: string;
}

export default function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const proposalData = await proposalService.getById(proposalId);
        if (!proposalData) {
          setLoading(false);
          return;
        }

        setProposal(proposalData);

        const [customerData, dealData, companyData] = await Promise.all([
          customerService.getById(proposalData.customerId),
          proposalData.dealId ? dealService.getById(proposalData.dealId) : null,
          companyService.getCompany(),
        ]);

        setCustomer(customerData);
        if (dealData) setDeal(dealData);
        setCompany(companyData);

        if (proposalData.contactIds && proposalData.contactIds.length > 0) {
          const contactsData = await Promise.all(
            proposalData.contactIds.map(id => contactService.getById(id))
          );
          setContacts(contactsData.filter((contact): contact is Contact => contact !== null));
        }
      } catch (error) {
        console.error('Error fetching proposal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [proposalId]);

  const handleStatusUpdate = async (status: Proposal['status']) => {
    if (!proposal) return;

    try {
      switch (status) {
        case 'sent':
          await proposalService.markAsSent(proposal.id);
          break;
        case 'accepted':
          await proposalService.markAsAccepted(proposal.id);
          break;
        case 'rejected':
          await proposalService.markAsRejected(proposal.id);
          break;
      }
      
      // Refresh proposal data
      const updatedProposal = await proposalService.getById(proposalId);
      if (updatedProposal) setProposal(updatedProposal);
    } catch (error) {
      console.error('Error updating proposal status:', error);
      alert('Error updating proposal status. Please try again.');
    }
  };

  const generatePDF = () => {
    console.log('generatePDF called', { 
      hasProposal: !!proposal, 
      hasCustomer: !!customer, 
      hasCompany: !!company 
    });

    if (!proposal || !customer) {
      console.log('Missing required data:', { proposal: !!proposal, customer: !!customer, company: !!company });
      alert('Missing proposal or customer data. Please try refreshing the page.');
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

      console.log('Generating HTML for proposal:', proposal.title);

      // Create HTML content for PDF
      const htmlContent = generateProposalHTML(proposal, customer, companyInfo);
      
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
        a.download = `proposal-${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
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

  const generateProposalHTML = (proposal: Proposal, customer: Customer, company: Company): string => {
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

    const getStatusDisplay = (status: Proposal['status']) => {
      switch (status) {
        case 'draft': return 'Draft';
        case 'sent': return 'Sent';
        case 'viewed': return 'Viewed';
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'expired': return 'Expired';
        default: return 'Draft';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proposal - ${proposal.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start; }
          .company-info { text-align: left; flex: 1; }
          .proposal-info { text-align: right; flex: 1; }
          .customer-info { margin-bottom: 30px; }
          .proposal-title { font-size: 2rem; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f8f9fa; font-weight: 600; }
          .totals { text-align: right; margin-bottom: 30px; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .status { display: inline-block; padding: 6px 12px; border-radius: 16px; font-size: 0.875em; font-weight: 500; }
          .status.draft { background-color: #f3f4f6; color: #374151; }
          .status.sent { background-color: #dbeafe; color: #1d4ed8; }
          .status.viewed { background-color: #fef3c7; color: #d97706; }
          .status.accepted { background-color: #d1fae5; color: #047857; }
          .status.rejected { background-color: #fee2e2; color: #dc2626; }
          .status.expired { background-color: #fecaca; color: #991b1b; }
          .section { margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
          .section h3 { margin-top: 0; color: #1f2937; font-size: 1.1rem; }
          .description { margin-bottom: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 6px; }
          .subscription-badge { display: inline-block; padding: 2px 8px; background-color: #dbeafe; color: #1d4ed8; border-radius: 12px; font-size: 0.75em; margin-left: 8px; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
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
          <div class="proposal-info">
            <h2>PROPOSAL</h2>
            <p><strong>Date:</strong> ${formatDate(proposal.createdAt)}</p>
            ${proposal.validUntil ? `<p><strong>Valid Until:</strong> ${formatDate(proposal.validUntil)}</p>` : ''}
            <span class="status ${proposal.status}">${getStatusDisplay(proposal.status)}</span>
          </div>
        </div>

        <div class="proposal-title">${proposal.title}</div>
        
        ${proposal.description ? `
          <div class="description">
            <p><strong>Description:</strong></p>
            <p>${proposal.description.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        <div class="customer-info">
          <h3>Prepared For:</h3>
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

        <h3>Proposed Items</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%;">Description</th>
              <th style="width: 15%;">Quantity</th>
              <th style="width: 20%;">Unit Price</th>
              <th style="width: 25%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.items.map(item => `
              <tr>
                <td>
                  <strong>${item.productName}</strong>
                  ${item.type === 'product' && item.isSubscription ? 
                    `<span class="subscription-badge">${item.subscriptionInterval}</span>` : ''
                  }
                  ${(item.description || item.customDescription) ? 
                    `<br><small style="color: #6b7280;">${item.description || item.customDescription}</small>` : ''
                  }
                </td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div style="width: 300px; margin-left: auto;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span><strong>Subtotal:</strong></span>
              <span><strong>$${proposal.subtotal.toFixed(2)}</strong></span>
            </div>
            ${proposal.discountAmount && proposal.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Discount (${proposal.discountPercentage}%):</strong></span>
                <span style="color: #dc2626;"><strong>-$${proposal.discountAmount.toFixed(2)}</strong></span>
              </div>
            ` : ''}
            ${proposal.taxAmount && proposal.taxAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Tax (${proposal.taxPercentage}%):</strong></span>
                <span><strong>$${proposal.taxAmount.toFixed(2)}</strong></span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #374151; padding-top: 8px; margin-top: 12px;">
              <span class="total-row">Total:</span>
              <span class="total-row">$${proposal.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        ${proposal.terms ? `
          <div class="section">
            <h3>Terms and Conditions</h3>
            <p>${proposal.terms.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        ${proposal.notes ? `
          <div class="section">
            <h3>Additional Notes</h3>
            <p>${proposal.notes.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        <div class="no-print" style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <button onclick="window.print()" style="padding: 12px 24px; background-color: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Print / Save as PDF</button>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'sent':
        return <Send className="w-5 h-5 text-blue-500" />;
      case 'viewed':
        return <Eye className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Proposal not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The proposal you're looking for doesn't exist.
          </p>
          <div className="mt-6">
            <Link
              href="/proposals"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Proposals
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/proposals"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
              <div className="flex items-center space-x-2">
                {getStatusIcon(proposal.status)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                  {proposal.status}
                </span>
              </div>
            </div>
            {proposal.description && (
              <p className="text-gray-600 mt-1">{proposal.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              console.log('PDF button clicked', { proposal: !!proposal, customer: !!customer, company: !!company });
              generatePDF();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
          <Link
            href={`/proposals/edit?id=${proposal.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Link>
          {proposal.status === 'draft' && (
            <button
              onClick={() => handleStatusUpdate('sent')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </button>
          )}
          {(proposal.status === 'sent' || proposal.status === 'viewed') && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusUpdate('accepted')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proposal.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                            {item.type === 'product' && item.isSubscription && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.subscriptionInterval}
                              </span>
                            )}
                          </div>
                          {(item.description || item.customDescription) && (
                            <div className="text-sm text-gray-500">
                              {item.description || item.customDescription}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium">{formatCurrency(proposal.subtotal)}</span>
                  </div>
                  {proposal.discountAmount && proposal.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Discount ({proposal.discountPercentage}%)
                      </span>
                      <span className="text-sm font-medium text-red-600">
                        -{formatCurrency(proposal.discountAmount)}
                      </span>
                    </div>
                  )}
                  {proposal.taxAmount && proposal.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Tax ({proposal.taxPercentage}%)
                      </span>
                      <span className="text-sm font-medium">{formatCurrency(proposal.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(proposal.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Notes */}
          {(proposal.terms || proposal.notes) && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {proposal.terms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Terms and Conditions</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.terms}</p>
                  </div>
                )}
                {proposal.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer</h3>
            {customer && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  )}
                </div>
                {customer.company && (
                  <div>
                    <p className="text-sm text-gray-500">{customer.company}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deal Info */}
          {deal && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Associated Deal</h3>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                <p className="text-sm text-gray-500">Value: {formatCurrency(deal.value)}</p>
                <p className="text-sm text-gray-500">Probability: {deal.probability}%</p>
              </div>
            </div>
          )}

          {/* Contacts */}
          {contacts.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contacts</h3>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                      {contact.title && (
                        <p className="text-sm text-gray-500">{contact.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-500">{formatDate(proposal.createdAt)}</p>
                </div>
              </div>
              {proposal.sentAt && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sent</p>
                    <p className="text-sm text-gray-500">{formatDate(proposal.sentAt)}</p>
                  </div>
                </div>
              )}
              {proposal.viewedAt && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Viewed</p>
                    <p className="text-sm text-gray-500">{formatDate(proposal.viewedAt)}</p>
                  </div>
                </div>
              )}
              {proposal.respondedAt && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      proposal.status === 'accepted' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {proposal.status === 'accepted' ? 'Accepted' : 'Rejected'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(proposal.respondedAt)}</p>
                  </div>
                </div>
              )}
              {proposal.validUntil && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expires</p>
                    <p className="text-sm text-gray-500">{formatDate(proposal.validUntil)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}