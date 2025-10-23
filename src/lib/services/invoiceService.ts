import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types';

const COLLECTION_NAME = 'invoices';

export const invoiceService = {
  // Get all invoices
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const invoicesRef = collection(db, COLLECTION_NAME);
      const q = query(invoicesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Invoice[];
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  },

  // Get invoices by customer
  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    try {
      const invoicesRef = collection(db, COLLECTION_NAME);
      const q = query(
        invoicesRef, 
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Invoice[];
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      throw error;
    }
  },

  // Get single invoice
  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Invoice;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  },

  // Create invoice
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...invoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  // Update invoice status
  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  },

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },

  // Generate next invoice number
  async generateInvoiceNumber(): Promise<string> {
    try {
      const invoicesRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(invoicesRef);
      const count = snapshot.size + 1;
      return `INV-${String(count).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  },
};