'use client';

import { useState } from 'react';
import { ContactSelector } from '@/components/contacts';

export default function ContactSelectorDemo() {
  // Multi-select scenario
  const [multiSelectedContacts, setMultiSelectedContacts] = useState<string[]>([]);
  
  // Single-select scenario
  const [singleSelectedContact, setSingleSelectedContact] = useState<string[]>([]);
  
  // Customer-specific scenario
  const [customerSelectedContacts, setCustomerSelectedContacts] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Contact Selector Component Demo</h1>
      
      <div className="space-y-8">
        {/* Multi-Select Example */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Multi-Select Mode</h2>
          <p className="text-gray-600 mb-4">Select multiple contacts from all available contacts.</p>
          
          <ContactSelector
            selectedContacts={multiSelectedContacts}
            onSelectionChange={setMultiSelectedContacts}
            multiSelect={true}
            placeholder="Search for contacts to add..."
            showAddButton={true}
            onAddContact={() => alert('Add contact modal would open here')}
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Selected Contact IDs:</p>
            <p className="text-sm text-gray-600">
              {multiSelectedContacts.length > 0 ? multiSelectedContacts.join(', ') : 'None selected'}
            </p>
          </div>
        </div>

        {/* Single-Select Example */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Single-Select Mode</h2>
          <p className="text-gray-600 mb-4">Select one contact only (dropdown closes after selection).</p>
          
          <ContactSelector
            selectedContacts={singleSelectedContact}
            onSelectionChange={setSingleSelectedContact}
            multiSelect={false}
            placeholder="Choose a primary contact..."
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Selected Contact ID:</p>
            <p className="text-sm text-gray-600">
              {singleSelectedContact.length > 0 ? singleSelectedContact[0] : 'None selected'}
            </p>
          </div>
        </div>

        {/* Customer-Specific Example */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Customer-Specific Contacts</h2>
          <p className="text-gray-600 mb-4">Select contacts from a specific customer only.</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Customer ID:</label>
            <input
              type="text"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              placeholder="Enter customer ID to filter contacts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <ContactSelector
            selectedContacts={customerSelectedContacts}
            onSelectionChange={setCustomerSelectedContacts}
            customerId={selectedCustomerId || undefined}
            placeholder="Search contacts for this customer..."
            showAddButton={true}
            onAddContact={() => alert('Add contact for this customer would open here')}
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Selected Contact IDs:</p>
            <p className="text-sm text-gray-600">
              {customerSelectedContacts.length > 0 ? customerSelectedContacts.join(', ') : 'None selected'}
            </p>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium">For Customer Forms:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`<ContactSelector
  selectedContacts={formData.contactIds}
  onSelectionChange={(ids) => setFormData(prev => ({...prev, contactIds: ids}))}
  multiSelect={true}
  placeholder="Select customer contacts..."
  showAddButton={true}
  onAddContact={() => setShowContactModal(true)}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">For Deal Primary Contact:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`<ContactSelector
  selectedContacts={[formData.primaryContactId].filter(Boolean)}
  onSelectionChange={(ids) => setFormData(prev => ({...prev, primaryContactId: ids[0] || ''}))}
  customerId={formData.customerId}
  multiSelect={false}
  placeholder="Choose primary contact..."
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">For Email Recipients:</h3>
              <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`<ContactSelector
  selectedContacts={emailRecipients}
  onSelectionChange={setEmailRecipients}
  customers={allowedCustomers}
  multiSelect={true}
  placeholder="Select email recipients..."
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}