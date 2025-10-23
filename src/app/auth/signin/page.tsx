'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, AlertCircle } from 'lucide-react';
import { FirebaseAuthStatus } from '@/components/auth/FirebaseAuthStatus';
import { SocialSignInButton } from '@/components/auth/SocialSignInButton';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authProviders, setAuthProviders] = useState<{
    emailPassword: boolean;
    google: boolean;
    facebook: boolean;
    twitter: boolean;
    github: boolean;
    microsoft: boolean;
    providers: string[];
  }>({
    emailPassword: false,
    google: false,
    facebook: false,
    twitter: false,
    github: false,
    microsoft: false,
    providers: [],
  });
  const [checkingProviders, setCheckingProviders] = useState(true);
  
  const { signIn, checkAuthProviders } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    const loadAuthProviders = async () => {
      try {
        const providers = await checkAuthProviders();
        setAuthProviders(providers);
      } catch (error) {
        console.error('Error checking auth providers:', error);
        // Default to email/password if check fails
        setAuthProviders({
          emailPassword: true,
          google: false,
          facebook: false,
          twitter: false,
          github: false,
          microsoft: false,
          providers: ['password'],
        });
      } finally {
        setCheckingProviders(false);
      }
    };

    loadAuthProviders();
  }, [checkAuthProviders]);

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      
      setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingProviders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading sign-in options...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no auth providers are enabled
  if (!authProviders.emailPassword && !authProviders.google && !authProviders.facebook && 
      !authProviders.twitter && !authProviders.github && !authProviders.microsoft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Authentication Not Configured
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No authentication providers are currently enabled. Please contact your administrator.
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                To enable authentication, go to the{' '}
                <a
                  href="https://console.firebase.google.com/project/crm-boo-prod/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Firebase Console
                </a>{' '}
                and enable Email/Password authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to CRM-BOO
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          {/* Firebase Auth Status - Debug Component */}
          <FirebaseAuthStatus />

          {/* Social Sign-In Providers */}
          <div className="space-y-3">
            {authProviders.google && (
              <SocialSignInButton provider="google" onError={(error) => setError('root', { message: error })} />
            )}
            {authProviders.facebook && (
              <SocialSignInButton provider="facebook" onError={(error) => setError('root', { message: error })} />
            )}
            {authProviders.twitter && (
              <SocialSignInButton provider="twitter" onError={(error) => setError('root', { message: error })} />
            )}
            {authProviders.github && (
              <SocialSignInButton provider="github" onError={(error) => setError('root', { message: error })} />
            )}
            {authProviders.microsoft && (
              <SocialSignInButton provider="microsoft" onError={(error) => setError('root', { message: error })} />
            )}
          </div>

          {/* Divider - Only show if both email and social providers are available */}
          {authProviders.emailPassword && (authProviders.google || authProviders.facebook || authProviders.twitter || authProviders.github || authProviders.microsoft) && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
              </div>
            </div>
          )}

          {/* Email/Password Form - Only show if enabled */}
          {authProviders.emailPassword && (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your email"
                    />
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600">{errors.root.message}</p>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}