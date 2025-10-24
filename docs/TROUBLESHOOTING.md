# Troubleshooting Guide

This guide covers common issues you might encounter while developing or deploying CRM-BOO and their solutions.

## Development Issues

### Build Errors

#### TypeScript Compilation Errors

**Problem**: TypeScript compilation fails with type errors.

**Common Errors**:
```
Type 'undefined' is not assignable to type 'string'
Property 'id' does not exist on type 'Customer | null'
```

**Solution**:
1. **Check type definitions** in `src/types/index.ts`
2. **Add proper type guards**:
   ```typescript
   if (customer && customer.id) {
     // Safe to use customer.id
   }
   ```
3. **Use optional chaining**:
   ```typescript
   const name = customer?.name ?? 'Unknown';
   ```

#### Import/Export Errors

**Problem**: Module not found or import errors.

**Common Errors**:
```
Module not found: Can't resolve '@/components/...'
Cannot find module or its corresponding type declarations
```

**Solution**:
1. **Check file paths** are correct
2. **Verify tsconfig.json** has proper path mapping:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```
3. **Check file extensions** are included in imports

#### Next.js Specific Errors

**Problem**: Next.js specific build issues.

**Common Errors**:
```
Error: useSearchParams() should be wrapped in a suspense boundary
Hydration failed because the initial UI does not match
```

**Solution**:
1. **Wrap useSearchParams in Suspense**:
   ```typescript
   import { Suspense } from 'react';
   
   function SearchComponent() {
     const searchParams = useSearchParams();
     // Component logic
   }
   
   export default function Page() {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <SearchComponent />
       </Suspense>
     );
   }
   ```

2. **Fix hydration issues**:
   ```typescript
   const [mounted, setMounted] = useState(false);
   
   useEffect(() => {
     setMounted(true);
   }, []);
   
   if (!mounted) {
     return null; // or loading component
   }
   ```

### Runtime Errors

#### Firebase Authentication Issues

**Problem**: Users can't sign in or authentication state is inconsistent.

**Common Errors**:
```
FirebaseError: Firebase: Error (auth/configuration-not-found)
FirebaseError: Firebase: Error (auth/network-request-failed)
```

**Solution**:
1. **Check Firebase configuration**:
   ```typescript
   // Verify all environment variables are set
   console.log('Firebase Config:', {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     // ... other config values
   });
   ```

2. **Enable authentication method** in Firebase Console:
   - Go to Authentication → Sign-in method
   - Enable Email/Password

3. **Check network connectivity**:
   ```typescript
   // Add error handling
   try {
     await signInWithEmailAndPassword(auth, email, password);
   } catch (error) {
     console.error('Auth error:', error.code, error.message);
     // Handle specific error codes
     switch (error.code) {
       case 'auth/user-not-found':
         setError('No account found with this email');
         break;
       case 'auth/wrong-password':
         setError('Incorrect password');
         break;
       default:
         setError('Authentication failed. Please try again.');
     }
   }
   ```

#### Firestore Permission Errors

**Problem**: Users get permission denied errors when accessing data.

**Common Errors**:
```
FirebaseError: Missing or insufficient permissions
FirebaseError: False for 'get' @ L2
```

**Solution**:
1. **Check Firestore security rules**:
   ```javascript
   // firestore.rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their data
       match /{collection}/{document} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Deploy security rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Verify user authentication**:
   ```typescript
   const { user } = useAuth();
   if (!user) {
     console.log('User not authenticated');
     return;
   }
   ```

#### Data Loading Issues

**Problem**: Data doesn't load or shows stale information.

**Solution**:
1. **Add proper error handling**:
   ```typescript
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   
   useEffect(() => {
     const loadData = async () => {
       try {
         setLoading(true);
         setError(null);
         const data = await service.getAll();
         setData(data);
       } catch (err) {
         console.error('Load error:', err);
         setError('Failed to load data');
       } finally {
         setLoading(false);
       }
     };
     
     loadData();
   }, []);
   ```

