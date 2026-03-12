import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters, 
  TimeSlot,
  AppointmentStatus 
} from "../types/appointment";

// Nome da coleção no Firestore
const APPOINTMENTS_COLLECTION = "appointments";

class AppointmentService {
  /**
   * Criar um novo agendamento
   */
  async createAppointment(appointmentData: CreateAppointmentData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
        ...appointmentData,
        appointmentDate: Timestamp.fromDate(appointmentData.appointmentDate),
        status: "pending" as AppointmentStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw new Error("Não foi possível criar o agendamento");
    }
  }

  /**
   * Obter todos os agendamentos
   */
  async getAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    try {
      let q = query(collection(db, APPOINTMENTS_COLLECTION));

      // Aplicar filtros se fornecidos
      if (filters?.clientEmail) {
        q = query(q, where("clientEmail", "==", filters.clientEmail));
      }

      if (filters?.status) {
        q = query(q, where("status", "==", filters.status));
      }

      if (filters?.serviceId) {
        q = query(q, where("serviceId", "==", filters.serviceId));
      }

      if (filters?.professionalId) {
        q = query(q, where("professionalId", "==", filters.professionalId));
      }

      if (filters?.startDate && filters?.endDate) {
        q = query(
          q, 
          where("appointmentDate", ">=", Timestamp.fromDate(filters.startDate)),
          where("appointmentDate", "<=", Timestamp.fromDate(filters.endDate))
        );
      }

      // Ordenar por data do agendamento
      q = query(q, orderBy("appointmentDate", "asc"));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          appointmentDate: data.appointmentDate.toDate(),
          appointmentTime: data.appointmentTime,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          professionalId: data.professionalId,
          professionalName: data.professionalName,
          duration: data.duration,
          price: data.price
        } as Appointment;
      });
    } catch (error) {
      console.error("Error getting appointments:", error);
      throw new Error("Não foi possível carregar os agendamentos");
    }
  }

  /**
   * Obter agendamentos por data
   */
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where("appointmentDate", ">=", Timestamp.fromDate(startOfDay)),
        where("appointmentDate", "<=", Timestamp.fromDate(endOfDay)),
        where("status", "in", ["pending", "confirmed"]),
        orderBy("appointmentTime", "asc")
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          appointmentDate: data.appointmentDate.toDate(),
          appointmentTime: data.appointmentTime,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          professionalId: data.professionalId,
          professionalName: data.professionalName,
          duration: data.duration,
          price: data.price
        } as Appointment;
      });
    } catch (error) {
      console.error("Error getting appointments by date:", error);
      throw new Error("Não foi possível carregar os agendamentos da data");
    }
  }

  /**
   * Obter horários ocupados para uma data específica
   */
  async getOccupiedTimeSlots(date: Date): Promise<TimeSlot[]> {
    try {
      const appointments = await this.getAppointmentsByDate(date);
      
      // Gerar todos os horários possíveis (8:00 - 18:00)
      const allTimeSlots: TimeSlot[] = [];
      for (let hour = 8; hour <= 18; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const isOccupied = appointments.some(apt => apt.appointmentTime === time);
        
        allTimeSlots.push({
          time,
          available: !isOccupied,
          appointmentId: isOccupied ? appointments.find(apt => apt.appointmentTime === time)?.id : undefined
        });
      }

      return allTimeSlots;
    } catch (error) {
      console.error("Error getting occupied time slots:", error);
      throw new Error("Não foi possível carregar os horários disponíveis");
    }
  }

  /**
   * Obter um agendamento específico por ID
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          appointmentDate: data.appointmentDate.toDate(),
          appointmentTime: data.appointmentTime,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          professionalId: data.professionalId,
          professionalName: data.professionalName,
          duration: data.duration,
          price: data.price
        } as Appointment;
      }

      return null;
    } catch (error) {
      console.error("Error getting appointment by ID:", error);
      throw new Error("Não foi possível carregar o agendamento");
    }
  }

  /**
   * Atualizar um agendamento
   */
  async updateAppointment(id: string, updateData: UpdateAppointmentData): Promise<void> {
    try {
      const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
      
      const updatePayload: any = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      // Converter data para Timestamp se existir
      if (updateData.appointmentDate) {
        updatePayload.appointmentDate = Timestamp.fromDate(updateData.appointmentDate);
      }

      await updateDoc(docRef, updatePayload);
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw new Error("Não foi possível atualizar o agendamento");
    }
  }

  /**
   * Cancelar um agendamento
   */
  async cancelAppointment(id: string): Promise<void> {
    try {
      const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
      await updateDoc(docRef, {
        status: "cancelled" as AppointmentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw new Error("Não foi possível cancelar o agendamento");
    }
  }

  /**
   * Confirmar um agendamento
   */
  async confirmAppointment(id: string): Promise<void> {
    try {
      const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
      await updateDoc(docRef, {
        status: "confirmed" as AppointmentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
      throw new Error("Não foi possível confirmar o agendamento");
    }
  }

  /**
   * Marcar agendamento como concluído
   */
  async completeAppointment(id: string): Promise<void> {
    try {
      const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
      await updateDoc(docRef, {
        status: "completed" as AppointmentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error completing appointment:", error);
      throw new Error("Não foi possível concluir o agendamento");
    }
  }

  /**
   * Excluir um agendamento
   */
  async deleteAppointment(id: string): Promise<void> {
    try {
      const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw new Error("Não foi possível excluir o agendamento");
    }
  }
}

// Exportar instância única do serviço
export const appointmentService = new AppointmentService();
export default appointmentService;
