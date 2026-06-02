/**
 * appointmentService — Multi-tenant
 * Todos os dados em /studios/{studioId}/appointments
 */
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp, limit,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentStatus } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface AppointmentWithService {
  id: string;
  service: { id: string; name: string; price: number; durationMinutes: number };
  date: Date;
  time: { id: string; time: string };
  status: string;
  clientId?: string;
  clientName?: string;
  observation?: string;
  createdAt: Date;
}

export interface BusySlot {
  id: string;
  appointmentDate: string | Date;
  status: string;
  serviceId: string;
}

// Referências
const col  = (studioId: string) => collection(db!, "studios", studioId, "appointments");
const dref = (studioId: string, id: string) => doc(db!, "studios", studioId, "appointments", id);

const parseDate = (v: unknown): Date => {
  if (v instanceof Timestamp)          return v.toDate();
  if (v instanceof Date)               return v;
  if (typeof v === "string" || typeof v === "number") return new Date(v);
  return new Date();
};

const toAppt = (id: string, d: Record<string, unknown>): Appointment => ({
  id,
  clientId:        String(d.clientId || ""),
  clientName:      String(d.clientName || ""),
  serviceId:       String(d.serviceId || ""),
  serviceName:     String(d.serviceName || ""),
  specialistId:    String(d.specialistId || ""),
  appointmentDate: parseDate(d.appointmentDate),
  timeSlotId:      String(d.timeSlotId || ""),
  status:          (d.status as AppointmentStatus) || "pending",
  paymentStatus:   (d.paymentStatus as "unpaid" | "deposit_paid" | "fully_paid") || "unpaid",
  price:           Number(d.price || 0),
  observation:     d.observation ? String(d.observation) : undefined,
  createdAt:       parseDate(d.createdAt),
  updatedAt:       d.updatedAt ? parseDate(d.updatedAt) : undefined,
  studioId:        String(d.studioId || ""),
});

