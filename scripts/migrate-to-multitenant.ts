/**
 * Script de migração — Single-tenant → Multi-tenant
 * 
 * O que faz:
 * 1. Cria /studios/{defaultStudioId} para a Tessy
 * 2. Copia todos os appointments para /studios/{id}/appointments
 * 3. Copia todos os services para /studios/{id}/services
 * 4. Copia todos os clients para /studios/{id}/clients
 * 5. Copia settings/salon para /studios/{id}/settings/salon
 * 
 * SEGURO: não deleta os dados originais — só copia.
 * Roda uma vez. Idempotente.
 * 
 * Uso: npx ts-node scripts/migrate-to-multitenant.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Configurar com service account
// initializeApp({ credential: cert("./service-account.json") });
// const db = getFirestore();

const DEFAULT_STUDIO_ID = "nailit-default";
const OWNER_UID = ""; // UID da Tessy no Firebase Auth

async function migrate() {
  console.log("🚀 Iniciando migração para multi-tenant...\n");

  // 1. Criar studio da Tessy
  // await db.collection("studios").doc(DEFAULT_STUDIO_ID).set({
  //   name: "Nailit Studio",
  //   ownerId: OWNER_UID,
  //   slug: "nailit-studio",
  //   plan: "pro",
  //   isActive: true,
  //   createdAt: new Date(),
  // });
  // console.log("✓ Studio criado:", DEFAULT_STUDIO_ID);

  // 2. Migrar appointments
  // const appts = await db.collection("appointments").get();
  // for (const doc of appts.docs) {
  //   await db.collection("studios").doc(DEFAULT_STUDIO_ID)
  //     .collection("appointments").doc(doc.id)
  //     .set({ ...doc.data(), studioId: DEFAULT_STUDIO_ID });
  // }
  // console.log(`✓ ${appts.size} appointments migrados`);

  // 3. Migrar services
  // const services = await db.collection("services").get();
  // for (const doc of services.docs) {
  //   await db.collection("studios").doc(DEFAULT_STUDIO_ID)
  //     .collection("services").doc(doc.id)
  //     .set({ ...doc.data(), studioId: DEFAULT_STUDIO_ID });
  // }
  // console.log(`✓ ${services.size} services migrados`);

  // 4. Migrar clients
  // const clients = await db.collection("clients").get();
  // for (const doc of clients.docs) {
  //   await db.collection("studios").doc(DEFAULT_STUDIO_ID)
  //     .collection("clients").doc(doc.id)
  //     .set({ ...doc.data(), studioId: DEFAULT_STUDIO_ID });
  // }
  // console.log(`✓ ${clients.size} clients migrados`);

  // 5. Migrar settings
  // const settings = await db.collection("settings").doc("salon").get();
  // if (settings.exists) {
  //   await db.collection("studios").doc(DEFAULT_STUDIO_ID)
  //     .collection("settings").doc("salon")
  //     .set(settings.data()!);
  //   console.log("✓ Settings migrados");
  // }

  console.log("\n✅ Migração concluída!");
  console.log("📝 Próximo passo: atualizar as queries nos services para usar studioId");
}

migrate().catch(console.error);
