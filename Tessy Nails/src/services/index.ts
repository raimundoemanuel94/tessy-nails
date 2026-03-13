// Exportar todos os serviços
export { appointmentService } from './appointmentService';
export type { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters, 
  TimeSlot,
  AppointmentStatus 
} from '../types/appointment';

// Re-exportar para facilitar uso
export { default as appointmentServiceDefault } from './appointmentService';
