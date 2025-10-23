# CRM-BOO - Modern Sales CRM

A modern, easy-to-use sales CRM built with Next.js 14, TypeScript, Tailwind CSS, and Firebase. Features customizable deal stages, customer management, product/subscription management, and invoicing capabilities.

## 🚀 Features

- **Customer Management**: Track customer information, contact details, and communication history
- **Customizable Deal Pipeline**: Manage deals through customizable stages with visual kanban board
- **Product & Subscription Management**: Handle both one-time products and recurring subscriptions
- **Invoicing System**: Create, send, and track invoices with automatic calculations
- **Firebase Integration**: Real-time data with Firebase Firestore and Authentication
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Deployment**: Firebase App Hosting

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/crm-boo.git
   cd crm-boo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database and Authentication (Email/Password)
   - Copy your Firebase config

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore Security Rules**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init firestore`
   - Deploy rules: `firebase deploy --only firestore:rules`

## 🚀 Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Building

Build the application for production:

```bash
npm run build
```

## 🌐 Deployment

### Firebase App Hosting

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase App Hosting**
   ```bash
   firebase init apphosting
   ```

4. **Update configuration**
   - Update `apphosting.yaml` with your project details
   - Update `.firebaserc` with your project ID

5. **Deploy**
   ```bash
   firebase deploy
   ```

### Manual Hosting

For static hosting on other platforms:

1. **Enable static export** in `next.config.js`:
   ```javascript
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     distDir: 'out',
     images: {
       unoptimized: true
     }
   };
   ```

2. **Build and export**:
   ```bash
   npm run build
   ```

3. **Deploy the `out` folder** to your hosting provider

## 📱 Usage

### First Time Setup

1. **Create an account** - Sign up with email and password
2. **Add customers** - Start by adding your customer information
3. **Create products** - Set up your products and subscription services
4. **Configure deal stages** - Customize your sales pipeline (default stages are provided)
5. **Start managing deals** - Create deals and move them through your pipeline
6. **Generate invoices** - Create and send invoices to customers

### Managing Customers

- View all customers in a grid layout
- Add new customers with contact information
- Edit existing customer details
- Search and filter customers

### Deal Pipeline

- Visual kanban board with customizable stages
- Track deal value, probability, and expected close date
- Associate deals with customers

### Products & Subscriptions

- Manage both one-time products and recurring subscriptions
- Set pricing and billing intervals
- Mark products as active/inactive
- Use products when creating invoices

### Invoicing

- Create invoices with line items
- Automatic calculations (subtotal, tax, total)
- Track invoice status (draft, sent, paid, overdue)
- Link invoices to customers and deals

## 🔧 Configuration

### Firebase Security Rules

The included Firestore rules provide basic security:
- Users can only access their own data
- Authenticated users can read/write all CRM data

For production, consider implementing more granular permissions based on user roles.

### Customization

- **Deal Stages**: Modify `dealStageService.initializeDefaultStages()` to customize default stages
- **User Roles**: Extend the user system with role-based permissions
- **Branding**: Update colors and styling in Tailwind CSS classes
- **Features**: Add new modules following the established patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Issues

If you encounter any issues or have feature requests, please create an issue on GitHub.

## ⭐ Support

If you find this project helpful, please give it a star on GitHub!

---

Built with ❤️ using Next.js, TypeScript, and Firebase.