2. **Check data format**:
   ```typescript
   // Ensure dates are converted properly
   const data = docs.map(doc => ({
     ...doc.data(),
     id: doc.id,
     createdAt: doc.data().createdAt?.toDate() || new Date(),
     updatedAt: doc.data().updatedAt?.toDate() || new Date(),
   }));
   ```

## Deployment Issues

### Firebase Hosting

#### Build Upload Fails

**Problem**: Firebase deployment fails during upload.

**Common Errors**:
```
Error: HTTP Error: 413, Request Entity Too Large
Upload failed: Maximum upload size exceeded
```

**Solution**:
1. **Optimize build size**:
   ```bash
   # Analyze bundle size
   npm run build
   npx @next/bundle-analyzer
   ```

2. **Clean and rebuild**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Check .firebaserc and firebase.json**:
   ```json
   {
     "hosting": {
       "public": "out",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ]
     }
   }
   ```

#### Functions Deployment Issues

**Problem**: Firebase functions fail to deploy.

**Solution**:
1. **Check Node.js version**:
   ```json
   // firebase.json
   {
     "functions": {
       "runtime": "nodejs18"
     }
   }
   ```

2. **Verify function dependencies**:
   ```bash
   cd functions
   npm install
   npm run build
   ```

### Vercel Deployment

#### Environment Variables Missing

**Problem**: Environment variables not available in production.

**Solution**:
1. **Add environment variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all `NEXT_PUBLIC_*` variables

2. **Redeploy** after adding variables:
   ```bash
   vercel --prod
   ```

#### Build Timeout

**Problem**: Vercel build times out.

**Solution**:
1. **Optimize build process**:
   ```json
   // package.json
   {
     "scripts": {
       "build": "next build",
       "export": "next export"
     }
   }
   ```

