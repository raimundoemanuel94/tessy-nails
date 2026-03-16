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
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // ✅ Criar documentos no Firestore se não existirem
      await this.syncUserProfile(user, "professional");
      
      // ✅ Criar documento na coleção clients
      const clientRef = doc(db, "clients", user.uid);
      const clientDoc = await getDoc(clientRef);
      
      if (!clientDoc.exists()) {
        const newClient = {
          id: user.uid,
          name: user.displayName || "Usuário",
          email: user.email || "",
          phone: undefined,
          totalAppointments: 0,
          createdAt: new Date(),
          isActive: true,
          notes: undefined
        };
        await setDoc(clientRef, newClient);
      }
      
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
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

  async getUsersByIds(uids: string[]): Promise<User[]> {
    const uniqueIds = Array.from(new Set((uids || []).filter(Boolean)));
    const users = await Promise.all(
      uniqueIds.map(async (uid) => {
        const snapshot = await getDoc(doc(db, "users", uid));
        if (!snapshot.exists()) return null;
        return {
          uid: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate?.(),
        } as User;
      })
    );

    return users.filter((user): user is User => Boolean(user));
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
