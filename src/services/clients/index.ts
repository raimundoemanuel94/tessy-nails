import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Client, ClientSchema } from "@/types";

const COLLECTION_NAME = "clients";

export const clientService = {
  /**
   * Lista todas as clientes ordenadas por nome
   */
  async getAll(): Promise<Client[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      active: doc.data().active !== false, // Default to true if not set
      createdAt: doc.data().createdAt?.toDate(),
    })) as Client[];
  },

  /**
   * Busca uma cliente pelo ID
   */
  async getById(id: string): Promise<Client | null> {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) return null;
    return {
      id: d.id,
      ...d.data(),
      active: d.data().active !== false, // Default to true if not set
      createdAt: d.data().createdAt?.toDate(),
    } as Client;
  },

  /**
   * Cadastra uma nova cliente com validação
   */
  async create(data: Omit<Client, "id" | "createdAt">): Promise<string> {
    // Validação com Zod
    const validatedData = ClientSchema.parse(data);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...validatedData,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  },

  /**
   * Atualiza dados de uma cliente
   */
  async update(id: string, data: Partial<Client>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  /**
   * Remove uma cliente
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  }
};
