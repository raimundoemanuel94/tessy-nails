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
  increment,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Client, ClientSchema } from "@/types";

const COLLECTION_NAME = "clients";

export const clientService = {
  collectionName: COLLECTION_NAME,
  collectionRef: collection(db, COLLECTION_NAME),
  /**
   * Lista todas as clientes ordenadas por nome
   // Pegar todos - LEGADO, não recomendado para uso em prod
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
   * ✅ OTIMIZAÇÃO: Busca paginada para clientes (Mobile Native Feel)
   */
  async getPaginated(pageSize: number = 20, lastDoc?: QueryDocumentSnapshot<DocumentData>): Promise<{ clients: Client[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy("name", "asc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, COLLECTION_NAME),
          orderBy("name", "asc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const clients = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          lastVisit: data.lastVisit?.toDate ? data.lastVisit.toDate() : undefined,
        };
      }) as Client[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { clients, lastVisible };
    } catch (error) {
      console.error("❌ Erro ao buscar clientes paginados:", error);
      return { clients: [], lastVisible: null };
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
   * Busca uma cliente pelo telefone
   */
  async getByPhone(phone: string): Promise<Client | null> {
    try {
      const sanitizedPhone = phone.replace(/\D/g, "");
      if (!sanitizedPhone) return null;

      const q = query(
        collection(db, COLLECTION_NAME),
        where("phone", "==", sanitizedPhone)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Client;
    } catch (error) {
      console.error("❌ Erro ao buscar cliente por telefone:", error);
      return null;
    }
  },

  /**
   * Cria um novo cliente
   * Schema de entrada não exige id e createdAt; id vem do doc ref e createdAt é gerado aqui.
   */
  async create(data: Omit<Client, "id" | "createdAt">): Promise<string> {
    try {
      const { id, ...toValidate } = data as typeof data & { id?: string };
      const validatedData = ClientSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(toValidate);

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...validatedData,
        createdAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("❌ Erro ao criar cliente no clientService:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "permission-denied"
      ) {
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
   // Deletar Permanentemente (Hard Delete)
   */
  async hardDelete(id: string): Promise<void> {
    if (!id) throw new Error('ID do cliente não fornecido for hardDelete');

    // Deleta o documento físico do Firestore
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  },

  // Busca prefixada de Clientes (Search by Name)
  async searchByName(queryText: string, searchLimit: number = 10): Promise<Client[]> {
    if (!queryText || queryText.trim() === '') return [];

    try {
      // Como o Firestore no Firebase não suporta LIKE %query%,
      // Usamos a técnica de prefix match (onde name começa com X)
      // Nota: requer que o nome salvo e a busca tenham o mesmo case,
      // mas na prática, é a forma oficial de contornar busca.
      // E orderBy("createdAt") seria conflitante com where("name", ">=").
      // Então só ordenamos por "name".

      const searchTerm = queryText.trim(); // Idealmente tudo deveria ser salvo uppercase se quiséssemos case-insensitive, mas ok. // Em ambiente real, usar algo como Algolia ou lowercase fields.
      const q = query(
        this.collectionRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()),
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : (doc.data().updatedAt ? new Date(doc.data().updatedAt) : undefined),
        lastVisit: doc.data().lastVisit?.toDate ? doc.data().lastVisit.toDate() : (doc.data().lastVisit ? new Date(doc.data().lastVisit) : undefined),
      })) as Client[];

      return clients;
    } catch (error) {
      console.error('Erro ao buscar clientes por nome:', error);
      throw error;
    }
  }
};
