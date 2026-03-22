import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Client, Service, Appointment, Sale, Report } from "@/types";

// Helper to convert Firestore dates to JS Dates
export const mapDoc = (doc: any) => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date(),
  appointmentDate: doc.data().appointmentDate?.toDate() || null,
});

// Generic CRUD operations
export class FirestoreService<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getAll(): Promise<T[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  }

  async create(data: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...data,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...data } as T;
  }

  async update(id: string, data: Partial<T>): Promise<boolean> {
    const docRef = doc(db, this.collectionName, id);
    try {
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    const docRef = doc(db, this.collectionName, id);
    try {
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      return false;
    }
  }

  async query(conditions: any[] = [], orderByField?: string, limitCount?: number): Promise<T[]> {
    let q: any = collection(db, this.collectionName);
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      q = query(q, where(condition[0], condition[1], condition[2]));
    }

    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as T);
  }
}

// Specific services
export const userService = new FirestoreService<User>('users');
export const clientService = new FirestoreService<Client>('clients');
export const serviceService = new FirestoreService<Service>('services');
export const appointmentService = new FirestoreService<Appointment>('appointments');
export const saleService = new FirestoreService<Sale>('sales');
export const reportService = new FirestoreService<Report>('reports');

// Legacy services removed to prevent code duplication

// Specialized queries
export const clientQueries = {
  getByEmail: async (email: string): Promise<Client | null> => {
    const conditions = [['email', '==', email]];
    const clients = await clientService.query(conditions);
    return clients.length > 0 ? clients[0] : null;
  },

  getActiveClients: async (): Promise<Client[]> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const conditions = [['lastVisit', '>=', thirtyDaysAgo]];
    return await clientService.query(conditions, 'lastVisit', 50);
  }
};

export const appointmentQueries = {
  getByClient: async (clientId: string): Promise<Appointment[]> => {
    const conditions = [['clientId', '==', clientId]];
    return await appointmentService.query(conditions, 'appointmentDate');
  },

  getBySpecialist: async (specialistId: string): Promise<Appointment[]> => {
    const conditions = [['specialistId', '==', specialistId]];
    return await appointmentService.query(conditions, 'appointmentDate');
  },

  getByDateRange: async (startDate: Date, endDate: Date): Promise<Appointment[]> => {
    const conditions = [
      ['appointmentDate', '>=', startDate],
      ['appointmentDate', '<=', endDate]
    ];
    return await appointmentService.query(conditions, 'appointmentDate');
  },

  getUpcoming: async (): Promise<Appointment[]> => {
    const now = new Date();
    const conditions = [['appointmentDate', '>=', now]];
    return await appointmentService.query(conditions, 'appointmentDate');
  },

  getStatusCount: async (status: string): Promise<number> => {
    const conditions = [['status', '==', status]];
    const appointments = await appointmentService.query(conditions);
    return appointments.length;
  }
};

export const serviceQueries = {
  getActive: async (): Promise<Service[]> => {
    const conditions = [['active', '==', true]];
    return await serviceService.query(conditions, 'name');
  },

  getByCategory: async (category: string): Promise<Service[]> => {
    const conditions = [['category', '==', category]];
    return await serviceService.query(conditions, 'name');
  }
};

export const saleQueries = {
  getByAppointment: async (appointmentId: string): Promise<Sale | null> => {
    const conditions = [['appointmentId', '==', appointmentId]];
    const sales = await saleService.query(conditions);
    return sales.length > 0 ? sales[0] : null;
  },

  getByDateRange: async (startDate: Date, endDate: Date): Promise<Sale[]> => {
    const conditions = [
      ['createdAt', '>=', startDate],
      ['createdAt', '<=', endDate]
    ];
    return await saleService.query(conditions, 'createdAt');
  },

  getMonthlyRevenue: async (year: number, month: number): Promise<number> => {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    const startDate = new Date(year, month - 1, 1);
    const conditions = [['createdAt', '>=', startDate]];
    const sales = await saleService.query(conditions, 'createdAt');
    return sales.reduce((total, sale) => total + sale.amount, 0);
  }
};

export default {
  userService,
  clientService,
  serviceService,
  appointmentService,
  saleService,
  reportService,
  clientQueries,
  appointmentQueries,
  serviceQueries,
  saleQueries
};
