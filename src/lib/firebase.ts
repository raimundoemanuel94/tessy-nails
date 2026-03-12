import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Configuração segura do Firebase com variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Verificação de configuração
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Inicialização segura do Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Auth (client-side only)
export const auth = typeof window !== 'undefined' ? getAuth(app) : null;

// Firestore (server e client)
export const db = getFirestore(app);

// Functions (server e client)
export const functions = getFunctions(app);

// Storage (client-side only)
export const storage = typeof window !== 'undefined' ? 
  (() => {
    try {
      const { getStorage } = require("firebase/storage");
      return getStorage(app);
    } catch (e) {
      return null;
    }
  })() : null;

// Messaging setup (conditional for SSR)
export const messaging = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

// Analytics (client-side only, com verificação de suporte)
export const analytics = typeof window !== 'undefined' ? 
  (() => {
    try {
      const { getAnalytics } = require("firebase/analytics");
      return getAnalytics(app);
    } catch (e) {
      return null;
    }
  })() : null;

export { app };
export default app;
