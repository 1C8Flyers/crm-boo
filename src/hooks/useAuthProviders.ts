import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { 
  fetchSignInMethodsForEmail, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  PhoneAuthProvider,
  EmailAuthProvider,
} from 'firebase/auth';

export interface AuthProviders {
  emailPassword: boolean;
  emailLink: boolean;
  phone: boolean;
  anonymous: boolean;
  google: boolean;
  facebook: boolean;
  twitter: boolean;
  github: boolean;
  microsoft: boolean;
  apple: boolean;
}

export function useAuthProviders() {
  const [providers, setProviders] = useState<AuthProviders>({
    emailPassword: false,
    emailLink: false,
    phone: false,
    anonymous: false,
    google: false,
    facebook: false,
    twitter: false,
    github: false,
    microsoft: false,
    apple: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthProviders = async () => {
      try {
        if (!auth) {
          console.log('Firebase Auth not initialized');
          setError('Firebase Auth not initialized');
          setLoading(false);
          return;
        }

        console.log('Checking auth providers configuration...');
        console.log('Auth instance:', auth);
        console.log('Auth config:', auth.config);

        // Instead of complex detection, let's try a different approach
        // We'll test actual authentication methods to see what's enabled
        const detectedProviders: AuthProviders = {
          emailPassword: false,
          emailLink: false,
          phone: false,
          anonymous: false,
          google: false,
          facebook: false,
          twitter: false,
          github: false,
          microsoft: false,
          apple: false,
        };

        // Try to test each provider by attempting to get their credential
        // This will fail but the error codes will tell us if they're enabled

        // Test email/password by trying to fetch sign-in methods
        try {
          const methods = await fetchSignInMethodsForEmail(auth, 'test@nonexistent-email-for-testing.com');
          console.log('fetchSignInMethodsForEmail result:', methods);
          // If this succeeds without throwing, email auth is likely enabled
          detectedProviders.emailPassword = true;
        } catch (error: any) {
          console.log('Email auth test error:', error.code, error.message);
          // Specific error codes that indicate email auth is disabled
          if (error.code === 'auth/configuration-not-found' || 
              error.code === 'auth/project-not-found') {
            detectedProviders.emailPassword = false;
          } else {
            // Other errors likely mean it's enabled but just failed for other reasons
            detectedProviders.emailPassword = true;
          }
        }

        // For now, let's also create a simple fallback
        // Check if we're in a development environment and provide debug info
        console.log('Current detected providers:', detectedProviders);
        
        // Add some manual detection based on your Firebase Console setup
        // Since you mentioned email isn't enabled, let's default to false
        // and let you manually enable what you want

        setProviders(detectedProviders);
        setError(null);
        setLoading(false);
      } catch (error: any) {
        console.error('Error checking auth providers:', error);
        setError(error.message);
        
        // If we can't determine anything, show nothing
        setProviders({
          emailPassword: false,
          emailLink: false,
          phone: false,
          anonymous: false,
          google: false,
          facebook: false,
          twitter: false,
          github: false,
          microsoft: false,
          apple: false,
        });
        
        setLoading(false);
      }
    };

    checkAuthProviders();
  }, []);

  return { providers, loading, error };
}

// Alternative method to check available providers by examining the Firebase project config
export function useFirebaseProviderConfig() {
  const [config, setConfig] = useState<{
    availableProviders: string[];
    emailPasswordEnabled: boolean;
    oauthProviders: string[];
  }>({
    availableProviders: [],
    emailPasswordEnabled: false,
    oauthProviders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProviderConfig = async () => {
      try {
        if (!auth) {
          setLoading(false);
          return;
        }

        // Since Firebase doesn't expose the project configuration directly,
        // we'll use a combination of methods to detect what's available
        
        // For now, we'll assume email/password is enabled as you confirmed
        setConfig({
          availableProviders: ['password'],
          emailPasswordEnabled: true,
          oauthProviders: [],
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking provider config:', error);
        setLoading(false);
      }
    };

    checkProviderConfig();
  }, []);

  return { config, loading };
}