# Square Payment Integration Plan

**Status**: Planned for Future Implementation  
**Target Version**: 0.3.0+  
**Last Updated**: October 24, 2025

## Overview

This document outlines the plan for integrating Square payment processing into CRM-BOO, with a focus on multi-tenancy support where each company can connect their own Square account.

## Architecture

### Multi-Tenant Design

Each company in the CRM will have their own Square account connection, ensuring:
- **Data isolation**: Each tenant's payment data remains separate
- **Independent processing**: Companies use their own Square merchant accounts
- **Flexible configuration**: Different companies can have different settings
- **Security**: Payment tokens scoped per company

### Data Model

#### Firestore Collection Structure

```typescript
// Collection: /companies/{companyId}/paymentConfig
interface PaymentConfig {
  id: string;
  companyId: string;
  provider: 'square' | 'stripe' | 'paypal'; // Extensible for future providers
  isActive: boolean;
  
  // Square-specific configuration
  square?: {
    applicationId: string;        // Public - safe to store
    accessToken: string;           // Secret - encrypted server-side
    locationId: string;            // Selected Square location
    environment: 'sandbox' | 'production';
    webhookSignatureKey?: string;  // For verifying webhook authenticity
  };
  
  // Metadata
  connectedAt: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Enhanced Invoice Model

```typescript
interface Invoice {
  // ... existing fields ...
  
  // Payment tracking
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProvider?: 'square' | 'stripe' | 'paypal';
  paymentTransactionId?: string;
  paymentDate?: Date;
  paymentMethod?: string; // e.g., "Visa **** 4242"
  refundTransactionId?: string;
  refundDate?: Date;
  refundAmount?: number;
}
```

#### Payment Transaction Log

```typescript
// Collection: /companies/{companyId}/paymentTransactions
interface PaymentTransaction {
  id: string;
  companyId: string;
  invoiceId: string;
  customerId: string;
  
  // Transaction details
  provider: 'square';
  transactionId: string;        // Square payment ID
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  
  // Payment method
  paymentMethod: string;        // e.g., "card", "cash"
  cardBrand?: string;           // e.g., "VISA", "MASTERCARD"
  lastFourDigits?: string;      // Last 4 digits of card
  
  // Timestamps
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  
  // Error handling
  errorCode?: string;
  errorMessage?: string;
  
  // Audit
  createdBy: string;            // User ID
  metadata?: Record<string, any>;
}
```

## Square Developer Setup

### 1. Create Square Developer Account
- Navigate to: https://developer.squareup.com/
- Sign up with Square account (or create new)
- Access Developer Dashboard

### 2. Create Application
- Click "Create Application"
- Name: "CRM-BOO Payment Integration"
- Receive credentials for:
  - **Sandbox** (testing)
  - **Production** (live payments)

### 3. Credentials Required

#### Application ID (Public)
- Safe to use client-side
- Used to initialize Square Web SDK
- Example: `sq0idp-wGVapF8sNt9PLrdj5znuKA`

#### Access Token (Secret - Critical!)
- **Never expose client-side**
- Store encrypted server-side (Firebase Functions)
- Used for API calls (payments, refunds, etc.)
- Must be kept secure

#### Location ID
- Square merchants can have multiple locations
- Each location can process payments independently
- User selects which location to use during setup

### 4. OAuth Configuration (Recommended)

**Benefits:**
- Secure token exchange without manual handling
- Automatic token refresh
- User authenticates directly with Square
- Revocable access
- Better compliance

**Setup Steps:**
1. In Square Dashboard → Application → OAuth
2. Set **Redirect URL**: `https://crm-boo-prod.web.app/api/square/callback`
   - This will be a Firebase Function endpoint
3. Request **OAuth Scopes**:
   - `PAYMENTS_READ` - View payment information
   - `PAYMENTS_WRITE` - Process payments and refunds
   - `MERCHANT_PROFILE_READ` - Get merchant/location info
   - `ORDERS_READ` / `ORDERS_WRITE` - Optional: For order management

### 5. Webhook Configuration

**Purpose:** Real-time payment status updates

**Setup:**
1. Go to Application → Webhooks
2. Set **Notification URL**: `https://crm-boo-prod.web.app/api/square/webhook`
   - Another Firebase Function endpoint
