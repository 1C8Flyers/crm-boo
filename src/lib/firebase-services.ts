import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, Deal, Product, Invoice, Activity, DealStage, Contact, Proposal, ProposalItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Customer services
export const customerService = {
  async getAll(): Promise<Customer[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Customer[];
  },

  async getById(id: string): Promise<Customer | null> {
    const docSnap = await getDoc(doc(db, 'customers', id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Customer;
    }
    return null;
  },

  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, customerData: Partial<Customer>): Promise<void> {
    const docRef = doc(db, 'customers', id);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'customers', id));
  },
};

// Deal services
export const dealService = {
  async getAll(): Promise<Deal[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'deals'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
    })) as Deal[];
  },

  async getById(id: string): Promise<Deal | null> {
    const docRef = doc(db, 'deals', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      expectedCloseDate: data.expectedCloseDate?.toDate(),
    } as Deal;
  },

  async getByStage(stageId: string): Promise<Deal[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'deals'),
        where('stageId', '==', stageId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
    })) as Deal[];
  },

  async getByCustomer(customerId: string): Promise<Deal[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'deals'),
        where('customerId', '==', customerId)
      )
    );
    const deals = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
    })) as Deal[];
    
    // Sort in memory instead of using Firestore orderBy
    return deals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async create(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'deals'), {
      ...dealData,
      expectedCloseDate: dealData.expectedCloseDate ? Timestamp.fromDate(dealData.expectedCloseDate) : null,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, dealData: Partial<Deal>): Promise<void> {
    const docRef = doc(db, 'deals', id);
    const updateData: any = {
      ...dealData,
      updatedAt: Timestamp.now(),
    };
    
    if (dealData.expectedCloseDate) {
      updateData.expectedCloseDate = Timestamp.fromDate(dealData.expectedCloseDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'deals', id));
  },

  async moveToStage(id: string, newStageId: string): Promise<void> {
    await this.update(id, { stageId: newStageId });
  },

  // Contact-Deal linking methods
  async addContact(dealId: string, contactId: string): Promise<void> {
    const deal = await this.getById(dealId);
    if (!deal) throw new Error('Deal not found');
    
    const contactIds = deal.contactIds || [];
    if (!contactIds.includes(contactId)) {
      contactIds.push(contactId);
      await this.update(dealId, { contactIds });
    }
  },

  async removeContact(dealId: string, contactId: string): Promise<void> {
    const deal = await this.getById(dealId);
    if (!deal) throw new Error('Deal not found');
    
    const contactIds = (deal.contactIds || []).filter(id => id !== contactId);
    await this.update(dealId, { contactIds });
  },

  async setContacts(dealId: string, contactIds: string[]): Promise<void> {
    await this.update(dealId, { contactIds: contactIds.length > 0 ? contactIds : undefined });
  },

  async getByContact(contactId: string): Promise<Deal[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'deals'),
        where('contactIds', 'array-contains', contactId)
      )
    );
    const deals = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
    })) as Deal[];
    
    return deals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Proposal-based value calculations
  async calculateValuesFromProposals(dealId: string): Promise<{
    totalValue: number;
    subscriptionValue: number;
    oneTimeValue: number;
  }> {
    try {
      // Get all accepted proposals for this deal
      const querySnapshot = await getDocs(
        query(
          collection(db, 'proposals'),
          where('dealId', '==', dealId)
        )
      );
      
      let totalValue = 0;
      let subscriptionValue = 0;
      let oneTimeValue = 0;
      
      querySnapshot.docs.forEach(doc => {
        const proposal = doc.data() as Proposal;
        totalValue += proposal.total;
        
        // Calculate subscription vs one-time values from proposal items
        proposal.items.forEach(item => {
          if (item.isSubscription) {
            subscriptionValue += item.total;
          } else {
            oneTimeValue += item.total;
          }
        });
      });
      
      return { totalValue, subscriptionValue, oneTimeValue };
    } catch (error) {
      console.error('Error calculating proposal values:', error);
      return { totalValue: 0, subscriptionValue: 0, oneTimeValue: 0 };
    }
  },

  async updateValuesFromProposals(dealId: string): Promise<void> {
    const values = await this.calculateValuesFromProposals(dealId);
    await this.update(dealId, {
      value: values.totalValue,
      subscriptionValue: values.subscriptionValue,
      oneTimeValue: values.oneTimeValue,
    });
  },
};

