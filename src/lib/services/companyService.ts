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
import { storageService } from './storageService';

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

  // Upload and update company logo
  async updateLogo(file: File): Promise<string> {
    try {
      // Get existing company to check for old logo
      const existingCompany = await this.getCompany();
      
      // Upload new logo
      const logoUrl = await storageService.uploadLogo(file);
      
      // Update company with new logo URL
      if (existingCompany) {
        // Delete old logo if it exists
        if (existingCompany.logo) {
          try {
            await storageService.deleteLogo(existingCompany.logo);
          } catch (error) {
            console.warn('Could not delete old logo:', error);
          }
        }
        
        await this.updateCompany(existingCompany.id, { logo: logoUrl });
      } else {
        // Create new company with logo
        await this.upsertCompany({
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
          email: '',
          logo: logoUrl,
        });
      }
      
      return logoUrl;
    } catch (error) {
      console.error('Error updating logo:', error);
      throw error;
    }
  },

  // Remove company logo
  async removeLogo(): Promise<void> {
    try {
      const existingCompany = await this.getCompany();
      
      if (!existingCompany || !existingCompany.logo) {
        return; // No logo to remove
      }
      
      // Delete logo from storage
      await storageService.deleteLogo(existingCompany.logo);
      
      // Update company to remove logo URL
      await this.updateCompany(existingCompany.id, { logo: undefined });
    } catch (error) {
      console.error('Error removing logo:', error);
      throw error;
    }
  },
};