3. Subscribe to events:
   - `payment.created`
   - `payment.updated`
   - `refund.created`
   - `refund.updated`
4. Save the **Webhook Signature Key** (for verification)

### 6. Testing Environment

**Sandbox Features:**
- No real money involved
- Test credit cards provided by Square:
  - **Success**: `4111 1111 1111 1111`
  - **Decline**: `4000 0000 0000 0002`
  - **CVV**: Any 3 digits
  - **Expiry**: Any future date
- Sandbox Dashboard to view test transactions
- Full API feature parity with production

### 7. Production Checklist

Before going live:
- [ ] Complete Square account verification
- [ ] Enable Production application access
- [ ] Set up bank account for payouts
- [ ] Review Square's pricing structure
- [ ] Test OAuth flow end-to-end in sandbox
- [ ] Verify webhook delivery and signature validation
- [ ] Set up error monitoring for failed payments
- [ ] Create runbook for handling payment issues

## Implementation Phases

### Phase 1: Settings UI & OAuth (Foundation)

**Goal:** Allow users to connect their Square account

**Components:**
- Add "Payment Processing" tab to Settings page
- Implement Square OAuth connection flow
- Display connection status and location info
- Store encrypted config in Firestore

**User Flow:**
1. User clicks "Connect Square" button
2. Redirects to Square OAuth authorization
3. User approves access to their Square account
4. Square redirects back with authorization code
5. Firebase Function exchanges code for access token
6. Fetch locations from Square API
7. User selects location for payments
8. Store encrypted config in Firestore
9. Display "Connected ✓" status

**Technical Requirements:**
- Firebase Functions for OAuth callback
- Secure token storage with encryption
- Location selection UI
- Error handling for failed connections

### Phase 2: Invoice Integration

**Goal:** Add payment functionality to invoices

**Features:**
- "Pay Now" button on invoice detail pages
- Square checkout integration
- Payment status tracking
- Transaction history

**User Flow:**
1. Customer receives invoice
2. Clicks "Pay Now" button
3. Redirects to Square-hosted checkout page
4. Enters payment details on Square's secure page
5. Completes payment
6. Redirects back to CRM with payment confirmation
7. Invoice automatically marked as "paid"

**Technical Requirements:**
- Square Checkout API integration
- Invoice payment status field
- Payment transaction logging
- Success/failure handling

### Phase 3: Webhooks & Automation (Production-Ready)

**Goal:** Real-time payment updates and automation

**Features:**
- Automatic invoice status updates
- Payment failure notifications
- Refund handling
- Payment reconciliation

**Webhook Events:**
- `payment.created` - Log new payment attempt
- `payment.updated` - Update payment status
- `refund.created` - Log refund request
- `refund.updated` - Update refund status

**Technical Requirements:**
- Firebase Function webhook endpoint
- Signature verification for security
- Idempotent webhook processing (handle duplicates)
- Error handling and retry logic

### Phase 4: Multi-Provider Support (Future)

**Goal:** Support multiple payment providers

**Providers:**
- Square (initial)
- Stripe (popular alternative)
- PayPal (widely used)

**Architecture:**
- Abstract payment interface
- Provider-specific adapters
- Unified transaction logging
- Consistent UI across providers

## Service Layer Architecture

### Payment Service (Client-Side Interface)

```typescript
// src/lib/services/paymentService.ts

export const paymentService = {
  // Configuration Management
  async getConfig(companyId: string): Promise<PaymentConfig | null> {
    // Fetch payment configuration for company
  },
  
  async saveConfig(companyId: string, config: PaymentConfig): Promise<void> {
    // Save encrypted payment configuration
  },
  
  async disconnect(companyId: string): Promise<void> {
    // Remove payment provider connection
  },
  
  // Payment Operations (calls Firebase Functions)
  async createPaymentLink(invoiceId: string): Promise<string> {
    // Generate Square checkout URL
  },
  
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // Check payment status
  },
  
  async refundPayment(transactionId: string, amount?: number): Promise<Refund> {
    // Process full or partial refund
  },
  
  // Transaction History
  async getTransactions(companyId: string, filters?: TransactionFilters): Promise<PaymentTransaction[]> {
    // Fetch payment transaction history
  }
};
```

### Firebase Functions (Server-Side)

