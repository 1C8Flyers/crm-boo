// Firebase configuration types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Deal stages
export interface DealStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  contactIds?: string[]; // Associated contacts
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Contact types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string; // Job title
  department?: string;
  customerId?: string; // Primary customer/company
  dealIds?: string[]; // Associated deals
  activityIds?: string[]; // Associated activities
  isPrimary?: boolean; // Is this the primary contact for the customer?
  notes?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Deal types
export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  customerId: string;
  stageId: string;
  probability: number;
  expectedCloseDate?: Date;
  subscriptionValue?: number;
  oneTimeValue?: number;
  contactIds?: string[]; // Associated contacts
  createdAt: Date;
  updatedAt: Date;
  activities?: Activity[];
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  isSubscription: boolean;
  subscriptionInterval?: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  dealId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// Company Information types
export interface Company {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  email: string;
  phone?: string;
  website?: string;
  logo?: string; // URL to logo image
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Activity types
export interface Activity {
  id: string;
  type: 'note' | 'email' | 'call' | 'meeting' | 'task';
  title: string;
  description?: string;
  customerId?: string;
  dealId?: string;
  contactIds?: string[]; // Associated contacts
  completed: boolean;
  dueDate?: Date; // Follow-up due date for all activity types
  meetingDate?: Date; // Actual meeting date for meetings (when it happened/will happen)
  duration?: number; // in minutes, for calls and meetings
  outcome?: string; // for calls and meetings
  nextAction?: string; // follow-up action
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales' | 'manager';
  createdAt: Date;
  lastLogin?: Date;
}

// Proposal types
export interface ProposalItem {
  id: string;
  type: 'product' | 'custom';
  // For product items
  productId?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  // For subscription products
  isSubscription?: boolean;
  subscriptionInterval?: 'monthly' | 'quarterly' | 'yearly';
  // For custom items
  customDescription?: string;
}

export interface Proposal {
  id: string;
  title: string;
  description?: string;
  customerId: string;
  dealId?: string; // Optional link to deal
  contactIds?: string[]; // Contacts who will receive the proposal
  items: ProposalItem[];
  subtotal: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil?: Date; // Expiration date
  notes?: string;
  terms?: string; // Terms and conditions
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
}