// Deal Stages services
export const dealStageService = {
  async getAll(): Promise<DealStage[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'dealStages'), orderBy('order', 'asc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as DealStage[];
  },

  async getById(id: string): Promise<DealStage | null> {
    const docRef = doc(db, 'dealStages', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return {
      ...docSnap.data(),
      id: docSnap.id,
    } as DealStage;
  },

  async create(stageData: Omit<DealStage, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'dealStages'), stageData);
    return docRef.id;
  },

  async update(id: string, stageData: Partial<DealStage>): Promise<void> {
    const docRef = doc(db, 'dealStages', id);
    await updateDoc(docRef, stageData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'dealStages', id));
  },

  async reorder(stages: DealStage[]): Promise<void> {
    const batch = writeBatch(db);
    
    stages.forEach((stage, index) => {
      const stageRef = doc(db, 'dealStages', stage.id);
      batch.update(stageRef, { order: index });
    });
    
    await batch.commit();
  },

  async initializeDefaultStages(): Promise<void> {
    const defaultStages: Omit<DealStage, 'id'>[] = [
      { name: 'Lead', color: '#6B7280', order: 1, isDefault: true },
      { name: 'Qualified', color: '#3B82F6', order: 2, isDefault: true },
      { name: 'Proposal', color: '#F59E0B', order: 3, isDefault: true },
      { name: 'Negotiation', color: '#EF4444', order: 4, isDefault: true },
      { name: 'Closed Won', color: '#10B981', order: 5, isDefault: true },
      { name: 'Closed Lost', color: '#6B7280', order: 6, isDefault: true },
    ];

    for (const stage of defaultStages) {
      await this.create(stage);
    }
  },
};

// Product services
export const productService = {
  async getAll(): Promise<Product[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'products'), orderBy('name', 'asc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Product[];
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, productData: Partial<Product>): Promise<void> {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  },
};

// Invoice services
export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate.toDate(),
    })) as Invoice[];
  },

  async create(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      dueDate: Timestamp.fromDate(invoiceData.dueDate),
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, invoiceData: Partial<Invoice>): Promise<void> {
    const docRef = doc(db, 'invoices', id);
    const updateData: any = {
      ...invoiceData,
      updatedAt: Timestamp.now(),
    };
    
    if (invoiceData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(invoiceData.dueDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'invoices', id));
  },

  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomString = uuidv4().substring(0, 6).toUpperCase();
    return `INV-${year}${month}-${randomString}`;
  },
};

