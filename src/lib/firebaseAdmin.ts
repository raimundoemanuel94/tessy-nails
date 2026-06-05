import admin from "firebase-admin";

export function getFirebaseAdminApp() {
  // Procura especificamente o app DEFAULT (nomeado "[DEFAULT]")
  // Evita conflito com apps nomeados de outras rotas (fix-tessy-v2, etc.)
  const existingDefault = admin.apps.find(a => a?.name === "[DEFAULT]");
  if (existingDefault) return existingDefault;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "nailit-792a7";

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    "firebase-adminsdk-fbsvc@nailit-792a7.iam.gserviceaccount.com";

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!privateKey) {
    console.error("[firebaseAdmin] FIREBASE_PRIVATE_KEY nao configurada");
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

export { admin };
