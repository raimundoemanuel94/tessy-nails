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
  where,
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Client, ClientSchema } from "@/types";

const COLLECTION_NAME = "clients";

export const clientService = {
  /**
   * Lista todas as clientes ordenadas por nome
   */
  async getAll(): Promise<Client[]> {
    try {
      // ✅ Buscar todos e ordenar no client side para evitar problemas de índice
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const clients = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
          lastVisit: data.lastVisit?.toDate ? data.lastVisit.toDate() : (data.lastVisit ? new Date(data.lastVisit) : undefined),
        };
      }) as Client[];
      
      return clients.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
      console.error("❌ Erro ao buscar clientes:", error);
      return [];
    }
  },

  /**
   * Busca uma cliente pelo ID (Firebase Auth UID)
   */
  async getById(id: string): Promise<Client | null> {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) return null;
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : (data?.createdAt ? new Date(data.createdAt) : new Date()),
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : (data?.updatedAt ? new Date(data.updatedAt) : undefined),
      lastVisit: data?.lastVisit?.toDate ? data.lastVisit.toDate() : (data?.lastVisit ? new Date(data.lastVisit) : undefined),
    } as Client;
  },

  /**
   * Cria um novo cliente
   * Schema de entrada não exige id e createdAt; id vem do doc ref e createdAt é gerado aqui.
   */
  async create(data: Omit<Client, "id" | "createdAt">): Promise<string> {
    try {
      const { id, ...toValidate } = data as any;
      const validatedData = ClientSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(toValidate);

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...validatedData,
        createdAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error: any) {
      console.error("❌ Erro ao criar cliente no clientService:", error);
      if (error.code === 'permission-denied') {
        throw new Error("Permissão negada no Firebase para criar clientes.");
      }
      throw error;
    }
  },

  /**
   * Atualiza um cliente
   */
  async update(id: string, data: Partial<Client>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Atualiza o contador de agendamentos do cliente
   */
  async incrementAppointments(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      totalAppointments: increment(1),
      lastVisit: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Desativa (soft delete) um cliente
   */
  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Exclui permanentemente um cliente do Firestore
   */
  async hardDelete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
