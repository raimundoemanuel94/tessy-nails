import { z } from "zod";

export type UserRole = 'admin' | 'professional';

// User Schema & Type
export const UserSchema = z.object({
  uid: z.string(),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(['admin', 'professional']),
  photoURL: z.string().optional(),
  createdAt: z.any(), // Firebase Timestamp
});

export type User = z.infer<typeof UserSchema>;

// Client Schema & Type
export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  createdAt: z.any().optional(),
});

export type Client = z.infer<typeof ClientSchema>;

// Service Schema & Type
export const ServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  durationMinutes: z.number().min(5, "Duração mínima de 5 minutos"),
  price: z.number().min(0, "O preço não pode ser negativo"),
  active: z.boolean().default(true),
  createdAt: z.any().optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

// Appointment Schema & Type
export const AppointmentStatusEnum = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);
export const PaymentStatusEnum = z.enum(['unpaid', 'deposit_paid', 'fully_paid']);

export const AppointmentSchema = z.object({
  id: z.string().optional(),
  clientId: z.string({ required_error: "Selecione uma cliente" }),
  serviceId: z.string({ required_error: "Selecione um serviço" }),
  specialistId: z.string({ required_error: "Selecione uma profissional" }),
  appointmentDate: z.any({ required_error: "Selecione uma data e hora" }), // Date or Firebase Timestamp
  status: AppointmentStatusEnum.default('pending'),
  paymentStatus: PaymentStatusEnum.default('unpaid'),
  notes: z.string().optional(),
  createdAt: z.any().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

// UI helper types
export interface AppointmentWithDetails extends Appointment {
  client?: Client;
  service?: Service;
  specialist?: User;
}