// Activity services
export const activityService = {
  async getByCustomer(customerId: string): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'activities'),
        where('customerId', '==', customerId)
      )
    );
    const activities = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      meetingDate: doc.data().meetingDate?.toDate(),
    })) as Activity[];
    
    // Sort in memory instead of using Firestore orderBy
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getByDeal(dealId: string): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'activities'),
        where('dealId', '==', dealId)
      )
    );
    const activities = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      meetingDate: doc.data().meetingDate?.toDate(),
    })) as Activity[];
    
    // Sort in memory instead of using Firestore orderBy
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async create(activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'activities'), {
      ...activityData,
      dueDate: activityData.dueDate ? Timestamp.fromDate(activityData.dueDate) : null,
      meetingDate: activityData.meetingDate ? Timestamp.fromDate(activityData.meetingDate) : null,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, activityData: Partial<Activity>): Promise<void> {
    const docRef = doc(db, 'activities', id);
    const updateData: any = {
      ...activityData,
      updatedAt: Timestamp.now(),
    };
    
    if (activityData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(activityData.dueDate);
    }

    if (activityData.meetingDate) {
      updateData.meetingDate = Timestamp.fromDate(activityData.meetingDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  async getByCustomerWithDeals(customerId: string): Promise<Activity[]> {
    // Get all deals for this customer first
    const customerDeals = await dealService.getByCustomer(customerId);
    const dealIds = customerDeals.map(deal => deal.id);
    
    // Create queries for activities
    const queries = [
      // Activities directly linked to customer
      query(
        collection(db, 'activities'),
        where('customerId', '==', customerId)
      )
    ];
    
    // Add queries for each deal
    if (dealIds.length > 0) {
      // Firestore 'in' operator can handle up to 10 values
      const chunks = [];
      for (let i = 0; i < dealIds.length; i += 10) {
        chunks.push(dealIds.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        queries.push(
          query(
            collection(db, 'activities'),
            where('dealId', 'in', chunk)
          )
        );
      }
    }
    
    // Execute all queries and combine results
    const allSnapshots = await Promise.all(queries.map(q => getDocs(q)));
    const allActivities: Activity[] = [];
    const seenIds = new Set<string>();
    
    for (const snapshot of allSnapshots) {
      for (const doc of snapshot.docs) {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          allActivities.push({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
            dueDate: doc.data().dueDate?.toDate(),
            meetingDate: doc.data().meetingDate?.toDate(),
          } as Activity);
        }
      }
    }
    
    // Sort by creation date descending in memory
    return allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'activities', id));
  },

  async getTodaysActivities(): Promise<Activity[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Query for activities with meetingDate today
    const meetingsQuery = query(
      collection(db, 'activities'),
      where('meetingDate', '>=', Timestamp.fromDate(startOfDay)),
      where('meetingDate', '<', Timestamp.fromDate(endOfDay))
    );

    // Query for activities with dueDate today
    const dueTodayQuery = query(
      collection(db, 'activities'),
      where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
      where('dueDate', '<', Timestamp.fromDate(endOfDay))
    );

    const [meetingsSnapshot, dueTodaySnapshot] = await Promise.all([
      getDocs(meetingsQuery),
      getDocs(dueTodayQuery)
    ]);

    const todaysActivities: Activity[] = [];
    const seenIds = new Set<string>();

    // Process meetings
    for (const doc of meetingsSnapshot.docs) {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        todaysActivities.push({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
          dueDate: doc.data().dueDate?.toDate(),
          meetingDate: doc.data().meetingDate?.toDate(),
        } as Activity);
      }
    }

    // Process due items
    for (const doc of dueTodaySnapshot.docs) {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        todaysActivities.push({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
          dueDate: doc.data().dueDate?.toDate(),
          meetingDate: doc.data().meetingDate?.toDate(),
        } as Activity);
      }
    }

    return todaysActivities.sort((a, b) => {
      // Sort by meeting date first, then by due date
      if (a.meetingDate && b.meetingDate) {
        return a.meetingDate.getTime() - b.meetingDate.getTime();
      }
      if (a.meetingDate) return -1;
      if (b.meetingDate) return 1;
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  },

  async getOpenItems(): Promise<Activity[]> {
    // Get all activities and filter in memory for more flexibility
    const querySnapshot = await getDocs(collection(db, 'activities'));
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const allActivities = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      meetingDate: doc.data().meetingDate?.toDate(),
    })) as Activity[];

    // Filter for open items:
    // 1. Incomplete tasks
    // 2. Activities with due dates (past or today)
    // 3. Activities with follow-up actions but not completed
    const openItems = allActivities.filter(activity => {
      // Incomplete tasks
      if (activity.type === 'task' && !activity.completed) {
        return true;
      }
      
      // Activities with due dates that are due (today or overdue)
      if (activity.dueDate && activity.dueDate <= today) {
        return true;
      }
      
      // Activities with next actions that aren't completed
      if (activity.nextAction && activity.nextAction.trim() !== '' && !activity.completed) {
        return true;
      }
      
      return false;
    });

    return openItems.sort((a, b) => {
      // Sort by due date, then by priority
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      // Sort by priority if no due dates
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return aPriority - bPriority;
    });
  },

  async markAsComplete(id: string): Promise<void> {
    const docRef = doc(db, 'activities', id);
    await updateDoc(docRef, {
      completed: true,
      updatedAt: Timestamp.now(),
    });
  },

  async getAll(): Promise<Activity[]> {
    const querySnapshot = await getDocs(collection(db, 'activities'));
    const activities = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      meetingDate: doc.data().meetingDate?.toDate(),
    })) as Activity[];
    
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getById(id: string): Promise<Activity | null> {
    const docRef = doc(db, 'activities', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      dueDate: data.dueDate?.toDate(),
      meetingDate: data.meetingDate?.toDate(),
    } as Activity;
  },

  // Contact-Activity linking methods
  async getByContact(contactId: string): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'activities'),
        where('contactIds', 'array-contains', contactId)
      )
    );
    const activities = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      meetingDate: doc.data().meetingDate?.toDate(),
    })) as Activity[];
    
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async addContact(activityId: string, contactId: string): Promise<void> {
    const activity = await this.getById(activityId);
    if (!activity) throw new Error('Activity not found');
    
    const contactIds = activity.contactIds || [];
    if (!contactIds.includes(contactId)) {
      contactIds.push(contactId);
      await this.update(activityId, { contactIds });
    }
  },

  async removeContact(activityId: string, contactId: string): Promise<void> {
    const activity = await this.getById(activityId);
    if (!activity) throw new Error('Activity not found');
    
    const contactIds = (activity.contactIds || []).filter(id => id !== contactId);
    await this.update(activityId, { contactIds: contactIds.length > 0 ? contactIds : undefined });
  },

  async setContacts(activityId: string, contactIds: string[]): Promise<void> {
    await this.update(activityId, { contactIds: contactIds.length > 0 ? contactIds : undefined });
  },
};

