# Development Guide

## Overview

This guide covers everything you need to know to contribute to CRM-BOO, from setting up your development environment to understanding the codebase architecture.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Latest version (comes with Node.js)
- **Git**: For version control
- **Firebase Account**: For backend services
- **Code Editor**: VS Code recommended

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/crm-boo.git
cd crm-boo

# Install dependencies
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication (Email/Password)

2. **Get Firebase Configuration**
   - Project Settings → General → Your apps
   - Copy the config object

3. **Set up Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 3. Firebase CLI Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Authentication pages
│   ├── activities/          # Activity management
│   ├── contacts/            # Contact management
│   ├── customers/           # Customer management
│   ├── dashboard/           # Main dashboard
│   ├── deals/               # Deal pipeline
│   ├── invoices/           # Invoice system
│   ├── products/           # Product catalog
│   ├── settings/           # Application settings
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components
│   ├── settings/           # Settings components
│   └── Notes.tsx           # Activity management
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication state
├── hooks/                  # Custom React hooks
│   ├── useAuthProviders.ts
│   ├── useFirebaseAuthTest.ts
│   └── useManualAuthProviders.ts
├── lib/                    # Utility libraries
│   ├── services/           # Service utilities
│   ├── firebase.ts         # Firebase config
│   └── firebase-services.ts # Firebase operations
└── types/                  # TypeScript definitions
    └── index.ts            # All type definitions
```

## Architecture Patterns

### Service Layer Pattern

All data operations go through service functions in `src/lib/firebase-services.ts`:

```typescript
// Service function structure
export const entityService = {
  async getAll(): Promise<Entity[]> { /* implementation */ },
  async getById(id: string): Promise<Entity | null> { /* implementation */ },
  async create(data: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> { /* implementation */ },
  async update(id: string, data: Partial<Entity>): Promise<void> { /* implementation */ },
  async delete(id: string): Promise<void> { /* implementation */ }
};
```

### Component Pattern

Components follow a consistent structure:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// ... other imports

export default function ComponentName() {
  const { user, loading } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await service.getAll();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // JSX with consistent styling
}
```

### Form Pattern

Forms use React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export default function FormComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Coding Standards

### TypeScript

- **Strict Mode**: Always enabled
- **Type Definitions**: All interfaces in `src/types/index.ts`
- **No Any**: Avoid `any` type, use proper typing
- **Consistent Naming**: PascalCase for components, camelCase for functions

### React

- **Functional Components**: Use function components with hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Error Boundaries**: Handle errors gracefully
- **Loading States**: Always show loading indicators

### Styling

- **Tailwind CSS**: Use utility classes for styling
- **Consistent Spacing**: Use Tailwind spacing scale
- **Responsive Design**: Mobile-first approach
- **Custom Fonts**: Poppins for headings, PT Sans for body text

### File Naming

- **Components**: PascalCase (e.g., `CustomerList.tsx`)
- **Pages**: lowercase (e.g., `page.tsx`)
- **Utilities**: camelCase (e.g., `firebase-services.ts`)
- **Types**: lowercase (e.g., `index.ts`)

## Adding New Features

### 1. Define Types

Add new interfaces to `src/types/index.ts`:

```typescript
export interface NewEntity {
  id: string;
  name: string;
  // ... other fields
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Create Service Functions

Add service functions to `src/lib/firebase-services.ts`:

```typescript
export const newEntityService = {
  async getAll(): Promise<NewEntity[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'newEntities'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as NewEntity[];
  },
  // ... other CRUD operations
};
```

### 3. Create Pages

Create page in `src/app/new-feature/page.tsx`:

```typescript
'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
// ... implementation

export default function NewFeaturePage() {
  return (
    <DashboardLayout>
      {/* Page content */}
    </DashboardLayout>
  );
}
```

### 4. Add Navigation

Update `src/components/layout/Sidebar.tsx`:

```typescript
const navigation = [
  // ... existing items
  { name: 'New Feature', href: '/new-feature', icon: YourIcon },
];
```

### 5. Update Firestore Rules

Add security rules for new collections in `firestore.rules`:

```javascript
match /newEntities/{document} {
  allow read, write: if request.auth != null;
}
```

## Testing

### Manual Testing

1. **User Flows**: Test complete user workflows
2. **Edge Cases**: Test with empty states, errors, etc.
3. **Responsive Design**: Test on different screen sizes
4. **Authentication**: Test login/logout flows

### Error Testing

1. **Network Issues**: Test with slow/failed requests
2. **Invalid Data**: Test form validation
3. **Permission Errors**: Test Firestore security
4. **Empty States**: Test with no data

## Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **Firebase**

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run lint            # Run ESLint

# Firebase
firebase serve          # Serve locally
firebase deploy         # Deploy to Firebase
firebase functions:log  # View function logs
```

## Debugging

### Client-Side Debugging

1. **React DevTools**: Install browser extension
2. **Console Logging**: Use `console.log` strategically
3. **Network Tab**: Monitor API requests
4. **Application Tab**: Check local storage, cookies

### Firebase Debugging

1. **Firestore Rules**: Test in Firebase Console
2. **Authentication**: Check user state in AuthContext
3. **Network Requests**: Monitor Firestore calls
4. **Emulator Suite**: Use Firebase emulators for local testing

## Performance Optimization

### Code Splitting

```typescript
// Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Memoization

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependency]);
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={isAboveFold}
/>
```

## Firebase Best Practices

### Firestore

1. **Batch Operations**: Use batches for multiple writes
2. **Indexes**: Create composite indexes for complex queries
3. **Security Rules**: Always validate data server-side
4. **Pagination**: Implement pagination for large datasets

### Authentication

1. **Error Handling**: Handle all auth states properly
2. **Persistent Login**: Use onAuthStateChanged
3. **Security**: Validate user permissions
4. **Cleanup**: Remove auth listeners on unmount

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `refactor/component-name` - Code refactoring

### Commit Messages

Use conventional commits:

```
feat: add contact management system
fix: resolve date timezone issue
docs: update API documentation
style: improve mobile responsive design
refactor: extract common form logic
test: add user authentication tests
```

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Implement the feature
3. **Test Thoroughly**: Ensure everything works
4. **Update Documentation**: Update relevant docs
5. **Create PR**: Include description and testing notes
6. **Code Review**: Address feedback
7. **Merge**: Squash and merge when approved

## Common Issues

### Build Errors

1. **TypeScript Errors**: Check type definitions
2. **Import Errors**: Verify file paths and exports
3. **Environment Variables**: Ensure all required vars are set
4. **Dependencies**: Check for version conflicts

### Runtime Errors

1. **Authentication Issues**: Check Firebase config
2. **Firestore Permissions**: Verify security rules
3. **React Errors**: Check component lifecycle
4. **Network Issues**: Handle offline states

### Performance Issues

1. **Large Bundles**: Analyze bundle size
2. **Slow Queries**: Optimize Firestore queries
3. **Memory Leaks**: Check for unremoved listeners
4. **Render Issues**: Use React Profiler

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Firebase Console](https://console.firebase.google.com/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

For questions about development, please check existing GitHub issues or create a new one with the `question` label.