```typescript
// functions/src/square/index.ts

// OAuth Flow
export const squareOAuthCallback = functions.https.onRequest(async (req, res) => {
  // 1. Extract authorization code from query params
  // 2. Exchange code for access token (server-to-server)
  // 3. Fetch merchant locations
  // 4. Encrypt and store tokens in Firestore
  // 5. Redirect user back to settings page
});

// Payment Processing
export const createSquarePayment = functions.https.onCall(async (data, context) => {
  // 1. Verify user authentication
  // 2. Fetch company payment config
  // 3. Decrypt access token
  // 4. Call Square Payments API
  // 5. Log transaction
  // 6. Update invoice status
  // 7. Return payment result
});

// Webhook Handler
export const squareWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify webhook signature
  // 2. Parse webhook payload
  // 3. Handle event type (payment.created, payment.updated, etc.)
  // 4. Update invoice status
  // 5. Log transaction update
  // 6. Send notifications if needed
  // 7. Return 200 OK (acknowledge receipt)
});

// Refund Processing
export const refundSquarePayment = functions.https.onCall(async (data, context) => {
  // 1. Verify user permissions
  // 2. Fetch original payment
  // 3. Call Square Refunds API
  // 4. Update invoice and transaction records
  // 5. Return refund result
});
```

## Security Considerations

### Token Security
- **Never store access tokens in browser/client-side**
- Use Firebase Functions as secure middleware
- Encrypt tokens at rest in Firestore
- Use environment variables for webhook keys

### Multi-Tenancy Isolation
- **Company-level scoping**: All payment operations check `companyId` match
- **User permissions**: Only admins can configure payment settings
- **Data isolation**: Each tenant's payment data completely separate
- **Audit trail**: Log all payment operations with user ID + timestamp

### Webhook Verification
```typescript
// Verify Square webhook signature
function verifyWebhookSignature(payload: string, signature: string, signatureKey: string): boolean {
  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(payload);
  const hash = hmac.digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
}
```

### PCI Compliance
- **Never handle raw card data**: Use Square's hosted checkout
- **Tokenization**: Square handles card tokenization
- **Secure transmission**: All API calls over HTTPS
- **Minimal data storage**: Only store transaction IDs and metadata

## UI Components

### Settings Page - Payment Processing Tab

Located in: `src/app/settings/page.tsx` (new tab)

**Components:**
- Provider selection (Square initially, expandable)
- Connection status indicator
- OAuth "Connect Square" button
- Location selector (after connection)
- Environment toggle (Sandbox/Production)
- Disconnect button
- Transaction summary metrics

**Design:**
```
┌─────────────────────────────────────────────┐
│ Payment Processing                          │
├─────────────────────────────────────────────┤
│                                             │
│  Square Payment Processing                  │
│  ○ Not Connected                            │
│                                             │
│  Connect your Square account to accept      │
│  payments on invoices.                      │
│                                             │
│  [Connect Square Account]                   │
│                                             │
│  or when connected:                         │
│                                             │
│  ● Connected                                │
│  Location: Main Street Store                │
│  Environment: Production                    │
│  Connected: Oct 24, 2025                    │
│                                             │
│  [Change Location] [Disconnect]             │
│                                             │
└─────────────────────────────────────────────┘
```

### Invoice Detail - Payment Section

Add to: `src/app/invoices/detail/page.tsx`

**When Not Paid:**
```
┌─────────────────────────────────────────────┐
│ Payment                                     │
├─────────────────────────────────────────────┤
│  Status: Unpaid                             │
│  Amount Due: $1,250.00                      │
│                                             │
│  [Pay Now with Square] [Mark as Paid]       │
└─────────────────────────────────────────────┘
```

**When Paid:**
```
┌─────────────────────────────────────────────┐
│ Payment                                     │
├─────────────────────────────────────────────┤
│  Status: ✓ Paid                             │
│  Amount: $1,250.00                          │
│  Method: Visa **** 4242                     │
│  Date: Oct 24, 2025 3:45 PM                │
│  Transaction ID: txn_abc123                 │
│                                             │
│  [View Receipt] [Issue Refund]              │
└─────────────────────────────────────────────┘
```

## API Rate Limits

Square enforces rate limits to ensure fair usage:

- **General APIs**: 10 requests/second per access token
- **Payments API**: 10 requests/second
- **Burst allowance**: Short bursts above limit tolerated
- **Webhook retries**: Exponential backoff (1min, 5min, 30min, 2hr, 24hr)

