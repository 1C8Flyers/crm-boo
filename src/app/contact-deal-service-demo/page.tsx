'use client';

import { useState } from 'react';
import { contactDealService } from '@/lib/firebase-services';

export default function ContactDealServiceDemo() {
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleAction = async (action: () => Promise<void>, description: string) => {
    setLoading(true);
    setResult('');
    try {
      await action();
      setResult(`✅ ${description} completed successfully!`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Contact-Deal Linking Service Demo</h1>
      
      <div className="space-y-8">
        {/* Input Fields */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Input Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact ID</label>
              <input
                type="text"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                placeholder="Enter contact ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Deal ID</label>
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                placeholder="Enter deal ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Multiple Contact IDs (comma-separated)</label>
              <input
                type="text"
                value={selectedContactIds.join(', ')}
                onChange={(e) => setSelectedContactIds(e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
                placeholder="Enter contact IDs separated by commas..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Multiple Deal IDs (comma-separated)</label>
              <input
                type="text"
                value={selectedDealIds.join(', ')}
                onChange={(e) => setSelectedDealIds(e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
                placeholder="Enter deal IDs separated by commas..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Basic Operations */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Basic Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAction(
                () => contactDealService.linkContactToDeal(contactId, dealId),
                'Link contact to deal'
              )}
              disabled={loading || !contactId || !dealId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Link Contact to Deal
            </button>
            <button
              onClick={() => handleAction(
                () => contactDealService.unlinkContactFromDeal(contactId, dealId),
                'Unlink contact from deal'
              )}
              disabled={loading || !contactId || !dealId}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unlink Contact from Deal
            </button>
          </div>
        </div>

        {/* Bulk Operations */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Bulk Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAction(
                () => contactDealService.setDealContacts(dealId, selectedContactIds),
                'Set deal contacts'
              )}
              disabled={loading || !dealId || selectedContactIds.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Deal Contacts
            </button>
            <button
              onClick={() => handleAction(
                () => contactDealService.setContactDeals(contactId, selectedDealIds),
                'Set contact deals'
              )}
              disabled={loading || !contactId || selectedDealIds.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Contact Deals
            </button>
            <button
              onClick={() => handleAction(
                () => contactDealService.linkMultipleContactsToDeal(selectedContactIds, dealId),
                'Link multiple contacts to deal'
              )}
              disabled={loading || !dealId || selectedContactIds.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Link Multiple Contacts to Deal
            </button>
            <button
              onClick={() => handleAction(
                () => contactDealService.linkContactToMultipleDeals(contactId, selectedDealIds),
                'Link contact to multiple deals'
              )}
              disabled={loading || !contactId || selectedDealIds.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Link Contact to Multiple Deals
            </button>
          </div>
        </div>

        {/* Cleanup Operations */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Cleanup Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAction(
                () => contactDealService.removeAllContactRelationships(contactId),
                'Remove all contact relationships'
              )}
              disabled={loading || !contactId}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove All Contact Relationships
            </button>
            <button
              onClick={() => handleAction(
                () => contactDealService.removeAllDealRelationships(dealId),
                'Remove all deal relationships'
              )}
              disabled={loading || !dealId}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove All Deal Relationships
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Result</h3>
            <p className="text-sm">{result}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Processing...</p>
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Service Method Documentation</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium">Basic Linking:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`// Link a contact to a deal (bidirectional)
await contactDealService.linkContactToDeal(contactId, dealId);

// Unlink a contact from a deal (bidirectional)
await contactDealService.unlinkContactFromDeal(contactId, dealId);`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Bulk Operations:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`// Set all contacts for a deal (replaces existing)
await contactDealService.setDealContacts(dealId, contactIds);

// Set all deals for a contact (replaces existing)
await contactDealService.setContactDeals(contactId, dealIds);

// Link multiple contacts to one deal
await contactDealService.linkMultipleContactsToDeal(contactIds, dealId);

// Link one contact to multiple deals
await contactDealService.linkContactToMultipleDeals(contactId, dealIds);`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Query Operations:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`// Get all contacts for a deal
const contacts = await contactDealService.getDealContacts(dealId);

// Get all deals for a contact
const deals = await contactDealService.getContactDeals(contactId);`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Cleanup Operations:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`// Remove all relationships for a contact (before deletion)
await contactDealService.removeAllContactRelationships(contactId);

// Remove all relationships for a deal (before deletion)
await contactDealService.removeAllDealRelationships(dealId);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}