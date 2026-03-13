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
import { Service, ServiceSchema } from "@/types";

const COLLECTION_NAME = "services";

export const salonService = {
  /**
   * Lista todos os serviços ativos
   */
  async getAll(): Promise<Service[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("isActive", "==", true),
      orderBy("name")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Service[];
  },

  /**
   * Lista todos os serviços (incluindo inativos)
   */
  async getAllWithInactive(): Promise<Service[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Service[];
  },

  /**
   * Busca um serviço pelo ID
   */
  async getById(id: string): Promise<Service | null> {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) return null;
    return {
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
      updatedAt: d.data().updatedAt?.toDate(),
    } as Service;
  },

  /**
   * Cria um novo serviço
   */
  async create(data: Omit<Service, "id" | "createdAt">): Promise<string> {
    const validatedData = ServiceSchema.parse(data);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...validatedData,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  },

  /**
   * Atualiza um serviço
   */
  async update(id: string, data: Partial<Service>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Desativa (soft delete) um serviço
   */
  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Reativa um serviço
   */
  async activate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      isActive: true,
      updatedAt: Timestamp.now(),
    });
  }
};
