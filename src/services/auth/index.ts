import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User, UserSchema } from "@/types";

export const authService = {
  /**
   * Login com e-mail e senha
   */
  async loginWithEmail(email: string, pass: string) {
    if (!auth) throw new Error('Firebase Auth not initialized');
    return signInWithEmailAndPassword(auth, email, pass);
  },

  /**
   * Login com Google
   */
  async loginWithGoogle() {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  /**
   * Logout
   */
  async logout() {
    if (!auth) throw new Error('Firebase Auth not initialized');
    return firebaseSignOut(auth);
  },

  /**
   * Busca dados adicionais do usuário no Firestore
   */
  async getUserProfile(uid: string): Promise<User | null> {
    const d = await getDoc(doc(db, "users", uid));
    if (!d.exists()) return null;
    return {
      uid: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
    } as User;
  },

  /**
   * Cria ou atualiza o perfil do usuário no Firestore
   */
  async syncUserProfile(fUser: FirebaseUser, role: User["role"] = "professional"): Promise<User> {
    const userRef = doc(db, "users", fUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUser: User = {
        uid: fUser.uid,
        name: fUser.displayName || "Usuário",
        email: fUser.email || "",
        role,
        photoURL: fUser.photoURL || undefined,
        createdAt: new Date(),
        isActive: true,
      };
      
      const validatedUser = UserSchema.parse(newUser);
      await setDoc(userRef, {
        ...validatedUser,
        createdAt: new Date(),
      });
      
      return {
        ...validatedUser,
        createdAt: new Date(),
      };
    }

    return {
      uid: userDoc.id,
      ...userDoc.data(),
      createdAt: userDoc.data().createdAt?.toDate(),
    } as User;
  }
};
