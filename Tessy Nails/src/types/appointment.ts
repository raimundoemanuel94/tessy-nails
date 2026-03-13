export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  appointmentDate: Date;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  professionalId?: string;
  professionalName?: string;
  duration?: string;
  price?: string;
}

export interface CreateAppointmentData {
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  appointmentDate: Date;
  appointmentTime: string;
  notes?: string;
  professionalId?: string;
  professionalName?: string;
  duration?: string;
  price?: string;
}

export interface UpdateAppointmentData {
  clientName?: string;
  clientEmail?: string;
  serviceId?: string;
  serviceName?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  professionalId?: string;
  professionalName?: string;
  duration?: string;
  price?: string;
}

export interface AppointmentFilters {
  clientEmail?: string;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
  serviceId?: string;
  professionalId?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
}
