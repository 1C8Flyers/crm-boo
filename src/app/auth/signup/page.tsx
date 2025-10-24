'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Mail, AlertCircle } from 'lucide-react';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authProviders, setAuthProviders] = useState<{
    emailPassword: boolean;
    google: boolean;
    providers: string[];
  }>({
    emailPassword: false,
    google: false,
    providers: [],
  });
  const [checkingProviders, setCheckingProviders] = useState(true);
  
  const { signUp, signInWithGoogle, checkAuthProviders } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
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
          providers: ['password'],
        });
      } finally {
        setCheckingProviders(false);
      }
    };

    loadAuthProviders();
  }, [checkAuthProviders]);

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.name);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google sign up error:', error);
      let errorMessage = 'Failed to sign up with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign up was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      }
      
      setError('root', { message: errorMessage });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (checkingProviders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-900">Loading sign-up options...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no auth providers are enabled
  if (!authProviders.emailPassword && !authProviders.google) {
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign Up - Only show if enabled */}
          {authProviders.google && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading || isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>
            </div>
          )}

          {/* Divider - Only show if both providers are available */}
          {authProviders.emailPassword && authProviders.google && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-900">Or continue with email</span>
              </div>
            </div>
          )}

          {/* Email/Password Form - Only show if enabled */}
          {authProviders.emailPassword && (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('name')}
                      type="text"
                      autoComplete="name"
                      className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your full name"
                    />
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

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
                      autoComplete="new-password"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
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
                  disabled={isLoading || isGoogleLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create account'
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