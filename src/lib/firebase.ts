import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = () =>
  !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );

if (!isFirebaseConfigured()) {
  console.error("Firebase não configurado corretamente. Verifique as variáveis de ambiente.");
  console.warn("App funcionará em modo limitado sem Firebase.");
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth =
  typeof window !== "undefined" && isFirebaseConfigured()
    ? getAuth(app)
    : null;

export const db = getFirestore(app);
export const functions = getFunctions(app);

export const storage =
  typeof window !== "undefined"
    ? (() => {
        try {
          const { getStorage } = require("firebase/storage");
          return getStorage(app);
        } catch {
          return null;
        }
      })()
    : null;

export const messaging = async () => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const analytics =
  typeof window !== "undefined"
    ? (() => {
        try {
          const { getAnalytics } = require("firebase/analytics");
          return getAnalytics(app);
        } catch {
          return null;
        }
      })()
    : null;

export { app };
export default app;