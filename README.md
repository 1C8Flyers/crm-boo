# CRM-BOO - Modern Sales CRM

A comprehensive, modern sales CRM built with Next.js 14, TypeScript, Tailwind CSS, and Firebase. Features complete customer relationship management, customizable deal pipelines, contact management, activity tracking, invoicing, and data import capabilities.

## 🚀 Features

### 📊 Dashboard & Analytics
- **Real-time Dashboard**: Overview of key metrics, deal values, and subscription revenue
- **Today's Activities**: Focus view showing meetings and follow-ups due today
- **Quick Actions**: Fast access to create customers, deals, products, and invoices
- **Statistics Cards**: Total customers, deals, products, invoices, and revenue tracking

### � Customer Management
- **Customer Profiles**: Complete customer information with contact details and addresses
- **Customer List**: Searchable, filterable grid view of all customers
- **Customer Details**: Dedicated customer pages with associated deals and activities
- **Address Management**: Full address tracking for each customer

### 👤 Contact Management
- **Individual Contacts**: Separate contact management linked to customers
- **Primary Contacts**: Designate key contacts for each customer/company
- **Contact Details**: Names, titles, departments, phone numbers, emails
- **Social Media Integration**: LinkedIn and Twitter profile links
- **Deal Associations**: Link contacts to specific deals
- **Advanced Search**: Search across names, titles, emails, and departments

### 💼 Deal Pipeline Management
- **Customizable Stages**: Create and reorder deal stages with drag-and-drop
- **Visual Pipeline**: Kanban-style board view of deals
- **Deal Details**: Comprehensive deal information with customer association
- **Probability Tracking**: Success probability for each deal
- **Value Management**: Automated deal value calculations from proposals
- **Proposal-Driven Values**: Deal values automatically update from all linked proposals
- **Subscription Tracking**: Separate tracking for one-time and subscription revenue
- **Expected Close Dates**: Timeline management for deals
- **Real-time Updates**: Values refresh automatically when proposals change

### 📝 Proposal & Quote Management
- **Professional Proposals**: Create detailed proposals with line items
- **Product Integration**: Add products and subscriptions to proposals
- **Quick Product Creation**: Create new products on-the-fly during proposal creation
- **Proposal Status Tracking**: Draft, sent, viewed, accepted, rejected, expired
- **PDF Generation**: Browser-native HTML to PDF conversion
- **Company Branding**: Proposals include company information and branding
- **Deal Integration**: Automatically update deal values from proposal totals
- **Customer & Deal Links**: Associate proposals with customers and deals
- **Discount & Tax Management**: Apply discounts and taxes to proposals
- **Validity Periods**: Set expiration dates for proposals
- **Notes & Terms**: Include custom notes and terms on proposals

### 📝 Activity & Task Management
- **Activity Types**: Notes, emails, calls, meetings, and tasks
- **Due Date Management**: Optional due dates for all activity types
- **Meeting Scheduling**: Specific meeting dates for when meetings happen/will happen
- **Completion Tracking**: Mark activities as complete with timestamps
- **Activity Dashboard**: Today view showing urgent items
- **Comprehensive Activity Management**: Dedicated activities page with filtering
- **Clickable Activities**: Direct navigation to edit activities from any view

### 📦 Product & Subscription Management
- **Product Catalog**: Manage both one-time products and recurring subscriptions
- **Pricing Management**: Set prices and billing intervals
- **Product Status**: Active/inactive product management
- **Subscription Intervals**: Monthly, quarterly, and yearly billing options

### 🧾 Invoicing System
- **Invoice Creation**: Generate invoices with line items from products
- **Status Management**: Draft, sent, paid, overdue, and cancelled statuses
- **Flexible Status Changes**: Change invoice status at any time (including after paid)
- **Accidental Payment Correction**: Easily unmark invoices if marked paid by mistake
- **Automatic Calculations**: Subtotal, tax, and total calculations
- **PDF Generation**: Professional PDF invoices with company branding
- **Customer Association**: Link invoices to customers and deals
- **Due Date Management**: Track payment deadlines
- **Company Information**: Invoices include full company details and branding

### 📁 Data Import/Export
- **CSV Import**: Import customers and deals from CSV files
- **Sample Downloads**: Download sample CSV templates for proper formatting
- **Import Validation**: Real-time validation with detailed error reporting
- **Bulk Operations**: Import multiple records with progress tracking

### ⚙️ Settings & Configuration
- **Deal Stage Customization**: Create, edit, reorder, and delete deal stages
- **Company Information**: Configure your company details for invoices
- **Data Import/Export**: Manage data imports with sample file downloads
- **Account Management**: User profile and account settings

### 🔐 Authentication & Security
- **Firebase Authentication**: Email/password authentication
- **User Management**: Secure user registration and login
- **Data Isolation**: Each user's data is completely separate
- **Security Rules**: Comprehensive Firestore security rules

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom brand colors
- **Backend**: Firebase (Firestore, Authentication)
- **Form Handling**: React Hook Form with Zod validation
- **Drag & Drop**: DND Kit for reorderable interfaces
- **Icons**: Lucide React
- **Date Handling**: date-fns for timezone-aware date management
- **Deployment**: Firebase App Hosting
- **Build Tool**: Turbopack for faster builds

