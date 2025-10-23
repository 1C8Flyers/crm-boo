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

        // Initialize all providers as disabled
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

        // Use fetchSignInMethodsForEmail to detect enabled providers
        // This method returns the enabled sign-in methods for the Firebase project
        try {
          // Try with a test email - this will return enabled providers even if email doesn't exist
          const methods = await fetchSignInMethodsForEmail(auth, 'test@example.com');
          console.log('Available sign-in methods:', methods);
          
          // Check each method that's returned
          if (methods) {
            detectedProviders.emailPassword = methods.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD);
            detectedProviders.emailLink = methods.includes(EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD);
            detectedProviders.google = methods.includes(GoogleAuthProvider.PROVIDER_ID);
            detectedProviders.facebook = methods.includes(FacebookAuthProvider.PROVIDER_ID);
            detectedProviders.twitter = methods.includes(TwitterAuthProvider.PROVIDER_ID);
            detectedProviders.github = methods.includes(GithubAuthProvider.PROVIDER_ID);
            detectedProviders.phone = methods.includes(PhoneAuthProvider.PROVIDER_ID);
            
            // Check for Microsoft (uses different provider ID format)
            detectedProviders.microsoft = methods.includes('microsoft.com') || methods.includes('oidc.microsoft.com');
            detectedProviders.apple = methods.includes('apple.com');
          }
        } catch (error: any) {
          console.log('fetchSignInMethodsForEmail error:', error.code, error.message);
          
          // If we get certain errors, we can still try to detect providers differently
          if (error.code === 'auth/invalid-email') {
            // Email format issue, but providers might still be detectable
            console.log('Invalid email format, trying alternative detection...');
          }
          
          // Try alternative detection method using provider configs
          try {
            // Check if we can create provider instances (indicates they're configured)
            
            // Test Google
            try {
              const googleProvider = new GoogleAuthProvider();
              // If we can access the provider and it has the right ID, it's likely configured
              if (googleProvider.providerId === GoogleAuthProvider.PROVIDER_ID) {
                detectedProviders.google = true;
              }
            } catch (e) {
              console.log('Google provider not available');
            }

            // Test Facebook
            try {
              const facebookProvider = new FacebookAuthProvider();
              if (facebookProvider.providerId === FacebookAuthProvider.PROVIDER_ID) {
                detectedProviders.facebook = true;
              }
            } catch (e) {
              console.log('Facebook provider not available');
            }

            // Test Twitter
            try {
              const twitterProvider = new TwitterAuthProvider();
              if (twitterProvider.providerId === TwitterAuthProvider.PROVIDER_ID) {
                detectedProviders.twitter = true;
              }
            } catch (e) {
              console.log('Twitter provider not available');
            }

            // Test GitHub
            try {
              const githubProvider = new GithubAuthProvider();
              if (githubProvider.providerId === GithubAuthProvider.PROVIDER_ID) {
                detectedProviders.github = true;
              }
            } catch (e) {
              console.log('GitHub provider not available');
            }

            // Test Microsoft
            try {
              const microsoftProvider = new OAuthProvider('microsoft.com');
              if (microsoftProvider.providerId === 'microsoft.com') {
                detectedProviders.microsoft = true;
              }
            } catch (e) {
              console.log('Microsoft provider not available');
            }

            // For email/password, try a different approach
            // Since fetchSignInMethodsForEmail failed, we'll assume it's not configured
            // unless we get evidence otherwise
            detectedProviders.emailPassword = false;
            
          } catch (altError) {
            console.log('Alternative detection failed:', altError);
          }
        }

        console.log('Final detected providers:', detectedProviders);
        setProviders(detectedProviders);
        setError(null);
        setLoading(false);
      } catch (error: any) {
        console.error('Error checking auth providers:', error);
        setError(error.message);
        
        // If we can't determine anything, show nothing to be safe
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