import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Company } from '@/types';

const COLLECTION_NAME = 'companies';

export const companyService = {
  // Get company info (there should only be one)
  async getCompany(): Promise<Company | null> {
    try {
      const companiesRef = collection(db, COLLECTION_NAME);
      const q = query(companiesRef, limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Company;
    } catch (error) {
      console.error('Error getting company:', error);
      throw error;
    }
  },

  // Create or update company info
  async upsertCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Check if company already exists
      const existingCompany = await this.getCompany();
      
      if (existingCompany) {
        // Update existing company
        const companyRef = doc(db, COLLECTION_NAME, existingCompany.id);
        await updateDoc(companyRef, {
          ...companyData,
          updatedAt: serverTimestamp(),
        });
        return existingCompany.id;
      } else {
        // Create new company
        const companyRef = doc(collection(db, COLLECTION_NAME));
        await setDoc(companyRef, {
          ...companyData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return companyRef.id;
      }
    } catch (error) {
      console.error('Error upserting company:', error);
      throw error;
    }
  },

  // Update company
  async updateCompany(id: string, updates: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const companyRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(companyRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },
};