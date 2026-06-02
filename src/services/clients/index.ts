/**
 * clientService — Multi-tenant
 * /studios/{studioId}/clients
 */
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Client } from "@/types";

const col  = (sid: string) => collection(db!, "studios", sid, "clients");
const dref = (sid: string, id: string) => doc(db!, "studios", sid, "clients", id);

const toClient = (id: string, d: Record<string, unknown>): Client => ({
  id,
  name:          String(d.name || ""),
  email:         d.email ? String(d.email) : undefined,
  phone:         d.phone ? String(d.phone) : undefined,
  photoURL:      d.photoURL ? String(d.photoURL) : undefined,
  birthDate:     d.birthDate instanceof Timestamp ? d.birthDate.toDate() : undefined,
  totalVisits:   Number(d.totalVisits || 0),
  totalAppointments: Number(d.totalAppointments || d.totalVisits || 0),
  totalSpent:    Number(d.totalSpent || 0),
  lastVisit:     d.lastVisit instanceof Timestamp ? d.lastVisit.toDate() : undefined,
  notes:         d.notes ? String(d.notes) : undefined,
  isActive:      d.isActive !== false,
  createdAt:     d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
  studioId:      String(d.studioId || ""),
});

export const clientService = {

  async getAll(studioId: string): Promise<Client[]> {
    const snap = await getDocs(query(col(studioId), where("isActive", "==", true), orderBy("name")));
    return snap.docs.map(d => toClient(d.id, d.data() as Record<string, unknown>));
  },

  async getById(studioId: string, id: string): Promise<Client | null> {
    const snap = await getDoc(dref(studioId, id));
    if (!snap.exists()) return null;
    return toClient(snap.id, snap.data() as Record<string, unknown>);
  },

  async search(studioId: string, term: string): Promise<Client[]> {
    // Busca simples por nome (Firestore não tem full-text)
    const snap = await getDocs(query(col(studioId), orderBy("name"), limit(50)));
    const t = term.toLowerCase();
    return snap.docs
      .map(d => toClient(d.id, d.data() as Record<string, unknown>))
      .filter(c => c.name.toLowerCase().includes(t) || c.phone?.includes(t) || c.email?.toLowerCase().includes(t));
  },

  async findByPhone(studioId: string, phone: string): Promise<Client | null> {
    const snap = await getDocs(query(col(studioId), where("phone", "==", phone), limit(1)));
    if (snap.empty) return null;
    return toClient(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);
  },

  async create(studioId: string, data: Omit<Client, "id" | "createdAt">): Promise<string> {
    const ref = await addDoc(col(studioId), {
      ...data, studioId, isActive: true, totalVisits: 0, totalSpent: 0, createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(studioId: string, id: string, data: Partial<Client>): Promise<void> {
    await updateDoc(dref(studioId, id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(studioId: string, id: string): Promise<void> {
    await updateDoc(dref(studioId, id), { isActive: false, updatedAt: serverTimestamp() });
  },

  async recordVisit(studioId: string, id: string, amount: number): Promise<void> {
    const ref = dref(studioId, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const d = snap.data() as Record<string, unknown>;
    await updateDoc(ref, {
      totalVisits: Number(d.totalVisits || 0) + 1,
      totalSpent:  Number(d.totalSpent  || 0) + amount,
      lastVisit:   serverTimestamp(),
    });
  },
};

export default clientService;
