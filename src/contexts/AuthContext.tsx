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
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
          console.log('Fetching user document from Firestore...');
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          console.log('User document exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User data found:', userData);
            setUser(userData);
          } else {
            console.log('Creating new user document...');
            // Criar documento do usuário automaticamente
            const newUser: User = {
              uid: fUser.uid,
              name: fUser.displayName || "Usuário",
              email: fUser.email || "",
              role: "professional", // Default role
              createdAt: new Date(),
              isActive: true,
              photoURL: (fUser.photoURL || undefined)
            };
            await setDoc(doc(db, "users", fUser.uid), newUser);
            console.log('New user created:', newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.log('User logged out');
        setUser(null);
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
        uid: result.user.uid,
        name: name,
        email: email,
        role: "professional",
        createdAt: new Date(),
        isActive: true,
        photoURL: (result.user.photoURL || undefined)
      };
      await setDoc(doc(db, "users", result.user.uid), newUser);
      return true;
    } catch (error) {
      console.error("Sign up error:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, signIn, signUp }}>
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