## � Project Structure

```
src/
├── app/                      # Next.js 14 App Router pages
│   ├── activities/          # Activity management
│   ├── auth/               # Authentication pages
│   ├── contacts/           # Contact management
│   │   └── detail/         # Contact detail pages
│   ├── customers/          # Customer management
│   │   └── detail/         # Customer detail pages
│   ├── dashboard/          # Main dashboard
│   ├── deals/              # Deal pipeline management
│   │   ├── detail/         # Deal detail pages
│   │   ├── edit/           # Deal editing
│   │   └── new/            # New deal creation
│   ├── invoices/           # Invoice system
│   │   ├── detail/         # Invoice detail with PDF generation
│   │   └── new/            # Invoice creation
│   ├── products/           # Product catalog
│   ├── proposals/          # Proposal management
│   │   ├── detail/         # Proposal detail with PDF generation
│   │   ├── edit/           # Proposal editing
│   │   └── new/            # Proposal creation
│   ├── settings/           # Application settings
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
│   ├── auth/               # Authentication components
│   ├── contacts/           # Contact-specific components
│   │   ├── ContactFormModal.tsx
│   │   └── ContactSelector.tsx
│   ├── layout/             # Layout components (Sidebar, DashboardLayout)
│   ├── proposals/          # Proposal components
│   │   ├── ProposalForm.tsx
│   │   ├── ProposalList.tsx
│   │   ├── ProposalDetail.tsx
│   │   └── ProductQuickCreate.tsx
│   ├── settings/           # Settings-specific components
│   └── Notes.tsx           # Activity/Notes management component
├── contexts/               # React Context providers
│   └── AuthContext.tsx     # Authentication context
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── services/           # Service layer
│   │   ├── companyService.ts
│   │   └── invoiceService.ts
│   ├── firebase.ts         # Firebase configuration
│   └── firebase-services.ts # Firebase service functions
└── types/                  # TypeScript type definitions
    └── index.ts            # All application types
```

