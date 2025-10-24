import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata 
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const storageService = {
  // Upload company logo
  async uploadLogo(file: File): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload a file smaller than 10MB.');
      }

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `company-logo-${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const logoRef = ref(storage, `company/logos/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(logoRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  // Delete logo from storage
  async deleteLogo(logoUrl: string): Promise<void> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      // Extract file path from URL
      const url = new URL(logoUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid logo URL format');
      }
      
      const filePath = decodeURIComponent(pathMatch[1]);
      const logoRef = ref(storage, filePath);
      
      // Check if file exists before deleting
      try {
        await getMetadata(logoRef);
        await deleteObject(logoRef);
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          console.warn('Logo file not found, may have been already deleted');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw error;
    }
  },

  // Get file size limit info
  getUploadLimits() {
    return {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    };
  }
};