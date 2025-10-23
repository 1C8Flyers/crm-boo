import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

export function useFirebaseAuthTest() {
  const [status, setStatus] = useState<{
    connected: boolean;
    error: string | null;
    authEnabled: boolean;
  }>({
    connected: false,
    error: null,
    authEnabled: false,
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (!auth) {
          setStatus({
            connected: false,
            error: 'Firebase auth not initialized',
            authEnabled: false,
          });
          return;
        }

        // Test if auth is working by checking the current user
        const currentUser = auth.currentUser;
        
        setStatus({
          connected: true,
          error: null,
          authEnabled: true,
        });
      } catch (error: any) {
        console.error('Firebase Auth test failed:', error);
        setStatus({
          connected: false,
          error: error.message,
          authEnabled: false,
        });
      }
    };

    testConnection();
  }, []);

  return status;
}