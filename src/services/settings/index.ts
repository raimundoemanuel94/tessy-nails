/**
 * settingsService — Configurações do studio
 * /studios/{studioId}/settings/salon
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SalonSettings {
  studioId:      string;
  name:          string;
  phone?:        string;
  address?:      string;
  photoURL?:     string;
  bio?:          string;
  workingDays:   Record<string, { open: boolean; start: string; end: string }>;
  slotDuration:  number; // minutos
  advanceDays:   number; // quantos dias à frente aceita agendamento
  cancelHours:   number; // horas mínimas para cancelar
  autoConfirm:   boolean;
}

const DEFAULT_SETTINGS: Omit<SalonSettings, "studioId" | "name"> = {
  workingDays: {
    seg: { open: true,  start: "09:00", end: "18:00" },
    ter: { open: true,  start: "09:00", end: "18:00" },
    qua: { open: true,  start: "09:00", end: "18:00" },
    qui: { open: true,  start: "09:00", end: "18:00" },
    sex: { open: true,  start: "09:00", end: "18:00" },
    sab: { open: true,  start: "09:00", end: "13:00" },
    dom: { open: false, start: "09:00", end: "18:00" },
  },
  slotDuration: 30,
  advanceDays:  30,
  cancelHours:  2,
  autoConfirm:  true,
};

const ref = (studioId: string) => doc(db!, "studios", studioId, "settings", "salon");

export const settingsService = {

  async get(studioId: string): Promise<SalonSettings> {
    const snap = await getDoc(ref(studioId));
    if (!snap.exists()) {
      return { studioId, name: "", ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...snap.data() as SalonSettings };
  },

  async save(studioId: string, data: Partial<SalonSettings>): Promise<void> {
    const r = ref(studioId);
    const snap = await getDoc(r);
    if (snap.exists()) {
      await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    } else {
      await setDoc(r, { ...DEFAULT_SETTINGS, ...data, studioId, createdAt: serverTimestamp() });
    }
  },
};

export default settingsService;
