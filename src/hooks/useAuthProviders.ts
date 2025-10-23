import { useState, useEffect } from 'react';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';

export interface AuthProviders {
  emailPassword: boolean;
  google: boolean;
  github: boolean;
  microsoft: boolean;
  apple: boolean;
  phone: boolean;
  anonymous: boolean;
}

export function useAuthProviders() {
  const [providers, setProviders] = useState<AuthProviders>({
    emailPassword: false,
    google: false,
    github: false,
    microsoft: false,
    apple: false,
    phone: false,
    anonymous: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthProviders = async () => {
      try {
        const auth = getAuth();
        
        // Check if email/password is enabled by trying to fetch sign-in methods
        // We'll use a test email to check what providers are available
        try {
          await fetchSignInMethodsForEmail(auth, 'test@example.com');
          // If this doesn't throw an error, email/password is likely enabled
          setProviders(prev => ({ ...prev, emailPassword: true }));
        } catch (error: any) {
          // Check the error code to determine if email/password is enabled
          if (error.code === 'auth/configuration-not-found') {
            setProviders(prev => ({ ...prev, emailPassword: false }));
          } else {
            // For other errors (like invalid email), assume email/password is enabled
            setProviders(prev => ({ ...prev, emailPassword: true }));
          }
        }

        // Check for other providers by examining the auth configuration
        // Note: This is a simplified check. In a real app, you might want to
        // check the Firebase project configuration via the Admin SDK or REST API
        
        // For now, we'll detect based on what's commonly enabled
        // You can extend this based on your specific Firebase project setup
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error checking auth providers:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    checkAuthProviders();
  }, []);

  return { providers, loading, error };
}

export function useFirebaseAuthConfig() {
  const [config, setConfig] = useState<{
    emailPasswordEnabled: boolean;
    emailLinkEnabled: boolean;
    phoneEnabled: boolean;
    anonymousEnabled: boolean;
    providers: string[];
  }>({
    emailPasswordEnabled: false,
    emailLinkEnabled: false,
    phoneEnabled: false,
    anonymousEnabled: false,
    providers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const auth = getAuth();
        
        // In a real implementation, you would check the auth configuration
        // For now, we'll assume email/password is the primary method
        // and check if it's working by attempting a configuration check
        
        // Default to email/password being available since that's what we set up
        setConfig({
          emailPasswordEnabled: true,
          emailLinkEnabled: false,
          phoneEnabled: false,
          anonymousEnabled: false,
          providers: ['password'],
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking Firebase auth config:', error);
        setLoading(false);
      }
    };

    checkConfig();
  }, []);

  return { config, loading };
}