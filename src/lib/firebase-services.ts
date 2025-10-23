import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, Deal, Product, Invoice, Activity, DealStage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Customer services
export const customerService = {
  async getAll(): Promise<Customer[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Customer[];
  },

  async getById(id: string): Promise<Customer | null> {
    const docSnap = await getDoc(doc(db, 'customers', id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Customer;
    }
    return null;
  },

  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, customerData: Partial<Customer>): Promise<void> {
    const docRef = doc(db, 'customers', id);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'customers', id));
  },
};

// Deal services
export const dealService = {
  async getAll(): Promise<Deal[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'deals'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
    })) as Deal[];
  },

  async getByStage(stageId: string): Promise<Deal[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'deals'),
        where('stageId', '==', stageId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
    })) as Deal[];
  },

  async create(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'deals'), {
      ...dealData,
      expectedCloseDate: dealData.expectedCloseDate ? Timestamp.fromDate(dealData.expectedCloseDate) : null,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, dealData: Partial<Deal>): Promise<void> {
    const docRef = doc(db, 'deals', id);
    const updateData: any = {
      ...dealData,
      updatedAt: Timestamp.now(),
    };
    
    if (dealData.expectedCloseDate) {
      updateData.expectedCloseDate = Timestamp.fromDate(dealData.expectedCloseDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'deals', id));
  },
};

// Deal Stages services
export const dealStageService = {
  async getAll(): Promise<DealStage[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'dealStages'), orderBy('order', 'asc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as DealStage[];
  },

  async create(stageData: Omit<DealStage, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'dealStages'), stageData);
    return docRef.id;
  },

  async update(id: string, stageData: Partial<DealStage>): Promise<void> {
    const docRef = doc(db, 'dealStages', id);
    await updateDoc(docRef, stageData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'dealStages', id));
  },

  async initializeDefaultStages(): Promise<void> {
    const defaultStages: Omit<DealStage, 'id'>[] = [
      { name: 'Lead', color: '#6B7280', order: 1, isDefault: true },
      { name: 'Qualified', color: '#3B82F6', order: 2, isDefault: true },
      { name: 'Proposal', color: '#F59E0B', order: 3, isDefault: true },
      { name: 'Negotiation', color: '#EF4444', order: 4, isDefault: true },
      { name: 'Closed Won', color: '#10B981', order: 5, isDefault: true },
      { name: 'Closed Lost', color: '#6B7280', order: 6, isDefault: true },
    ];

    for (const stage of defaultStages) {
      await this.create(stage);
    }
  },
};

// Product services
export const productService = {
  async getAll(): Promise<Product[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'products'), orderBy('name', 'asc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Product[];
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, productData: Partial<Product>): Promise<void> {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  },
};

// Invoice services
export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate.toDate(),
    })) as Invoice[];
  },

  async create(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      dueDate: Timestamp.fromDate(invoiceData.dueDate),
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, invoiceData: Partial<Invoice>): Promise<void> {
    const docRef = doc(db, 'invoices', id);
    const updateData: any = {
      ...invoiceData,
      updatedAt: Timestamp.now(),
    };
    
    if (invoiceData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(invoiceData.dueDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'invoices', id));
  },

  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomString = uuidv4().substring(0, 6).toUpperCase();
    return `INV-${year}${month}-${randomString}`;
  },
};

// Activity services
export const activityService = {
  async getByCustomer(customerId: string): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'activities'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
    })) as Activity[];
  },

  async getByDeal(dealId: string): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'activities'),
        where('dealId', '==', dealId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
    })) as Activity[];
  },

  async create(activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'activities'), {
      ...activityData,
      dueDate: activityData.dueDate ? Timestamp.fromDate(activityData.dueDate) : null,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, activityData: Partial<Activity>): Promise<void> {
    const docRef = doc(db, 'activities', id);
    const updateData: any = {
      ...activityData,
      updatedAt: Timestamp.now(),
    };
    
    if (activityData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(activityData.dueDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'activities', id));
  },
};