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
  endAt,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentSchema, AppointmentStatus, PaymentStatus } from "@/types";
import { globalStore } from "@/store/globalStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

export interface AppointmentWithService {
  id: string;
  service: { id: string; name: string; price: number; durationMinutes: number };
  date: Date;
  time: { id: string; time: string };
  status: string;
  observation?: string;
  createdAt: Date;
}

export interface BusySlot {
  id: string;
  appointmentDate: string | Date;
  status: string;
  serviceId: string;
}

const COLLECTION_NAME = "appointments";

const mapAppointmentData = (doc: QueryDocumentSnapshot<DocumentData>) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    appointmentDate: data.appointmentDate?.toDate ? data.appointmentDate.toDate() : (data.appointmentDate ? new Date(data.appointmentDate) : new Date()),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
  };
};

export const appointmentService = {
  /**
   * Lista todos os agendamentos ordenados por data (mais recente primeiro)
   * ⚠️ AVISO: Uso restrito. Prefira getPaginated ou getByDateRange para de evitar estouro de memória e reads.
   */
  async getAll(): Promise<Appointment[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("appointmentDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(mapAppointmentData) as Appointment[];
    } catch (error) {
      console.error("🔥 Error in appointmentService.getAll:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "permission-denied"
      ) {
        console.warn("⚠️ Firestore Permission Denied. Check rules for collection 'appointments'.");
      }
      throw error;
    }
  },

  /**
   * ✅ OTIMIZAÇÃO: Busca paginada para listas grandes (Mobile Native Feel)
   */
  async getPaginated(pageSize: number = 20, lastDoc?: QueryDocumentSnapshot<DocumentData>): Promise<{ appointments: Appointment[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy("appointmentDate", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, COLLECTION_NAME),
          orderBy("appointmentDate", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(mapAppointmentData) as Appointment[];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { appointments, lastVisible };
    } catch (error) {
      console.error("🔥 Error in getPaginated:", error);
      throw error;
    }
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
    return snapshot.docs.map(mapAppointmentData) as Appointment[];
  },

  /**
   * ✅ NOVO: Busca slots ocupados via API Server-Side (Ignora regras de segurança do Firestore)
   */
  async getBusySlots(start: Date, end: Date): Promise<BusySlot[]> {
    try {
      const response = await fetch(`/api/appointments/availability?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (!response.ok) throw new Error('Falha ao buscar disponibilidade');
      const data = await response.json() as { busySlots?: BusySlot[] };
      return Array.isArray(data.busySlots) ? data.busySlots : [];
    } catch (error) {
      console.error("🔥 Error in getBusySlots:", error);
      return [];
    }
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
    return snapshot.docs.map(mapAppointmentData) as Appointment[];
  },

  /**
   * Busca agendamentos de um cliente com detalhes dos serviços
   */
  async getByClientIdWithServices(clientId: string): Promise<AppointmentWithService[]> {
    const appointments = await this.getByClientId(clientId);
    
    // Buscar todos os serviços via Cache
    const allServices = await globalStore.fetchServices(false);
    
    // Mapear detalhes
    const appointmentsWithServices = appointments.map((apt) => {
      const service = allServices.find(s => s.id === apt.serviceId);
      
      if (service) {
        return {
          id: apt.id || '',
          service: {
            id: apt.serviceId,
            name: service.name,
            price: service.price,
            durationMinutes: service.durationMinutes
          },
          date: apt.appointmentDate,
          time: { 
            id: apt.id || '', 
            time: format(new Date(apt.appointmentDate), 'HH:mm', { locale: ptBR })
          },
          status: apt.status,
          observation: apt.notes || undefined,
          createdAt: apt.createdAt || new Date()
        };
      } else {
        return {
          id: apt.id || '',
          service: {
            id: apt.serviceId,
            name: `Serviço ${apt.serviceId}`,
            price: 0,
            durationMinutes: 60
          },
          date: apt.appointmentDate,
          time: { 
            id: apt.id || '', 
            time: format(new Date(apt.appointmentDate), 'HH:mm', { locale: ptBR })
          },
          status: apt.status,
          observation: apt.notes || undefined,
          createdAt: apt.createdAt || new Date()
        };
      }
    });
    
    return appointmentsWithServices;
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
    return snapshot.docs.map(mapAppointmentData) as Appointment[];
  },

  /**
   * Cria um novo agendamento com validação
   */
  async create(data: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<string> {
    // ✅ Remover campos que não pertencem ao schema antes da validação
    const { time, ...toValidate } = data as Appointment & { time?: string };
    
    try {
      const validatedData = AppointmentSchema.parse({
        ...toValidate,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const cleanData = {
        ...validatedData,
        notes: validatedData.notes || null,
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...cleanData,
        appointmentDate: Timestamp.fromDate(cleanData.appointmentDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("❌ Erro de validação/criação no AppointmentService:", error);
      if (error instanceof z.ZodError) {
        console.error("Validação falhou:", error.issues);
      }
      throw error;
    }
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
      cancelledAt: Timestamp.now(),
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
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Marca um agendamento como falta (não compareceu)
   */
  async noShow(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      status: "no_show",
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Atualiza dados de um agendamento
   */
  async update(id: string, data: Partial<Appointment>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, unknown> = { ...data };
    
    if (data.appointmentDate) {
      updateData.appointmentDate = Timestamp.fromDate(new Date(data.appointmentDate));
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Exclui permanentemente um agendamento
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Busca todos os especialistas (admins e profissionais)
   */
  async getSpecialists(): Promise<{ uid: string; name: string; role: string }[]> {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["admin", "professional"])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as { name?: string; role?: string };
      return {
        uid: doc.id,
        name: data.name ?? "Profissional",
        role: data.role ?? "professional",
      };
    });
  }
};
