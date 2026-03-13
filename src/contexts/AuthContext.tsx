"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User, Client } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  client: Client | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (fUser) => {
      console.log('Auth state changed:', { fUser: fUser?.email, uid: fUser?.uid });
      setFirebaseUser(fUser);
      
      if (fUser) {
        try {
          console.log('Fetching user and client documents from Firestore...');
          
          // Buscar documento na coleção users (admin/profissional)
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          console.log('User document exists:', userDoc.exists());
          
          // Buscar documento na coleção clients (cliente)
          const clientDoc = await getDoc(doc(db, "clients", fUser.uid));
          console.log('Client document exists:', clientDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User data found:', userData);
            setUser(userData);
          } else {
            console.log('Creating new user document...');
            // Criar documento do usuário automaticamente com fallback
            const newUser: User = {
              uid: fUser.uid,
              name: fUser.displayName || "Usuário",
              email: fUser.email || "",
              role: "professional", // Default role
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
                role: "professional",
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
            setClient(clientData);
          } else {
            console.log('No client document found for this user - creating fallback...');
            // ✅ Criar cliente automaticamente se não existir
            try {
              const newClient: Client = {
                id: fUser.uid,
                name: fUser.displayName || userDoc?.data()?.name || "Cliente",
                email: fUser.email || "",
                phone: undefined,
                totalAppointments: 0,
                createdAt: new Date(),
                isActive: true,
                notes: undefined
              };
              
              await setDoc(doc(db, "clients", fUser.uid), newClient);
              console.log('Client document created automatically:', newClient);
              setClient(newClient);
            } catch (createError) {
              console.error('Error creating client document:', createError);
              setClient(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user/client data:", error);
          // Fallback: não quebrar o app se Firestore falhar
          const fallbackUser: User = {
            uid: fUser.uid,
            name: fUser.displayName || "Usuário",
            email: fUser.email || "",
            role: "professional",
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
      
      // Criar documento na coleção users (admin/profissional)
      const newUser: User = {
        uid: uid,
        name: name.trim(),
        email: email,
        role: "client", // ✅ Mudar para client - usuários comuns são clientes
        createdAt: new Date(),
        isActive: true,
        photoURL: (result.user.photoURL || undefined)
      };
      
      // Criar documento na coleção clients (cliente) - para acesso à área cliente
      const newClient: Client = {
        id: uid, // Same as Firebase Auth UID
        name: name.trim(),
        email: email,
        phone: undefined, // Opcional - pode ser preenchido depois
        totalAppointments: 0,
        createdAt: new Date(),
        isActive: true,
        notes: undefined // Opcional
      };
      
      // ✅ Salvar ambos os documentos com validação
      await Promise.all([
        setDoc(doc(db, "users", uid), newUser),
        setDoc(doc(db, "clients", uid), newClient)
      ]);
      
      console.log('User and Client documents created successfully');
      
      // ✅ Atualizar estado local para evitar nova busca
      setClient(newClient);
      
      return true;
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      // ✅ Tratamento específico de erros
      if (error.code === 'auth/email-already-in-use') {
        console.error('Email already in use');
      } else if (error.code === 'auth/weak-password') {
        console.error('Password too weak');
      } else if (error.code === 'auth/invalid-email') {
        console.error('Invalid email');
      }
      
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, client, loading, signOut, signIn, signUp }}>
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
