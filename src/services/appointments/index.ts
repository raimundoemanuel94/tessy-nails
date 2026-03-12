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
import { Appointment, AppointmentSchema, AppointmentStatus } from "@/types";

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
    });

    return docRef.id;
  },

  /**
   * Atualiza o status de um agendamento
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
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
