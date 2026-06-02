/**
 * salonService (services) — Multi-tenant
 * /studios/{studioId}/services
 */
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Service } from "@/types";

const col  = (sid: string) => collection(db!, "studios", sid, "services");
const dref = (sid: string, id: string) => doc(db!, "studios", sid, "services", id);

const toService = (id: string, d: Record<string, unknown>): Service => ({
  id,
  name:            String(d.name || ""),
  description:     d.description ? String(d.description) : undefined,
  price:           Number(d.price || 0),
  durationMinutes: Number(d.durationMinutes || 30),
  bufferMinutes:   Number(d.bufferMinutes || 0),
  isActive:        d.isActive !== false,
  category:        d.category ? String(d.category) : undefined,
  createdAt:       d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
  updatedAt:       d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : undefined,
  studioId:        String(d.studioId || ""),
});

export const salonService = {

  async getAll(studioId: string): Promise<Service[]> {
    const snap = await getDocs(query(col(studioId), where("isActive", "==", true), orderBy("name")));
    return snap.docs.map(d => toService(d.id, d.data() as Record<string, unknown>));
  },

  async getAllWithInactive(studioId: string): Promise<Service[]> {
    const snap = await getDocs(query(col(studioId), orderBy("name")));
    return snap.docs.map(d => toService(d.id, d.data() as Record<string, unknown>));
  },

  async getById(studioId: string, id: string): Promise<Service | null> {
    const snap = await getDoc(dref(studioId, id));
    if (!snap.exists()) return null;
    return toService(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(studioId: string, data: Omit<Service, "id" | "createdAt">): Promise<string> {
    const ref = await addDoc(col(studioId), {
      ...data, studioId, isActive: true, createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(studioId: string, id: string, data: Partial<Service>): Promise<void> {
    await updateDoc(dref(studioId, id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(studioId: string, id: string): Promise<void> {
    await deleteDoc(dref(studioId, id));
  },

  async deactivate(studioId: string, id: string): Promise<void> {
    await updateDoc(dref(studioId, id), { isActive: false, updatedAt: serverTimestamp() });
  },

  async activate(studioId: string, id: string): Promise<void> {
    await updateDoc(dref(studioId, id), { isActive: true, updatedAt: serverTimestamp() });
  },

  // Legado sem studioId (para não quebrar enquanto migra)
  async getAllLegacy(): Promise<Service[]> {
    try {
      const { getDocs: gd, collection: cl, query: q, where: w, orderBy: ob } = await import("firebase/firestore");
      const snap = await gd(q(cl(db!, "services"), w("isActive", "==", true), ob("name")));
      return snap.docs.map(d => toService(d.id, d.data() as Record<string, unknown>));
    } catch { return []; }
  },
};

export default salonService;
