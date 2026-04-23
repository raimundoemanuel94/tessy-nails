"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { User, Client } from "@/types";
import { clientService } from "@/services/clients";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  client: Client | null;
  loading: boolean;
  needsPhoneLink: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  linkOrCreateByPhone: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPhoneLink, setNeedsPhoneLink] = useState(false);

  const syncServerSession = async (fUser: FirebaseUser | null) => {
    try {
      if (!fUser) {
        await fetch("/api/auth/session", { method: "DELETE" });
        return;
      }

      const idToken = await fUser.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      console.error("Session sync error:", error);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      void (async () => {
        await Promise.resolve();
        void syncServerSession(null);
        setLoading(false);
      })();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (fUser) => {
      console.log('Auth state changed:', { fUser: fUser?.email, uid: fUser?.uid });
      setFirebaseUser(fUser);
      await syncServerSession(fUser);
      
      if (fUser) {
        try {
          console.log('Fetching user and client documents from Firestore...');
          
          // Paralelizar requisições Firestore para reduzir latência de boot pela metade
          const [userDoc, clientDoc] = await Promise.all([
             getDoc(doc(db, "users", fUser.uid)),
             getDoc(doc(db, "clients", fUser.uid))
          ]);
          console.log('User document exists:', userDoc.exists());
          console.log('Client document exists:', clientDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User data found:', userData);
            setUser(userData);
          } else {
            console.log('Creating new user document...');
            // Criar documento do usuário automaticamente com fallback como CLIENTE
            const newUser: User = {
              uid: fUser.uid,
              name: fUser.displayName || "Usuário",
              email: fUser.email || "",
              role: "client", // Role padrão seguro agora é CLIENT
              createdAt: new Date(),
              isActive: true,
              ...(fUser.photoURL && { photoURL: fUser.photoURL })
            };
            
            try {
              await setDoc(doc(db, "users", fUser.uid), newUser);
              console.log('New user created:', newUser);
              setUser(newUser);
            } catch (createError) {
              console.error('Error creating user document:', createError);
              // Fallback: usar dados do Firebase Auth sem criar documento
              const fallbackUser: User = {
                uid: fUser.uid,
                name: fUser.displayName || "Usuário",
                email: fUser.email || "",
                role: "client",
                createdAt: new Date(),
                isActive: true,
                ...(fUser.photoURL && { photoURL: fUser.photoURL })
              };
              setUser(fallbackUser);
            }
          }
          
          if (clientDoc.exists()) {
            const clientData = clientDoc.data() as Client;
            console.log('Client data found:', clientData);
            setNeedsPhoneLink(false);
            setClient(clientData);
          } else {
            // Não auto-criar: pedir telefone para tentar vincular cadastro existente
            console.log('No client document found — requesting phone to link or create.');
            setNeedsPhoneLink(true);
            setClient(null);
          }
        } catch (error) {
          console.error("Error fetching user/client data:", error);
          // Fallback: não quebrar o app se Firestore falhar
          const fallbackUser: User = {
            uid: fUser.uid,
            name: fUser.displayName || "Usuário",
            email: fUser.email || "",
            role: "client",
            createdAt: new Date(),
            isActive: true,
            ...(fUser.photoURL && { photoURL: fUser.photoURL })
          };
          setUser(fallbackUser);
          setClient(null);
        }
      } else {
        console.log('User logged out');
        setUser(null);
        setClient(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Sign in error:", error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!auth) return false;
    
    try {
      // ✅ Validações básicas
      if (!email || !password || !name) {
        console.error('Missing required fields');
        return false;
      }
      
      if (name.trim().length < 2) {
        console.error('Invalid name provided');
        return false;
      }
      
      if (password.length < 6) {
        console.error('Password too short');
        return false;
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      // Criar apenas o documento de usuário; o cliente será criado via fluxo
      // de vinculação por telefone (needsPhoneLink), acionado pelo onAuthStateChanged.
      const newUser: User = {
        uid,
        name: name.trim(),
        email,
        role: "client",
        createdAt: new Date(),
        isActive: true,
      };

      await setDoc(doc(db, "users", uid), newUser);
      console.log('User document created; phone link flow will handle client creation.');

      return true;
    } catch (error) {
      console.error("Sign up error:", error);
      return false;
    }
  };

  /**
   * Tenta vincular o usuário logado a um cliente existente pelo telefone.
   * Se achar: copia os dados para clients/{uid} e migra os agendamentos.
   * Se não achar: cria um cliente novo.
   */
  const linkOrCreateByPhone = async (phone: string): Promise<void> => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const sanitized = phone.replace(/\D/g, "");

    const existing = await clientService.getByPhone(sanitized);

    if (existing && existing.id !== uid) {
      // Migrar: copiar dados para clients/{uid}
      const linkedClient: Client = { ...existing, id: uid };
      await setDoc(doc(db, "clients", uid), linkedClient);

      // Migrar agendamentos do ID antigo para o novo uid
      const aptsQuery = query(
        collection(db, "appointments"),
        where("clientId", "==", existing.id)
      );
      const aptsSnap = await getDocs(aptsQuery);
      if (!aptsSnap.empty) {
        const batch = writeBatch(db);
        aptsSnap.docs.forEach((aptDoc) => {
          batch.update(aptDoc.ref, { clientId: uid });
        });
        await batch.commit();
      }

      // Marcar documento antigo como merged (não deletar para segurança)
      await setDoc(doc(db, "clients", existing.id), { mergedInto: uid }, { merge: true });

      setClient(linkedClient);
    } else {
      // Não achou por telefone: criar novo cliente
      const newClient: Client = {
        id: uid,
        name: firebaseUser.displayName || "Cliente",
        ...(firebaseUser.email ? { email: firebaseUser.email } : {}),
        phone: sanitized,
        totalAppointments: 0,
        createdAt: new Date(),
        isActive: true,
      };
      await setDoc(doc(db, "clients", uid), newClient);
      setClient(newClient);
    }

    setNeedsPhoneLink(false);
  };


  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      return false;
    }
  };

    const signInWithGoogle = async (): Promise<boolean> => {
    if (!auth) return false;
    
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      return true;
    } catch (error) {
      console.error("Google sign in error:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, client, loading, needsPhoneLink, signOut, signIn, signUp, signInWithGoogle, linkOrCreateByPhone, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
