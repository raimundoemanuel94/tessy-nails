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
    const q = query(collection(db, COLLECTION_NAME), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      lastVisit: doc.data().lastVisit?.toDate(),
    })) as Client[];
  },

  /**
   * Busca uma cliente pelo ID (Firebase Auth UID)
   */
  async getById(id: string): Promise<Client | null> {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) return null;
    return {
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
      updatedAt: d.data().updatedAt?.toDate(),
      lastVisit: d.data().lastVisit?.toDate(),
    } as Client;
  },

  /**
   * Cria um novo cliente
   * Schema de entrada não exige id e createdAt; id vem do doc ref e createdAt é gerado aqui.
   */
  async create(data: Omit<Client, "id" | "createdAt">): Promise<string> {
    const validatedData = ClientSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(data);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...validatedData,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
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
  }
};
