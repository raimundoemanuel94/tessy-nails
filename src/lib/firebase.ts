import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Config fixa do projeto nailit-792a7
const firebaseConfig = {
  apiKey:            "AIzaSyCyi190uiOnAO_xlZ8TcgXd-DcCBVgMwpc",
  authDomain:        "nailit-792a7.firebaseapp.com",
  projectId:         "nailit-792a7",
  storageBucket:     "nailit-792a7.firebasestorage.app",
  messagingSenderId: "100933488815",
  appId:             "1:100933488815:web:3593b3af889f8b367d845a",
};

export const isFirebaseConfigured = () => true;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth =
  typeof window !== "undefined" ? getAuth(app) : null;

let db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

export { db, app };
