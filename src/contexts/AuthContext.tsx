'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User as AppUser } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthProviders: () => Promise<{
    emailPassword: boolean;
    google: boolean;
    facebook: boolean;
    twitter: boolean;
    github: boolean;
    microsoft: boolean;
    providers: string[];
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user && db) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as AppUser);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Create user profile in Firestore
    const userProfile: AppUser = {
      id: user.uid,
      email: user.email!,
      name,
      role: 'sales', // Default role
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    setUserProfile(userProfile);
  };

  const signOut = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists, if not create one
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const userProfile: AppUser = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'Google User',
        role: 'sales', // Default role
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
    }
  };

  const signInWithFacebook = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const userProfile: AppUser = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'Facebook User',
        role: 'sales',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
    }
  };

  const signInWithTwitter = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    const provider = new TwitterAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const userProfile: AppUser = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'Twitter User',
        role: 'sales',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
    }
  };

  const signInWithGithub = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const userProfile: AppUser = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'GitHub User',
        role: 'sales',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
    }
  };

  const signInWithMicrosoft = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    const provider = new OAuthProvider('microsoft.com');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const userProfile: AppUser = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || 'Microsoft User',
        role: 'sales',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
    }
  };

  const checkAuthProviders = async () => {
    if (!auth) {
      return {
        emailPassword: false,
        google: false,
        facebook: false,
        twitter: false,
        github: false,
        microsoft: false,
        providers: [],
      };
    }

    try {
      // Check what providers are available by testing with a dummy email
      const methods = await fetchSignInMethodsForEmail(auth, 'test@example.com');
      
      return {
        emailPassword: true, // You confirmed this is enabled
        google: methods?.includes(GoogleAuthProvider.PROVIDER_ID) || false,
        facebook: methods?.includes(FacebookAuthProvider.PROVIDER_ID) || false,
        twitter: methods?.includes(TwitterAuthProvider.PROVIDER_ID) || false,
        github: methods?.includes(GithubAuthProvider.PROVIDER_ID) || false,
        microsoft: methods?.includes('microsoft.com') || false,
        providers: methods || ['password'],
      };
    } catch (error: any) {
      // If we get an error, assume email/password is available since you confirmed it
      return {
        emailPassword: true,
        google: false,
        facebook: false,
        twitter: false,
        github: false,
        microsoft: false,
        providers: ['password'],
      };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signInWithGithub,
    signInWithMicrosoft,
    signOut,
    checkAuthProviders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}