2. **Use build cache**:
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       buildActivityGraph: true,
     }
   };
   ```

### Netlify Deployment

#### Redirect Issues

**Problem**: Client-side routing doesn't work on Netlify.

**Solution**:
1. **Add _redirects file**:
   ```
   # public/_redirects
   /*    /index.html   200
   ```

2. **Configure rewrites**:
   ```toml
   # netlify.toml
   [build]
     publish = "out"
     command = "npm run build && npm run export"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

## Performance Issues

### Slow Page Loading

**Problem**: Pages load slowly or feel sluggish.

**Diagnosis**:
1. **Use React DevTools Profiler**
2. **Check Network tab** in browser dev tools
3. **Analyze Core Web Vitals**

**Solution**:
1. **Implement code splitting**:
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

2. **Optimize images**:
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority={isAboveFold}
     placeholder="blur"
   />
   ```

3. **Use proper caching**:
   ```typescript
   // Enable caching for API routes
   export const revalidate = 3600; // 1 hour
   ```

### Memory Leaks

**Problem**: Application memory usage increases over time.

**Solution**:
1. **Clean up subscriptions**:
   ```typescript
   useEffect(() => {
     const unsubscribe = onSnapshot(query, (snapshot) => {
       // Handle data
     });
     
     return () => unsubscribe();
   }, []);
   ```

2. **Remove event listeners**:
   ```typescript
   useEffect(() => {
     const handleResize = () => {
       // Handle resize
     };
     
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
   }, []);
   ```

### Large Bundle Size

**Problem**: JavaScript bundle is too large.

**Solution**:
1. **Analyze bundle**:
   ```bash
   npx @next/bundle-analyzer
   ```

2. **Use dynamic imports**:
   ```typescript
   const Chart = dynamic(() => import('react-chartjs-2'), {
     ssr: false,
     loading: () => <div>Loading chart...</div>
   });
   ```

3. **Tree shake unused code**:
   ```typescript
   // Import only what you need
   import { collection, doc } from 'firebase/firestore';
   // Instead of: import * as firestore from 'firebase/firestore';
   ```

## Common User Issues

### Authentication Problems

#### Can't Sign In

**User Reports**: "I can't log into my account"

**Solution Steps**:
1. **Verify email/password** are correct
2. **Check if account exists**:
   ```typescript
   import { fetchSignInMethodsForEmail } from 'firebase/auth';
   
   const methods = await fetchSignInMethodsForEmail(auth, email);
   if (methods.length === 0) {
     // Account doesn't exist
   }
   ```
3. **Password reset**:
   ```typescript
   import { sendPasswordResetEmail } from 'firebase/auth';
   
   await sendPasswordResetEmail(auth, email);
   ```

#### Session Expires

**User Reports**: "I keep getting logged out"

**Solution**:
1. **Check auth persistence**:
   ```typescript
   import { setPersistence, browserLocalPersistence } from 'firebase/auth';
   
   await setPersistence(auth, browserLocalPersistence);
   ```

2. **Handle auth state changes**:
   ```typescript
   useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (user) => {
       setUser(user);
       setLoading(false);
     });
     
     return unsubscribe;
   }, []);
   ```

### Data Sync Issues

#### Data Not Updating

**User Reports**: "My changes aren't saving"

**Solution**:
1. **Check network connection**
2. **Verify write permissions**
3. **Add retry logic**:
   ```typescript
   const saveWithRetry = async (data: any, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try {
         await service.update(id, data);
         return;
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   };
   ```

#### Stale Data

**User Reports**: "I see old information"

**Solution**:
1. **Implement real-time updates**:
   ```typescript
   useEffect(() => {
     const unsubscribe = onSnapshot(
       collection(db, 'customers'),
       (snapshot) => {
         const data = snapshot.docs.map(doc => ({
           ...doc.data(),
           id: doc.id
         }));
         setCustomers(data);
       }
     );
     
     return unsubscribe;
   }, []);
   ```

2. **Add manual refresh**:
   ```typescript
   const refreshData = async () => {
     setLoading(true);
     try {
       const fresh = await service.getAll();
       setData(fresh);
     } finally {
       setLoading(false);
     }
   };
   ```

## Debugging Tools

### Browser Developer Tools

1. **Console**: Check for JavaScript errors
2. **Network**: Monitor API requests and responses
3. **Application**: Check localStorage, sessionStorage, cookies
4. **Performance**: Profile rendering performance
5. **Sources**: Debug with breakpoints

### React Developer Tools

1. **Components**: Inspect component props and state
2. **Profiler**: Analyze rendering performance
3. **Hook inspection**: Debug custom hooks

### Firebase Debug Tools

1. **Firebase Console**: Monitor database and authentication
2. **Emulator Suite**: Test locally without affecting production
3. **Performance Monitoring**: Track app performance
4. **Crashlytics**: Monitor crashes and errors

### VS Code Debugging

1. **Install Node.js debugger**
2. **Set breakpoints** in source code
3. **Configure launch.json**:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Next.js: debug server-side",
         "type": "node",
         "request": "attach",
         "port": 9229,
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Search existing GitHub issues**
3. **Check browser console** for errors
4. **Test in incognito mode** to rule out extensions
5. **Try in different browser** to isolate browser-specific issues

### When Creating Bug Reports

Include:
1. **Steps to reproduce** the issue
2. **Expected behavior** vs actual behavior
3. **Screenshots or videos** if applicable
4. **Browser and OS information**
5. **Console errors** (if any)
6. **Environment** (development/production)

### Useful Log Information

```typescript
// Add debug logging
console.log('User:', user);
console.log('Loading state:', loading);
console.log('Data:', data);
console.log('Error:', error);

// Firebase debug
console.log('Firebase config:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
});
```

---

If you can't find a solution to your problem in this guide, please create a GitHub issue with detailed information about the problem.