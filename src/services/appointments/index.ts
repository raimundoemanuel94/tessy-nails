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
import { salonService } from "@/services/salon";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLLECTION_NAME = "appointments";

const mapAppointmentData = (doc: any) => {
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
   */
  async getAll(): Promise<Appointment[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("appointmentDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(mapAppointmentData) as Appointment[];
    } catch (error: any) {
      console.error("🔥 Error in appointmentService.getAll:", error);
      if (error.code === 'permission-denied') {
        console.warn("⚠️ Firestore Permission Denied. Check rules for collection 'appointments'.");
      }
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
  async getByClientIdWithServices(clientId: string): Promise<any[]> {
    const appointments = await this.getByClientId(clientId);
    
    // Buscar detalhes de todos os serviços
    const appointmentsWithServices = await Promise.all(
      appointments.map(async (apt) => {
        try {
          console.log(`🔍 Buscando serviço: ${apt.serviceId}`);
          const service = await salonService.getById(apt.serviceId);
          
          if (service) {
            console.log(`✅ Serviço encontrado: ${service.name}`);
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
            console.log(`❌ Serviço NÃO encontrado: ${apt.serviceId}`);
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
    } catch (error: any) {
      console.error(`❌ ERRO PROFUNDO ao buscar serviço ${apt.serviceId}:`, error);
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
          time: apt.appointmentDate ? format(new Date(apt.appointmentDate), 'HH:mm', { locale: ptBR }) : "00:00"
        },
        status: apt.status,
        observation: apt.notes || undefined,
        createdAt: apt.createdAt || new Date()
      };
    }
      })
    );
    
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
    // ✅ Remover campos que não pertencem ao schema antes da validação
    const { time, ...toValidate } = data as any;
    
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
    } catch (error: any) {
      console.error("❌ Erro de validação/criação no AppointmentService:", error);
      if (error instanceof z.ZodError) {
        console.error("Validação falhou:", error.errors);
      }
      throw error;
    }

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
  async getSpecialists(): Promise<any[]> {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["admin", "professional"])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  }
};