## �📦 Installation

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
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init firestore
   
   # Deploy security rules
   firebase deploy --only firestore:rules
   ```

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

## 📱 Usage Guide

### Getting Started

1. **Create an account** - Sign up with email and password
2. **Configure company settings** - Set up your company information
3. **Import or add customers** - Start with your customer base
4. **Add contacts** - Create individual contacts for your customers
5. **Set up products** - Configure your product catalog
6. **Customize deal stages** - Adjust the sales pipeline to match your process
7. **Start managing deals** - Create deals and track them through your pipeline

### Customer Management

- **Add Customers**: Use the "Add Customer" button or import from CSV
- **Customer Details**: Click on any customer to view detailed information
- **Edit Customers**: Update customer information, addresses, and notes
- **Search & Filter**: Use the search bar to quickly find customers

### Contact Management

- **Individual Contacts**: Create contacts for specific people at customer companies
- **Primary Contacts**: Mark key contacts for each customer
- **Contact Association**: Link contacts to customers and deals
- **Contact Search**: Search across names, titles, emails, and departments
- **Social Integration**: Add LinkedIn and Twitter profiles

### Deal Pipeline

- **Create Deals**: Associate deals with customers and contacts
- **Move Deals**: Drag deals between stages or use edit forms
- **Track Progress**: Monitor deal values, probability, and close dates
- **Deal Activities**: Add notes, schedule meetings, and track communications
- **Proposal Integration**: Link proposals to deals for automatic value updates
- **Real-time Values**: Deal totals update automatically when proposals change

### Proposal Management

- **Create Proposals**: Build detailed proposals with line items
- **Add Products**: Select from product catalog or create new products on-the-fly
- **Status Workflow**: Track proposals through draft, sent, viewed, accepted/rejected
- **Generate PDFs**: Create professional PDF proposals with company branding
- **Deal Association**: Link proposals to deals for automatic value calculation
- **Discount & Tax**: Apply percentage discounts and taxes
- **Validity Periods**: Set expiration dates for time-sensitive proposals

### Activity Management

- **Today View**: See all activities due today on the dashboard
- **Activity Types**: Create notes, emails, calls, meetings, and tasks
- **Due Dates**: Set optional due dates for follow-ups
- **Meeting Dates**: Track when meetings happen or are scheduled
- **Completion Tracking**: Mark activities complete and track progress
- **Activity Navigation**: Click activities to edit them in context

### Data Import

- **Customer Import**: Download sample CSV, fill with your data, and upload
- **Deal Import**: Import deals with customer associations
- **Validation**: Get detailed feedback on import errors
- **Sample Files**: Download properly formatted CSV templates

### Settings & Configuration

- **Deal Stages**: Customize your sales pipeline stages
- **Company Info**: Set up company details for invoices
- **Data Management**: Import/export data and manage preferences

## 🎨 Design System

### Brand Colors
- **Primary**: #2E4A62 (Deep Blue) - Headers, primary actions, icons
- **Secondary**: #A38B5C (Gold) - Accents, highlights, value indicators
- **Background**: White (#FFFFFF) with subtle gray borders (#E5E7EB)
- **Text**: Gray-900 for headings, Gray-700 for body, Gray-600 for secondary

### Typography
- **Headings**: Poppins - Used for page titles, card headers, and metrics
- **Body**: PT Sans - Used for labels, descriptions, and content
- **Consistency**: Font families applied via CSS custom properties

### Component Standards
- **Cards**: White background, rounded corners, shadow, border
- **Icons**: 12px colored backgrounds matching brand colors
- **Buttons**: Brand colors with hover states and transitions
- **Forms**: Proper labels, validation, and accessibility
- **Spacing**: Consistent padding and margins throughout

## 🎨 Customization

### Styling
- **Brand Colors**: #2E4A62 (primary), #A38B5C (secondary)
- **Fonts**: Poppins for headings, PT Sans for body text
- **Components**: Consistent design system with cards, borders, shadows
- **Accessibility**: WCAG compliant with proper form labels and autoComplete

### Adding Features
- **New Data Types**: Add interfaces to `src/types/index.ts`
- **Firebase Services**: Extend `src/lib/firebase-services.ts`
- **New Pages**: Create in `src/app/` following App Router patterns
- **Components**: Add reusable components to `src/components/`

## � Security

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Best Practices
- All data is scoped to authenticated users
- Input validation using Zod schemas
- Secure Firebase configuration
- Environment variables for sensitive data

## 🌐 Deployment

### Firebase App Hosting
1. **Install Firebase CLI**: `npm install -g firebase-tools`
2. **Login**: `firebase login`
3. **Initialize**: `firebase init apphosting`
4. **Deploy**: `firebase deploy`

### Static Export
For platforms like Vercel, Netlify, or static hosting:
1. Enable static export in `next.config.js`
2. Run `npm run build`
3. Deploy the `out` folder

## 🧪 Testing

The application includes comprehensive error handling and validation:
- **Form Validation**: Zod schemas for all forms
- **API Error Handling**: Graceful error handling for Firebase operations
- **Loading States**: Proper loading indicators throughout
- **Empty States**: Helpful messages for new users

## 📋 Feature Roadmap

### Completed ✅
- [x] Customer and contact management
- [x] Deal pipeline with customizable stages
- [x] Activity and task tracking
- [x] Product catalog with subscriptions
- [x] Proposal generation with PDF export
- [x] Invoice management with PDF generation
- [x] Automatic deal value calculation from proposals
- [x] Flexible invoice status management
- [x] Real-time proposal-to-deal value updates
- [x] Comprehensive design system implementation
- [x] Form accessibility improvements

### In Progress 🚧
- [ ] Advanced reporting and analytics
- [ ] Email integration for activity tracking
- [ ] Calendar integration for meetings

### Planned 📅
- [ ] Payment processing integration (Square) - [See Integration Plan](./docs/SQUARE_INTEGRATION.md)
- [ ] Team collaboration features
- [ ] Mobile app development
- [ ] API integrations (Calendar, Email providers)
- [ ] Advanced workflow automation
- [ ] Document storage and management
- [ ] Advanced forecasting and projections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper type definitions
- Include error handling
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License.

## 🐛 Issues & Support

If you encounter any issues or have feature requests:
1. Check existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce for bugs
4. Provide use case details for feature requests

## ⭐ Acknowledgments

- Next.js team for the excellent framework
- Firebase for backend infrastructure
- Tailwind CSS for the utility-first styling
- Lucide React for beautiful icons
- The React community for amazing tools and libraries

---

Built with ❤️ using Next.js 14, TypeScript, Tailwind CSS, and Firebase.

**Version**: 0.2.0 | **Last Updated**: October 24, 2025

## 🔄 Recent Updates

### Version 0.2.0 - October 24, 2025
- ✨ **Proposal System**: Complete proposal management with PDF generation
- 🔄 **Automatic Deal Values**: Deal values now automatically calculate from all linked proposals
- 💰 **Real-time Updates**: Values refresh automatically when proposals are created, edited, or deleted
- 🎨 **Design System**: Comprehensive UI standardization with brand colors and typography
- 📧 **Contact Management**: Enhanced contact system with customer and deal associations
- 🧾 **Flexible Invoicing**: Invoice status can now be changed at any time for easy corrections
- ♿ **Accessibility**: Improved form accessibility with proper labels and autoComplete attributes
- 📱 **Responsive Design**: Better mobile and tablet experience across all pages

### Version 0.1.0 - Initial Release
- 🎉 Core CRM functionality with customers, deals, and activities
- 📊 Dashboard with key metrics and today's activities
- 💼 Customizable deal pipeline with drag-and-drop stages
- 📦 Product catalog with subscription support
- 🧾 Basic invoicing system
- 🔐 Firebase authentication and security

````
