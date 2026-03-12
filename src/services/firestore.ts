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
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment, Client, Service } from "@/types";

// Helper to convert Firestore dates to JS Dates
export const mapDoc = (doc: any) => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date(),
  appointmentDate: doc.data().appointmentDate?.toDate() || null,
});

// Clients Service
export const clientService = {
  getAll: async () => {
    const q = query(collection(db, "clients"), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc) as Client[];
  },
  getById: async (id: string) => {
    const d = await getDoc(doc(db, "clients", id));
    return d.exists() ? mapDoc(d) as Client : null;
  },
  create: async (data: Omit<Client, "id" | "createdAt">) => {
    return addDoc(collection(db, "clients"), {
      ...data,
      createdAt: Timestamp.now(),
    });
  },
};

// Services Service
export const salonService = {
  getAll: async () => {
    const q = query(collection(db, "services"), where("active", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc) as Service[];
  },
  getById: async (id: string) => {
    const d = await getDoc(doc(db, "services", id));
    return d.exists() ? mapDoc(d) as Service : null;
  },
  create: async (data: Omit<Service, "id" | "createdAt">) => {
    return addDoc(collection(db, "services"), {
      ...data,
      createdAt: Timestamp.now(),
    });
  },
};

// Appointments Service
export const appointmentService = {
  getAll: async () => {
    const q = query(collection(db, "appointments"), orderBy("appointmentDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc) as Appointment[];
  },
  getByDateRange: async (start: Date, end: Date) => {
    const q = query(
      collection(db, "appointments"),
      where("appointmentDate", ">=", Timestamp.fromDate(start)),
      where("appointmentDate", "<=", Timestamp.fromDate(end)),
      orderBy("appointmentDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc) as Appointment[];
  },
  create: async (data: Omit<Appointment, "id" | "createdAt">) => {
    return addDoc(collection(db, "appointments"), {
      ...data,
      appointmentDate: Timestamp.fromDate(new Date(data.appointmentDate)),
      createdAt: Timestamp.now(),
    });
  },
  updateStatus: async (id: string, status: Appointment["status"]) => {
    return updateDoc(doc(db, "appointments", id), { status });
  },
};