// Contact services
export const contactService = {
  async getAll(): Promise<Contact[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'contacts'), orderBy('lastName'), orderBy('firstName'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Contact[];
  },

  async getById(id: string): Promise<Contact | null> {
    const docRef = doc(db, 'contacts', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id,
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate(),
      } as Contact;
    }
    
    return null;
  },

  async getByCustomer(customerId: string): Promise<Contact[]> {
    const q = query(
      collection(db, 'contacts'),
      where('customerId', '==', customerId),
      orderBy('isPrimary', 'desc'),
      orderBy('lastName'),
      orderBy('firstName')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Contact[];
  },

  async getByDeal(dealId: string): Promise<Contact[]> {
    const q = query(
      collection(db, 'contacts'),
      where('dealIds', 'array-contains', dealId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Contact[];
  },

  async create(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'contacts'), {
      ...contactData,
      dealIds: contactData.dealIds || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async update(id: string, contactData: Partial<Contact>): Promise<void> {
    const docRef = doc(db, 'contacts', id);
    await updateDoc(docRef, {
      ...contactData,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'contacts', id));
  },

  async addToDeal(contactId: string, dealId: string): Promise<void> {
    const contact = await this.getById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    const dealIds = contact.dealIds || [];
    if (!dealIds.includes(dealId)) {
      dealIds.push(dealId);
      await this.update(contactId, { dealIds });
    }
  },

  async removeFromDeal(contactId: string, dealId: string): Promise<void> {
    const contact = await this.getById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    const dealIds = (contact.dealIds || []).filter(id => id !== dealId);
    await this.update(contactId, { dealIds });
  },

  async search(searchTerm: string): Promise<Contact[]> {
    const allContacts = await this.getAll();
    const term = searchTerm.toLowerCase();
    
    return allContacts.filter(contact => 
      contact.firstName.toLowerCase().includes(term) ||
      contact.lastName.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term) ||
      (contact.title && contact.title.toLowerCase().includes(term)) ||
      (contact.department && contact.department.toLowerCase().includes(term))
    );
  },

  async setPrimary(contactId: string, customerId: string): Promise<void> {
    // First, remove primary status from all contacts for this customer
    const customerContacts = await this.getByCustomer(customerId);
    const batch = writeBatch(db);
    
    customerContacts.forEach(contact => {
      if (contact.isPrimary) {
        batch.update(doc(db, 'contacts', contact.id), {
          isPrimary: false,
          updatedAt: Timestamp.now(),
        });
      }
    });
    
    // Set the new primary contact
    batch.update(doc(db, 'contacts', contactId), {
      isPrimary: true,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  },

  async addActivity(contactId: string, activityId: string): Promise<void> {
    const contact = await this.getById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    const activityIds = contact.activityIds || [];
    if (!activityIds.includes(activityId)) {
      activityIds.push(activityId);
      await this.update(contactId, { activityIds });
    }
  },

  async removeActivity(contactId: string, activityId: string): Promise<void> {
    const contact = await this.getById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    const activityIds = (contact.activityIds || []).filter(id => id !== activityId);
    await this.update(contactId, { activityIds: activityIds.length > 0 ? activityIds : undefined });
  },
};

// Contact-Deal relationship helper service
export const contactDealService = {
  /**
   * Link a contact to a deal (bidirectional relationship)
   */
  async linkContactToDeal(contactId: string, dealId: string): Promise<void> {
    // Add contact to deal's contactIds
    await dealService.addContact(dealId, contactId);
    
    // Add deal to contact's dealIds
    await contactService.addToDeal(contactId, dealId);
  },

  /**
   * Unlink a contact from a deal (bidirectional relationship)
   */
  async unlinkContactFromDeal(contactId: string, dealId: string): Promise<void> {
    // Remove contact from deal's contactIds
    await dealService.removeContact(dealId, contactId);
    
    // Remove deal from contact's dealIds
    await contactService.removeFromDeal(contactId, dealId);
  },

  /**
   * Set all contacts for a deal (replaces existing contacts)
   */
  async setDealContacts(dealId: string, contactIds: string[]): Promise<void> {
    // Get current deal to see existing contacts
    const deal = await dealService.getById(dealId);
    if (!deal) throw new Error('Deal not found');

    const currentContactIds = deal.contactIds || [];
    
    // Remove dealId from contacts that are no longer associated
    const contactsToRemove = currentContactIds.filter(id => !contactIds.includes(id));
    await Promise.all(contactsToRemove.map(contactId => 
      contactService.removeFromDeal(contactId, dealId)
    ));

    // Add dealId to new contacts
    const contactsToAdd = contactIds.filter(id => !currentContactIds.includes(id));
    await Promise.all(contactsToAdd.map(contactId => 
      contactService.addToDeal(contactId, dealId)
    ));

    // Update deal's contactIds
    await dealService.setContacts(dealId, contactIds);
  },

  /**
   * Set all deals for a contact (replaces existing deals)
   */
  async setContactDeals(contactId: string, dealIds: string[]): Promise<void> {
    // Get current contact to see existing deals
    const contact = await contactService.getById(contactId);
    if (!contact) throw new Error('Contact not found');

    const currentDealIds = contact.dealIds || [];
    
    // Remove contactId from deals that are no longer associated
    const dealsToRemove = currentDealIds.filter(id => !dealIds.includes(id));
    await Promise.all(dealsToRemove.map(dealId => 
      dealService.removeContact(dealId, contactId)
    ));

    // Add contactId to new deals
    const dealsToAdd = dealIds.filter(id => !currentDealIds.includes(id));
    await Promise.all(dealsToAdd.map(dealId => 
      dealService.addContact(dealId, contactId)
    ));

    // Update contact's dealIds
    await contactService.update(contactId, { dealIds: dealIds.length > 0 ? dealIds : undefined });
  },

  /**
   * Get all contacts associated with a deal
   */
  async getDealContacts(dealId: string): Promise<Contact[]> {
    return await contactService.getByDeal(dealId);
  },

  /**
   * Get all deals associated with a contact
   */
  async getContactDeals(contactId: string): Promise<Deal[]> {
    return await dealService.getByContact(contactId);
  },

  /**
   * Bulk link multiple contacts to a deal
   */
  async linkMultipleContactsToDeal(contactIds: string[], dealId: string): Promise<void> {
    await Promise.all(contactIds.map(contactId => 
      this.linkContactToDeal(contactId, dealId)
    ));
  },

  /**
   * Bulk link a contact to multiple deals
   */
  async linkContactToMultipleDeals(contactId: string, dealIds: string[]): Promise<void> {
    await Promise.all(dealIds.map(dealId => 
      this.linkContactToDeal(contactId, dealId)
    ));
  },

  /**
   * Remove all contact-deal relationships for a contact (useful when deleting a contact)
   */
  async removeAllContactRelationships(contactId: string): Promise<void> {
    const deals = await this.getContactDeals(contactId);
    await Promise.all(deals.map(deal => 
      this.unlinkContactFromDeal(contactId, deal.id)
    ));
  },

  /**
   * Remove all contact-deal relationships for a deal (useful when deleting a deal)
   */
  async removeAllDealRelationships(dealId: string): Promise<void> {
    const contacts = await this.getDealContacts(dealId);
    await Promise.all(contacts.map(contact => 
      this.unlinkContactFromDeal(contact.id, dealId)
    ));
  },
};

/**
 * Service for managing contact-activity relationships
 */
export const contactActivityService = {
  /**
   * Link a contact to an activity
   */
  async linkContactToActivity(contactId: string, activityId: string): Promise<void> {
    await Promise.all([
      activityService.addContact(activityId, contactId),
      contactService.addActivity(contactId, activityId)
    ]);
  },

  /**
   * Unlink a contact from an activity
   */
  async unlinkContactFromActivity(contactId: string, activityId: string): Promise<void> {
    await Promise.all([
      activityService.removeContact(activityId, contactId),
      contactService.removeActivity(contactId, activityId)
    ]);
  },

  /**
   * Get all contacts associated with an activity
   */
  async getActivityContacts(activityId: string): Promise<Contact[]> {
    const activity = await activityService.getById(activityId);
    if (!activity || !activity.contactIds || activity.contactIds.length === 0) {
      return [];
    }

    const contacts = await Promise.all(
      activity.contactIds.map(contactId => contactService.getById(contactId))
    );

    return contacts.filter((contact): contact is Contact => contact !== null);
  },

  /**
   * Get all activities associated with a contact
   */
  async getContactActivities(contactId: string): Promise<Activity[]> {
    return activityService.getByContact(contactId);
  },

  /**
   * Set all contacts for an activity (replaces existing relationships)
   */
  async setActivityContacts(activityId: string, contactIds: string[]): Promise<void> {
    // Get current contacts for this activity
    const currentContacts = await this.getActivityContacts(activityId);
    const currentContactIds = currentContacts.map(c => c.id);

    // Remove contacts that are no longer associated
    const contactsToRemove = currentContactIds.filter(id => !contactIds.includes(id));
    await Promise.all(contactsToRemove.map(contactId => 
      this.unlinkContactFromActivity(contactId, activityId)
    ));

    // Add new contacts
    const contactsToAdd = contactIds.filter(id => !currentContactIds.includes(id));
    await Promise.all(contactsToAdd.map(contactId => 
      this.linkContactToActivity(contactId, activityId)
    ));
  },

  /**
   * Remove all contact-activity relationships for an activity (useful when deleting an activity)
   */
  async removeAllActivityRelationships(activityId: string): Promise<void> {
    const contacts = await this.getActivityContacts(activityId);
    await Promise.all(contacts.map(contact => 
      this.unlinkContactFromActivity(contact.id, activityId)
    ));
  },
};

// Proposal services
export const proposalService = {
  // Helper function to remove undefined fields for Firebase
  cleanDataForFirebase(obj: any): any {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  },

  async getAll(): Promise<Proposal[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'proposals'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      validUntil: doc.data().validUntil?.toDate(),
      sentAt: doc.data().sentAt?.toDate(),
      viewedAt: doc.data().viewedAt?.toDate(),
      respondedAt: doc.data().respondedAt?.toDate(),
    })) as Proposal[];
  },

  async getById(id: string): Promise<Proposal | null> {
    const docRef = doc(db, 'proposals', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      validUntil: data.validUntil?.toDate(),
      sentAt: data.sentAt?.toDate(),
      viewedAt: data.viewedAt?.toDate(),
      respondedAt: data.respondedAt?.toDate(),
    } as Proposal;
  },

  async getByCustomer(customerId: string): Promise<Proposal[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'proposals'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      validUntil: doc.data().validUntil?.toDate(),
      sentAt: doc.data().sentAt?.toDate(),
      viewedAt: doc.data().viewedAt?.toDate(),
      respondedAt: doc.data().respondedAt?.toDate(),
    })) as Proposal[];
  },

  async getByDeal(dealId: string): Promise<Proposal[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'proposals'),
        where('dealId', '==', dealId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      validUntil: doc.data().validUntil?.toDate(),
      sentAt: doc.data().sentAt?.toDate(),
      viewedAt: doc.data().viewedAt?.toDate(),
      respondedAt: doc.data().respondedAt?.toDate(),
    })) as Proposal[];
  },

  async create(proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    
    // Clean the data and convert dates
    const cleanedData = this.cleanDataForFirebase({
      ...proposalData,
      validUntil: proposalData.validUntil ? Timestamp.fromDate(proposalData.validUntil) : null,
      sentAt: proposalData.sentAt ? Timestamp.fromDate(proposalData.sentAt) : null,
      viewedAt: proposalData.viewedAt ? Timestamp.fromDate(proposalData.viewedAt) : null,
      respondedAt: proposalData.respondedAt ? Timestamp.fromDate(proposalData.respondedAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    const docRef = await addDoc(collection(db, 'proposals'), cleanedData);
    
    // Update deal values if proposal is linked to a deal
    if (proposalData.dealId) {
      await dealService.updateValuesFromProposals(proposalData.dealId);
    }
    
    return docRef.id;
  },

  async update(id: string, proposalData: Partial<Proposal>): Promise<void> {
    const docRef = doc(db, 'proposals', id);
    
    // Get current proposal to check dealId
    const currentProposal = await this.getById(id);
    
    // Prepare update data with proper date conversion
    const baseUpdateData: any = {
      ...proposalData,
      updatedAt: Timestamp.now(),
    };
    
    if (proposalData.validUntil) {
      baseUpdateData.validUntil = Timestamp.fromDate(proposalData.validUntil);
    }
    if (proposalData.sentAt) {
      baseUpdateData.sentAt = Timestamp.fromDate(proposalData.sentAt);
    }
    if (proposalData.viewedAt) {
      baseUpdateData.viewedAt = Timestamp.fromDate(proposalData.viewedAt);
    }
    if (proposalData.respondedAt) {
      baseUpdateData.respondedAt = Timestamp.fromDate(proposalData.respondedAt);
    }
    
    // Clean the data before updating
    const cleanedUpdateData = this.cleanDataForFirebase(baseUpdateData);
    
    await updateDoc(docRef, cleanedUpdateData);
    
    // Update deal values if proposal is linked to a deal
    const dealId = proposalData.dealId || currentProposal?.dealId;
    if (dealId) {
      await dealService.updateValuesFromProposals(dealId);
    }
  },

  async delete(id: string): Promise<void> {
    // Get the proposal before deleting to check if it has a dealId
    const proposal = await this.getById(id);
    
    await deleteDoc(doc(db, 'proposals', id));
    
    // Update deal values if proposal was linked to a deal
    if (proposal && proposal.dealId) {
      await dealService.updateValuesFromProposals(proposal.dealId);
    }
  },

  // Status management methods
  async markAsSent(id: string): Promise<void> {
    await this.update(id, { 
      status: 'sent', 
      sentAt: new Date() 
    });
  },

  async markAsViewed(id: string): Promise<void> {
    const proposal = await this.getById(id);
    if (proposal && proposal.status === 'sent') {
      await this.update(id, { 
        status: 'viewed', 
        viewedAt: new Date() 
      });
    }
  },

  async markAsAccepted(id: string): Promise<void> {
    // Get the proposal to check if it has a dealId
    const proposal = await this.getById(id);
    
    await this.update(id, { 
      status: 'accepted', 
      respondedAt: new Date() 
    });

    // Update deal values if proposal is linked to a deal
    if (proposal && proposal.dealId) {
      await dealService.updateValuesFromProposals(proposal.dealId);
    }
  },

  async markAsRejected(id: string): Promise<void> {
    // Get the proposal to check if it has a dealId
    const proposal = await this.getById(id);
    
    await this.update(id, { 
      status: 'rejected', 
      respondedAt: new Date() 
    });

    // Update deal values if proposal is linked to a deal (removing this proposal's contribution)
    if (proposal && proposal.dealId) {
      await dealService.updateValuesFromProposals(proposal.dealId);
    }
  },

  // Helper methods for calculations
  calculateSubtotal(items: ProposalItem[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
  },

  calculateTotal(subtotal: number, discountAmount: number = 0, taxAmount: number = 0): number {
    return subtotal - discountAmount + taxAmount;
  },

  calculateDiscountAmount(subtotal: number, discountPercentage: number): number {
    return (subtotal * discountPercentage) / 100;
  },

  calculateTaxAmount(subtotal: number, discountAmount: number, taxPercentage: number): number {
    return ((subtotal - discountAmount) * taxPercentage) / 100;
  },
};