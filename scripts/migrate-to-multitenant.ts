/**
 * Migração definitiva: Single-tenant → Multi-tenant
 * 
 * USO:
 * 1. Baixe service-account.json do Firebase Console
 * 2. Coloque na raiz do projeto
 * 3. Preencha OWNER_UID abaixo
 * 4. npm run migrate
 * 
 * SEGURO: não deleta dados originais — apenas copia.
 * Idempotente: pode rodar várias vezes sem duplicar.
 */

// ─── CONFIGURAR ────────────────────────────────────────────────
const OWNER_UID        = "O1ei4o6KCehqd3bR8Bw2phPGCrU2"; // UID da Tessy
const STUDIO_NAME      = "Tessy Nails";
const DEFAULT_STUDIO   = "O1ei4o6KCehqd3bR8Bw2phPGCrU2"; // studioId = uid da Tessy
// ──────────────────────────────────────────────────────────────

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";

if (!existsSync("./service-account.json")) {
  console.error("❌ service-account.json não encontrado!");
  process.exit(1);
}
if (!OWNER_UID) {
  console.error("❌ Preencha OWNER_UID antes de rodar!");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync("./service-account.json", "utf8"))) });
const db = getFirestore();

async function copyCollection(from: string, to: string, studioId: string) {
  const src = await db.collection(from).get();
  let count = 0;
  for (const d of src.docs) {
    const dest = db.collection("studios").doc(studioId).collection(to).doc(d.id);
    const existing = await dest.get();
    if (!existing.exists) {
      await dest.set({ ...d.data(), studioId, migratedAt: Timestamp.now() });
      count++;
    }
  }
  return { total: src.size, migrated: count };
}

async function run() {
  console.log("\n🚀 Nailit — Migração Multi-tenant\n");

  // 1. Criar/verificar studio
  const studioRef = db.collection("studios").doc(DEFAULT_STUDIO);
  const studioSnap = await studioRef.get();
  if (!studioSnap.exists) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30 dias para a Tessy
    await studioRef.set({
      name: STUDIO_NAME, ownerId: OWNER_UID,
      slug: "nailit-studio", plan: "pro",
      trialEndsAt: Timestamp.fromDate(trialEndsAt),
      isActive: true, createdAt: Timestamp.now(),
    });
    console.log("✓ Studio criado:", DEFAULT_STUDIO);
  } else {
    console.log("  Studio já existe — pulando criação");
  }

  // 2. Migrar coleções
  for (const [from, to] of [
    ["appointments", "appointments"],
    ["services",     "services"],
    ["clients",      "clients"],
  ]) {
    const r = await copyCollection(from, to, DEFAULT_STUDIO);
    console.log(`✓ ${to}: ${r.migrated} migrados (${r.total - r.migrated} já existiam)`);
  }

  // 3. Migrar settings
  const settings = await db.collection("settings").doc("salon").get();
  if (settings.exists) {
    const dest = db.collection("studios").doc(DEFAULT_STUDIO).collection("settings").doc("salon");
    if (!(await dest.get()).exists) {
      await dest.set({ ...settings.data(), studioId: DEFAULT_STUDIO });
      console.log("✓ settings/salon migrado");
    }
  }

  // 4. Atualizar /users/{uid}
  await db.collection("users").doc(OWNER_UID).set({
    studioId: DEFAULT_STUDIO,
    role: "professional",
    updatedAt: Timestamp.now(),
  }, { merge: true });
  console.log("✓ User profile atualizado");

  console.log("\n✅ Migração concluída!");
  console.log("⚠️  Os dados originais foram mantidos como backup.");
  console.log(`📍 Studio: /studios/${DEFAULT_STUDIO}`);
}

run().catch(e => { console.error("❌", e); process.exit(1); });