**Handling Rate Limits:**
- Implement exponential backoff for retries
- Cache frequently accessed data (locations, merchant info)
- Batch operations when possible
- Monitor rate limit headers in responses

## Pricing Structure

### Square Fees (Card Not Present - Online Payments)
- **Per Transaction**: 2.9% + $0.30
- **No monthly fees** for basic integration
- **No setup fees**
- **No hidden fees**

### Example Calculation
- Invoice Amount: $1,000.00
- Square Fee: ($1,000.00 × 0.029) + $0.30 = $29.30
- Company Receives: $970.70

**Note:** Fees are deducted automatically by Square before payout.

## Error Handling

### Common Error Scenarios

1. **Invalid Access Token**
   - Show "Reconnect Square" prompt
   - Trigger OAuth re-authorization

2. **Card Declined**
   - Display user-friendly error message
   - Suggest trying different payment method
   - Log attempt for tracking

3. **Network Failure**
   - Implement retry logic with exponential backoff
   - Show "Please try again" message
   - Don't automatically retry failed payments (avoid duplicate charges)

4. **Webhook Failure**
   - Square automatically retries with backoff
   - Log failed webhook attempts
   - Manual reconciliation UI for admins

5. **Insufficient Funds**
   - Clear error message to customer
   - Option to pay later
   - Notification to invoice owner

### Error Logging
```typescript
interface PaymentError {
  code: string;           // Square error code
  message: string;        // User-friendly message
  details?: any;          // Technical details for debugging
  timestamp: Date;
  userId: string;
  invoiceId: string;
  attemptNumber: number;
}
```

## Testing Strategy

### Unit Tests
- Payment service functions
- Data validation
- Error handling
- Webhook signature verification

### Integration Tests
- OAuth flow (sandbox)
- Payment creation (test cards)
- Refund processing
- Webhook event handling

### End-to-End Tests
- Complete payment flow from invoice to confirmation
- Failed payment handling
- Refund process
- Disconnect and reconnect flows

### Manual Testing Checklist
- [ ] Connect Square account via OAuth
- [ ] Create payment for invoice
- [ ] Process successful payment with test card
- [ ] Process declined payment with test card
- [ ] Verify invoice status updates
- [ ] Test refund process
- [ ] Verify webhook delivery
- [ ] Test disconnect and reconnect
- [ ] Validate error messages
- [ ] Check transaction logging

## Monitoring & Analytics

### Key Metrics to Track
- Payment success rate
- Average payment processing time
- Failed payment reasons
- Refund frequency
- OAuth connection failures
- Webhook delivery success rate
- API error rates

### Alerting
- Critical: Payment processing failures
- Warning: High decline rate
- Info: New Square connection
- Monitor: API rate limit approaching

## Future Enhancements

### Phase 5+: Advanced Features
- **Recurring Payments**: Automatic billing for subscriptions
- **Payment Plans**: Installment payment options
- **Multi-Currency**: Support for international payments
- **Saved Payment Methods**: Customer saved cards
- **Split Payments**: Partial payments on invoices
- **Payment Reminders**: Automated email reminders for unpaid invoices
- **Reporting Dashboard**: Payment analytics and insights
- **Tax Reporting**: Automated tax calculation and reporting

### Additional Provider Integrations
- **Stripe**: Popular alternative to Square
- **PayPal**: Widely adopted online payment
- **ACH/Bank Transfer**: Lower-cost option for large invoices
- **Apple Pay / Google Pay**: Mobile-optimized payments

## References

### Square Documentation
- **Developer Portal**: https://developer.squareup.com/
- **OAuth Guide**: https://developer.squareup.com/docs/oauth-api/overview
- **Payments API**: https://developer.squareup.com/docs/payments-api/overview
- **Webhooks**: https://developer.squareup.com/docs/webhooks/overview
- **Sandbox Testing**: https://developer.squareup.com/docs/testing/test-values

### Internal Documentation
- [API Documentation](./API.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Questions & Feedback

For questions about this integration plan, please contact the development team or open a GitHub issue with the label `payment-integration`.

---

**Document Version**: 1.0  
**Status**: Planning Phase  
**Target Release**: Version 0.3.0+  
**Last Updated**: October 24, 2025
