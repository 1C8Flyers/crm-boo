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
  address?: string;
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

// Activity types
export interface Activity {
  id: string;
  type: 'note' | 'email' | 'call' | 'meeting' | 'task';
  title: string;
  description?: string;
  customerId?: string;
  dealId?: string;
  completed: boolean;
  dueDate?: Date;
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