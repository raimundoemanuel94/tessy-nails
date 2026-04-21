import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );

if (!isFirebaseConfigured() && process.env.NODE_ENV !== "production") {
  console.warn("Firebase nao configurado corretamente. Verifique as variaveis de ambiente.");
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth =
  typeof window !== "undefined" && isFirebaseConfigured() ? getAuth(app) : null;

export const db = getFirestore(app);

export { app };