export const appointmentService = {

  // ── Leitura ─────────────────────────────────────────────────────

  async getAll(studioId: string): Promise<Appointment[]> {
    const snap = await getDocs(query(col(studioId), orderBy("appointmentDate", "desc"), limit(200)));
    return snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>));
  },

  async getByDateRange(studioId: string, start: Date, end: Date): Promise<Appointment[]> {
    const snap = await getDocs(query(
      col(studioId),
      where("appointmentDate", ">=", Timestamp.fromDate(start)),
      where("appointmentDate", "<=", Timestamp.fromDate(end)),
      orderBy("appointmentDate", "asc"),
    ));
    return snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>));
  },

  async getByClientId(studioId: string, clientId: string, max = 50): Promise<Appointment[]> {
    const snap = await getDocs(query(
      col(studioId),
      where("clientId", "==", clientId),
      orderBy("appointmentDate", "desc"),
      limit(max),
    ));
    return snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>));
  },

  async getByClientIdWithServices(
    studioId: string, clientId: string, max = 50
  ): Promise<AppointmentWithService[]> {
    const appts = await appointmentService.getByClientId(studioId, clientId, max);
    return appts.map(a => ({
      id:          a.id ?? "",
      service:     { id: a.serviceId, name: a.serviceName || "Serviço", price: a.price || 0, durationMinutes: 0 },
      date:        a.appointmentDate,
      time:        { id: a.timeSlotId || "", time: format(a.appointmentDate, "HH:mm", { locale: ptBR }) },
      status:      a.status,
      clientId:    a.clientId,
      clientName:  a.clientName,
      observation: a.observation,
      createdAt:   a.createdAt,
    })) as AppointmentWithService[];
  },

  async getById(studioId: string, id: string): Promise<Appointment | null> {
    const snap = await getDoc(dref(studioId, id));
    if (!snap.exists()) return null;
    return toAppt(snap.id, snap.data() as Record<string, unknown>);
  },

  async getUpcoming(studioId: string, max = 20): Promise<Appointment[]> {
    const snap = await getDocs(query(
      col(studioId),
      where("appointmentDate", ">=", Timestamp.fromDate(new Date())),
      where("status", "in", ["pending","confirmed"]),
      orderBy("appointmentDate", "asc"),
      limit(max),
    ));
    return snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>));
  },

  async getBusySlots(studioId: string, date: string): Promise<BusySlot[]> {
    const start = new Date(date + "T00:00:00");
    const end   = new Date(date + "T23:59:59");
    const snap  = await getDocs(query(
      col(studioId),
      where("appointmentDate", ">=", Timestamp.fromDate(start)),
      where("appointmentDate", "<=", Timestamp.fromDate(end)),
      where("status", "in", ["pending","confirmed"]),
    ));
    return snap.docs.map(d => ({
      id:              d.id,
      appointmentDate: parseDate((d.data() as Record<string, unknown>).appointmentDate),
      status:          String((d.data() as Record<string, unknown>).status),
      serviceId:       String((d.data() as Record<string, unknown>).serviceId),
    }));
  },

  // ── Escrita ──────────────────────────────────────────────────────

  async create(studioId: string, data: Omit<Appointment, "id" | "createdAt">): Promise<string> {
    const ref = await addDoc(col(studioId), {
      ...data,
      studioId,
      createdAt:  Timestamp.now(),
      updatedAt:  Timestamp.now(),
    });
    return ref.id;
  },

  async updateStatus(studioId: string, id: string, status: AppointmentStatus): Promise<void> {
    await updateDoc(dref(studioId, id), { status, updatedAt: Timestamp.now() });
  },

  async update(studioId: string, id: string, data: Partial<Appointment>): Promise<void> {
    await updateDoc(dref(studioId, id), { ...data, updatedAt: Timestamp.now() });
  },

  async delete(studioId: string, id: string): Promise<void> {
    await deleteDoc(dref(studioId, id));
  },

  // ── Tempo real ──────────────────────────────────────────────────

  subscribe(studioId: string, cb: (a: Appointment[]) => void): Unsubscribe {
    return onSnapshot(
      query(col(studioId), orderBy("appointmentDate", "desc"), limit(100)),
      snap => cb(snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>)))
    );
  },


  async confirm(studioId: string, id: string): Promise<void> {
    await appointmentService.updateStatus(studioId, id, "confirmed");
  },

  async complete(studioId: string, id: string): Promise<void> {
    await appointmentService.updateStatus(studioId, id, "completed");
  },

  async noShow(studioId: string, id: string): Promise<void> {
    await appointmentService.updateStatus(studioId, id, "no_show");
  },

  async cancel(studioId: string, id: string): Promise<void> {
    await appointmentService.updateStatus(studioId, id, "cancelled");
  },

  subscribeByDateRange(
    studioId: string,
    start: Date,
    end: Date,
    cb: (a: Appointment[]) => void
  ): Unsubscribe {
    return onSnapshot(
      query(
        col(studioId),
        where("appointmentDate", ">=", Timestamp.fromDate(start)),
        where("appointmentDate", "<=", Timestamp.fromDate(end)),
        orderBy("appointmentDate", "asc"),
      ),
      snap => cb(snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>)))
    );
  },


  subscribeByClientId(
    clientId: string,
    cb: (a: Appointment[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    // Para clientes — busca em coleções legado global
    // (até /book/[slug] estar pronto, clientes usam coleção global)
    return onSnapshot(
      query(
        collection(db!, "appointments"),
        where("clientId", "==", clientId),
        orderBy("appointmentDate", "desc"),
        limit(50),
      ),
      snap => cb(snap.docs.map(d => toAppt(d.id, d.data() as Record<string, unknown>)))
    );
  },

  // ── Compatibilidade legado (sem studioId) ───────────────────────
  async getByClientIdLegacy(clientId: string, max = 50): Promise<AppointmentWithService[]> {
    try {
      const { getDocs: gd, collection: cl, query: q, where: w,
              orderBy: ob, limit: li } = await import("firebase/firestore");
      const snap = await gd(q(
        cl(db!, "appointments"),
        w("clientId", "==", clientId),
        ob("appointmentDate", "desc"),
        li(max),
      ));
      return snap.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        const date = parseDate(data.appointmentDate);
        return {
          id:      d.id,
          service: { id: String(data.serviceId || ""), name: String(data.serviceName || ""), price: Number(data.price || 0), durationMinutes: 0 },
          date,
          time:    { id: String(data.timeSlotId || ""), time: format(date, "HH:mm", { locale: ptBR }) },
          status:  String(data.status || "pending"),
          createdAt: parseDate(data.createdAt),
        };
      });
    } catch { return []; }
  },
};

export default appointmentService;
