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
  Timestamp,
  startAt,
  endAt
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentSchema, AppointmentStatus, PaymentStatus } from "@/types";

const COLLECTION_NAME = "appointments";

export const appointmentService = {
  /**
   * Lista todos os agendamentos ordenados por data (mais recente primeiro)
   */
  async getAll(): Promise<Appointment[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("appointmentDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appointmentDate: doc.data().appointmentDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  /**
   * Busca agendamentos em um intervalo de datas
   */
  async getByDateRange(start: Date, end: Date): Promise<Appointment[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("appointmentDate", ">=", Timestamp.fromDate(start)),
      where("appointmentDate", "<=", Timestamp.fromDate(end)),
      orderBy("appointmentDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appointmentDate: doc.data().appointmentDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  /**
   * Busca agendamentos de um cliente específico
   */
  async getByClientId(clientId: string): Promise<Appointment[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("clientId", "==", clientId),
      orderBy("appointmentDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appointmentDate: doc.data().appointmentDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  /**
   * Busca agendamentos de um profissional específico
   */
  async getBySpecialistId(specialistId: string): Promise<Appointment[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("specialistId", "==", specialistId),
      orderBy("appointmentDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appointmentDate: doc.data().appointmentDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  /**
   * Cria um novo agendamento com validação
   */
  async create(data: Omit<Appointment, "id" | "createdAt">): Promise<string> {
    // A data pode vir como Date do formulário
    const validatedData = AppointmentSchema.parse({
      ...data,
      appointmentDate: data.appointmentDate instanceof Date ? data.appointmentDate : new Date(data.appointmentDate)
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...validatedData,
      appointmentDate: Timestamp.fromDate(validatedData.appointmentDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  },

  /**
   * Atualiza o status de um agendamento
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      status,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Atualiza o status de pagamento de um agendamento
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      paymentStatus,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Cancela um agendamento
   */
  async cancel(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      status: "cancelled",
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Confirma um agendamento
   */
  async confirm(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      status: "confirmed",
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Marca um agendamento como concluído
   */
  async complete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      status: "completed",
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Atualiza dados de um agendamento
   */
  async update(id: string, data: Partial<Appointment>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...data };
    
    if (data.appointmentDate) {
      updateData.appointmentDate = Timestamp.fromDate(new Date(data.appointmentDate));
    }

    await updateDoc(docRef, updateData);
  }
};
