import {
  collection, doc, getDoc, getDocs, addDoc,
  updateDoc, query, where, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Studio, PlanId, PlanLimits } from "@/types";

const STUDIOS_COL = "studios";

export const studioService = {

  async create(ownerId: string, name: string): Promise<Studio> {
    const slug = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);

    const data = {
      name, ownerId,
      slug: `${slug}-${Date.now().toString(36)}`,
      plan: "pro" as PlanId,
      trialEndsAt: Timestamp.fromDate(trialEndsAt),
      isActive: true,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db!, STUDIOS_COL), data);
    return { id: ref.id, ...data, trialEndsAt, createdAt: new Date() };
  },

  async getById(studioId: string): Promise<Studio | null> {
    const snap = await getDoc(doc(db!, STUDIOS_COL, studioId));
    if (!snap.exists()) return null;
    return toStudio(snap.id, snap.data());
  },

  async getByOwner(ownerId: string): Promise<Studio | null> {
    const q = query(
      collection(db!, STUDIOS_COL),
      where("ownerId", "==", ownerId),
      where("isActive", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return toStudio(snap.docs[0].id, snap.docs[0].data());
  },

  async update(studioId: string, data: Partial<Studio>): Promise<void> {
    await updateDoc(doc(db!, STUDIOS_COL, studioId), {
      ...data, updatedAt: serverTimestamp(),
    });
  },

  // Referências de subcoleção
  col(studioId: string, colName: string) {
    return collection(db!, STUDIOS_COL, studioId, colName);
  },
  docRef(studioId: string, colName: string, docId: string) {
    return doc(db!, STUDIOS_COL, studioId, colName, docId);
  },
  settingsRef(studioId: string) {
    return doc(db!, STUDIOS_COL, studioId, "settings", "salon");
  },

  // Planos e trial
  isInTrial(studio: Studio): boolean {
    if (!studio.trialEndsAt) return false;
    return new Date() < new Date(studio.trialEndsAt);
  },

  getEffectivePlan(studio: Studio): PlanId {
    if (studioService.isInTrial(studio)) return "pro";
    return studio.plan;
  },

  trialDaysLeft(studio: Studio): number {
    if (!studio.trialEndsAt) return 0;
    const diff = new Date(studio.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  canUseFeature(studio: Studio, feature: keyof typeof PlanLimits.free): boolean {
    const plan = studioService.getEffectivePlan(studio);
    return Boolean(PlanLimits[plan][feature]);
  },

  async upgradePlan(studioId: string, plan: PlanId): Promise<void> {
    await updateDoc(doc(db!, STUDIOS_COL, studioId), {
      plan, updatedAt: serverTimestamp(),
    });
  },
};

function toStudio(id: string, data: Record<string, unknown>): Studio {
  return {
    id,
    name:        String(data.name || ""),
    ownerId:     String(data.ownerId || ""),
    slug:        data.slug ? String(data.slug) : undefined,
    phone:       data.phone ? String(data.phone) : undefined,
    address:     data.address ? String(data.address) : undefined,
    photoURL:    data.photoURL ? String(data.photoURL) : undefined,
    plan:        (data.plan as PlanId) || "free",
    trialEndsAt: data.trialEndsAt instanceof Timestamp
      ? data.trialEndsAt.toDate() : undefined,
    isActive:    Boolean(data.isActive !== false),
    createdAt:   data.createdAt instanceof Timestamp
      ? data.createdAt.toDate() : new Date(),
    updatedAt:   data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate() : undefined,
  };
}

export default studioService;
