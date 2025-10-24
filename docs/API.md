# API Documentation

## Overview

CRM-BOO uses Firebase Firestore as its backend database with a service layer that provides a clean API for all CRUD operations. All services are located in `src/lib/firebase-services.ts` and follow consistent patterns.

## Service Architecture

### Base Pattern
All services follow this pattern:
- `getAll()` - Retrieve all records for the current user
- `getById(id)` - Retrieve a specific record by ID
- `create(data)` - Create a new record
- `update(id, data)` - Update an existing record
- `delete(id)` - Delete a record

### Authentication
All operations are automatically scoped to the authenticated user. Firestore security rules ensure data isolation between users.

## Customer Service

### `customerService.getAll(): Promise<Customer[]>`
Retrieves all customers for the authenticated user, ordered by creation date (newest first).

### `customerService.getById(id: string): Promise<Customer | null>`
Retrieves a specific customer by ID.

### `customerService.create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
Creates a new customer and returns the generated ID.

**Example:**
```typescript
const customerId = await customerService.create({
  name: "Acme Corp",
  email: "contact@acme.com",
  phone: "555-0123",
  company: "Acme Corporation",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  }
});
```

### `customerService.update(id: string, customerData: Partial<Customer>): Promise<void>`
Updates an existing customer.

### `customerService.delete(id: string): Promise<void>`
Deletes a customer and all associated data.

## Contact Service

### `contactService.getAll(): Promise<Contact[]>`
Retrieves all contacts, ordered by last name, then first name.

### `contactService.getByCustomer(customerId: string): Promise<Contact[]>`
Retrieves all contacts associated with a specific customer, with primary contacts first.

### `contactService.getByDeal(dealId: string): Promise<Contact[]>`
Retrieves all contacts associated with a specific deal.

### `contactService.create(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
Creates a new contact.

**Example:**
```typescript
const contactId = await contactService.create({
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@acme.com",
  phone: "555-0123",
  title: "CEO",
  department: "Executive",
  customerId: "customer-id",
  isPrimary: true
});
```

### `contactService.addToDeal(contactId: string, dealId: string): Promise<void>`
Associates a contact with a deal.

### `contactService.removeFromDeal(contactId: string, dealId: string): Promise<void>`
Removes a contact association from a deal.

### `contactService.setPrimary(contactId: string, customerId: string): Promise<void>`
Sets a contact as the primary contact for a customer (removes primary status from others).

### `contactService.search(searchTerm: string): Promise<Contact[]>`
Searches contacts by name, email, title, or department.

## Deal Service

### `dealService.getAll(): Promise<Deal[]>`
Retrieves all deals, ordered by creation date (newest first).

### `dealService.getByStage(stageId: string): Promise<Deal[]>`
Retrieves all deals in a specific stage.

### `dealService.create(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
Creates a new deal.

**Example:**
```typescript
const dealId = await dealService.create({
  title: "Q4 Software License",
  description: "Annual renewal",
  value: 25000,
  customerId: "customer-id",
  stageId: "stage-id",
  probability: 75,
  expectedCloseDate: new Date('2025-12-31')
});
```

### `dealService.update(id: string, dealData: Partial<Deal>): Promise<void>`
Updates an existing deal.

### `dealService.delete(id: string): Promise<void>`
Deletes a deal and associated data.

### `dealService.addProduct(dealId: string, product: DealProduct): Promise<void>`
Adds a product to a deal.

### `dealService.removeProduct(dealId: string, productId: string): Promise<void>`
Removes a product from a deal.

## Deal Stage Service

### `dealStageService.getAll(): Promise<DealStage[]>`
Retrieves all deal stages, ordered by their order property.

### `dealStageService.create(stageData: Omit<DealStage, 'id'>): Promise<string>`
Creates a new deal stage.

### `dealStageService.reorder(stages: DealStage[]): Promise<void>`
Updates the order of multiple stages in a batch operation.

### `dealStageService.initializeDefaultStages(): Promise<void>`
Creates default deal stages for new users:
- Lead (blue)
- Qualified (green)
- Proposal (yellow)
- Negotiation (orange)
- Closed Won (green)
- Closed Lost (red)

## Product Service

### `productService.getAll(): Promise<Product[]>`
Retrieves all products, ordered by creation date.

### `productService.getActive(): Promise<Product[]>`
Retrieves only active products.

### `productService.create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
Creates a new product.

**Example:**
```typescript
const productId = await productService.create({
  name: "CRM Software License",
  description: "Annual software license",
  price: 1200,
  isSubscription: true,
  subscriptionInterval: "yearly",
  isActive: true
});
```

## Activity Service

### `activityService.getAll(): Promise<Activity[]>`
Retrieves all activities, ordered by creation date (newest first).

### `activityService.getByCustomer(customerId: string): Promise<Activity[]>`
Retrieves activities for a specific customer.

### `activityService.getByDeal(dealId: string): Promise<Activity[]>`
Retrieves activities for a specific deal.

### `activityService.getTodaysActivities(): Promise<Activity[]>`
Retrieves activities due today (meetings and follow-ups).

### `activityService.getOpenItems(): Promise<Activity[]>`
Retrieves incomplete activities, sorted by priority and due date.

### `activityService.create(activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
Creates a new activity.

**Example:**
```typescript
const activityId = await activityService.create({
  type: "meeting",
  title: "Product Demo",
  description: "Demonstrate CRM features",
  customerId: "customer-id",
  dealId: "deal-id",
  completed: false,
  dueDate: new Date('2025-10-25'),
  meetingDate: new Date('2025-10-25T14:00:00'),
  duration: 60
});
```

### `activityService.markAsComplete(id: string): Promise<void>`
Marks an activity as completed.

## Invoice Service

### `invoiceService.getAll(): Promise<Invoice[]>`
Retrieves all invoices, ordered by creation date.

### `invoiceService.getByCustomer(customerId: string): Promise<Invoice[]>`
Retrieves invoices for a specific customer.

### `invoiceService.create(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
Creates a new invoice.

**Example:**
```typescript
const invoiceId = await invoiceService.create({
  invoiceNumber: "INV-001",
  customerId: "customer-id",
  dealId: "deal-id",
  items: [
    {
      id: "item-1",
      productId: "product-id",
      productName: "CRM License",
      quantity: 1,
      price: 1200,
      total: 1200
    }
  ],
  subtotal: 1200,
  tax: 120,
  total: 1320,
  status: "draft",
  dueDate: new Date('2025-11-25')
});
```

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const customer = await customerService.getById(customerId);
  // Handle success
} catch (error) {
  console.error('Error fetching customer:', error);
  // Handle error
}
```

## Data Validation

All create and update operations use Zod schemas for validation:
- Type safety at compile time
- Runtime validation
- Consistent error messages
- Form integration with React Hook Form

## Firestore Collections

The following collections are used:
- `customers` - Customer records
- `contacts` - Contact records
- `deals` - Deal records
- `dealStages` - Deal stage definitions
- `products` - Product catalog
- `activities` - Activity and task records
- `invoices` - Invoice records

## Security Rules

All data is scoped to the authenticated user:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Performance Considerations

- All queries include proper indexing
- Pagination can be added for large datasets
- Real-time listeners are used sparingly
- Batch operations for bulk updates
- Efficient query patterns to minimize reads