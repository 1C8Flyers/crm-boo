# Deployment Guide

## Overview

CRM-BOO can be deployed to various platforms. This guide covers the most common deployment scenarios and best practices.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created and configured
- Environment variables properly set

## Firebase App Hosting (Recommended)

Firebase App Hosting provides the best integration with Firebase services and automatic builds from GitHub.

### Initial Setup

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize App Hosting**
   ```bash
   firebase init apphosting
   ```

4. **Configure `apphosting.yaml`**
   ```yaml
   runConfig:
     concurrency: 100
     cpu: 1
     memoryMiB: 512
     maxInstances: 100
     minInstances: 0
   env:
     - variable: NODE_ENV
       value: production
   ```

### Environment Variables

Set environment variables in Firebase Console:
1. Go to Firebase Console → App Hosting
2. Navigate to your app → Settings
3. Add environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Deploy

```bash
firebase deploy --only apphosting
```

## Vercel Deployment

Vercel provides excellent Next.js hosting with automatic builds and deployments.

### Setup

1. **Connect GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Netlify Deployment

Netlify offers static site hosting with build automation.

### Setup for Static Export

1. **Update `next.config.js`**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     distDir: 'out',
     images: {
       unoptimized: true
     }
   };

   module.exports = nextConfig;
   ```

2. **Build Script**
   ```json
   {
     "scripts": {
       "build": "next build"
     }
   }
   ```

3. **Netlify Configuration**
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "out"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/*"
     to = "/404.html"
     status = 404
   ```

### Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Self-Hosted Deployment

For self-hosted environments using Docker or traditional servers.

### Docker Deployment

1. **Create `Dockerfile`**
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app

   COPY package.json package-lock.json* ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .

   # Build arguments for environment variables
   ARG NEXT_PUBLIC_FIREBASE_API_KEY
   ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
   ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   ARG NEXT_PUBLIC_FIREBASE_APP_ID

   # Set environment variables
   ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
   ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
   ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

   RUN npm run build

   # Production image
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"

   CMD ["node", "server.js"]
   ```

2. **Create `.dockerignore`**
   ```
   .git
   .gitignore
   README.md
   Dockerfile
   .dockerignore
   node_modules
   .next
   .env*.local
   ```

3. **Build and Run**
   ```bash
   # Build image
   docker build \
     --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
     --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
     --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
     --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
     --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
     --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
     -t crm-boo .

   # Run container
   docker run -p 3000:3000 crm-boo
   ```

### Traditional Server

1. **Server Requirements**
   - Node.js 18+
   - PM2 or similar process manager
   - Nginx (recommended for reverse proxy)

2. **Build for Production**
   ```bash
   npm install
   npm run build
   ```

3. **PM2 Configuration**
   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'crm-boo',
       script: 'npm',
       args: 'start',
       cwd: '/path/to/crm-boo',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         NEXT_PUBLIC_FIREBASE_API_KEY: 'your_api_key',
         NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'your_domain',
         NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'your_project_id',
         NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'your_bucket',
         NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'your_sender_id',
         NEXT_PUBLIC_FIREBASE_APP_ID: 'your_app_id'
       }
     }]
   };
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

### Required Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Optional Variables
```env
NODE_ENV=production
PORT=3000
```

## Post-Deployment Checklist

### Firebase Configuration
- [ ] Firestore security rules deployed
- [ ] Authentication providers configured
- [ ] Billing enabled (if using Blaze plan)
- [ ] Backup strategy in place

### Security
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Content Security Policy (CSP) headers
- [ ] Security headers configured

### Performance
- [ ] CDN configured (if applicable)
- [ ] Compression enabled
- [ ] Caching strategy implemented
- [ ] Performance monitoring enabled

### Monitoring
- [ ] Error tracking configured
- [ ] Analytics setup
- [ ] Uptime monitoring
- [ ] Performance monitoring

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+ required)
   - Verify all environment variables are set
   - Clear cache: `rm -rf .next node_modules && npm install`

2. **Firebase Connection Issues**
   - Verify Firebase project ID
   - Check API keys and configuration
   - Ensure Firestore rules are deployed

3. **Environment Variable Issues**
   - Variables must be prefixed with `NEXT_PUBLIC_` for client-side access
   - Check for typos in variable names
   - Verify variables are set in deployment platform

4. **Performance Issues**
   - Enable compression
   - Configure caching headers
   - Optimize images and assets
   - Consider CDN for static assets

### Debugging

1. **Enable Debug Logging**
   ```env
   DEBUG=*
   NODE_ENV=development
   ```

2. **Check Build Output**
   ```bash
   npm run build -- --debug
   ```

3. **Monitor Performance**
   - Use Next.js built-in analytics
   - Firebase Performance Monitoring
   - Web Vitals tracking

## Rollback Strategy

1. **Version Control**
   - Tag releases: `git tag v1.0.0`
   - Keep previous builds available

2. **Database Backups**
   - Regular Firestore exports
   - Backup before major deployments

3. **Quick Rollback**
   - Keep previous Docker images
   - Use deployment platform rollback features
   - Have rollback scripts ready

## Scaling Considerations

1. **Firebase Limits**
   - Document read/write limits
   - Storage limits
   - Bandwidth limits

2. **Caching Strategy**
   - Client-side caching
   - CDN for static assets
   - API response caching

3. **Performance Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle analysis

---

For support or questions about deployment, please check the GitHub issues or create a new issue with deployment details.