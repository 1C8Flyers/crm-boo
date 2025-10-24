'use client';

import { useState, useEffect } from 'react';
import { Search, X, User, Mail, Phone, Check, Plus } from 'lucide-react';
import { contactService } from '@/lib/firebase-services';
import type { Contact, Customer } from '@/types';

interface ContactSelectorProps {
  selectedContacts: string[]; // Array of contact IDs
  onSelectionChange: (contactIds: string[]) => void;
  customers?: Customer[]; // Optional: filter contacts by specific customers
  customerId?: string; // Optional: filter contacts for a specific customer
  multiSelect?: boolean; // Allow multiple contact selection
  placeholder?: string;
  className?: string;
  showAddButton?: boolean; // Show "Add New Contact" button
  onAddContact?: () => void; // Callback for adding new contact
}

export function ContactSelector({
  selectedContacts,
  onSelectionChange,
  customers,
  customerId,
  multiSelect = true,
  placeholder = "Search and select contacts...",
  className = "",
  showAddButton = false,
  onAddContact
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [customerId]);

  // Filter contacts based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.department && contact.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      let contactsData: Contact[];
      
      if (customerId) {
        // Load contacts for specific customer
        contactsData = await contactService.getByCustomer(customerId);
      } else {
        // Load all contacts
        contactsData = await contactService.getAll();
      }

      // If customers filter is provided, filter contacts by those customers
      if (customers && customers.length > 0) {
        const customerIds = customers.map(c => c.id);
        contactsData = contactsData.filter(contact => 
          contact.customerId && customerIds.includes(contact.customerId)
        );
      }

      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactToggle = (contactId: string) => {
    if (multiSelect) {
      const newSelection = selectedContacts.includes(contactId)
        ? selectedContacts.filter(id => id !== contactId)
        : [...selectedContacts, contactId];
      onSelectionChange(newSelection);
    } else {
      // Single select mode
      const newSelection = selectedContacts.includes(contactId) ? [] : [contactId];
      onSelectionChange(newSelection);
      setIsOpen(false); // Close dropdown in single select mode
    }
  };

  const handleRemoveContact = (contactId: string) => {
    const newSelection = selectedContacts.filter(id => id !== contactId);
    onSelectionChange(newSelection);
  };

  const getSelectedContactsData = () => {
    return contacts.filter(contact => selectedContacts.includes(contact.id));
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId || !customers) return '';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Contacts Display */}
      {selectedContacts.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {getSelectedContactsData().map(contact => (
            <div
              key={contact.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <User className="h-3 w-3" />
              <span>{contact.firstName} {contact.lastName}</span>
              <button
                onClick={() => handleRemoveContact(contact.id)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                {showAddButton && onAddContact && (
                  <button
                    onClick={() => {
                      onAddContact();
                      setIsOpen(false);
                    }}
                    className="mt-2 flex items-center gap-2 mx-auto px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {showAddButton && onAddContact && (
                  <button
                    onClick={() => {
                      onAddContact();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600 border-b border-gray-100"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Contact
                  </button>
                )}
                
                {filteredContacts.map(contact => {
                  const isSelected = selectedContacts.includes(contact.id);
                  const customerName = getCustomerName(contact.customerId);
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleContactToggle(contact.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-gray-900 truncate">
                              {contact.firstName} {contact.lastName}
                            </div>
                            {contact.isPrimary && (
                              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                            
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            
                            {contact.title && (
                              <div className="text-xs text-gray-500">
                                {contact.title}
                                {contact.department && ` - ${contact.department}`}
                              </div>
                            )}
                            
                            {customerName && (
                              <div className="text-xs text-gray-500">
                                {customerName}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}