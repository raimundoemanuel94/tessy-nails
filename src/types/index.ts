import { z } from "zod";

export const UserRoleEnum = z.enum(['admin', 'professional', 'client']);

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  role: UserRoleEnum,
  isActive: z.boolean().default(true),
  photoURL: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;

// Client Schema & Type
export const ClientSchema = z.object({
  id: z.string(), // Same as Firebase Auth UID
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  totalAppointments: z.number().default(0),
  lastVisit: z.date().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type Client = z.infer<typeof ClientSchema>;

// Service Schema & Type
export const ServiceSchema = z.object({
  id: z.string(), // Firestore auto-generated ID
  name: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().min(1),
  price: z.number().min(0),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

// Appointment Schema & Type
export const AppointmentStatusEnum = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);
export const PaymentStatusEnum = z.enum(['unpaid', 'deposit_paid', 'fully_paid']);

export const AppointmentSchema = z.object({
  id: z.string().optional(), // Firestore auto-generated ID
  clientId: z.string(), // Firebase Auth UID
  serviceId: z.string(), // Service ID
  specialistId: z.string(), // User UID
  appointmentDate: z.date(),
  status: AppointmentStatusEnum.default('pending'),
  paymentStatus: PaymentStatusEnum.default('unpaid'),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

// Sale Schema & Type
export const PaymentMethodEnum = z.enum(['cash', 'credit', 'debit', 'pix']);

export const SaleSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  amount: z.number(),
  paymentMethod: PaymentMethodEnum,
  status: z.enum(['pending', 'completed', 'refunded']).default('pending'),
  createdAt: z.date(),
});

export type Sale = z.infer<typeof SaleSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

// Report Schema & Type
export const ReportSchema = z.object({
  id: z.string(),
  month: z.string(), // Format: "2024-03"
  totalRevenue: z.number(),
  totalAppointments: z.number(),
  totalClients: z.number(),
  createdAt: z.date(),
});

export type Report = z.infer<typeof ReportSchema>;

// Salon Config Schema & Type
export const SalonConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }),
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
  }),
  settings: z.object({
    appointmentInterval: z.number().default(30),
    cleaningTime: z.number().default(15),
    maxAdvanceBooking: z.number().default(90),
    minCancelNotice: z.number().default(24),
    currency: z.string().default("BRL"),
    timezone: z.string().default("America/Sao_Paulo"),
  }),
  createdAt: z.date(),
});

export type SalonConfig = z.infer<typeof SalonConfigSchema>;

// UI helper types
export interface AppointmentWithDetails extends Appointment {
  client?: Client;
  service?: Service;
  specialist?: User;
}
