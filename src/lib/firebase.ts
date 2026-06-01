import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );

if (!isFirebaseConfigured() && process.env.NODE_ENV !== "production") {
  console.warn("[Nailit] Firebase não configurado. Verifique as variáveis de ambiente.");
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth =
  typeof window !== "undefined" && isFirebaseConfigured() ? getAuth(app) : null;

// Firestore com cache offline (IndexedDB)
// Usa a API moderna persistentLocalCache quando disponível
let db: ReturnType<typeof getFirestore>;
try {
  if (typeof window !== "undefined" && isFirebaseConfigured()) {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } else {
    db = getFirestore(app);
  }
} catch {
  // Se já inicializado (hot reload), pega a instância existente
  db = getFirestore(app);
}

export { db };
export { app };
