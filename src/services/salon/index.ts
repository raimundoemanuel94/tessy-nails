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
      where("active", "==", true),
      orderBy("name")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
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
    await updateDoc(docRef, data);
  },

  /**
   * Desativa (soft delete) um serviço
   */
  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { active: false });
  },

  /**
   * Remove um serviço (hard delete)
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
