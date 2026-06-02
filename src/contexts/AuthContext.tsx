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
  OAuthProvider,
  sendPasswordResetEmail,
  AuthError,
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
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithApple: () => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<boolean>;
  linkOrCreateByPhone: (phone: string) => Promise<void>;
}

// ── Mapeia códigos Firebase → mensagens amigáveis em pt-BR ────────────
function mapAuthError(err: unknown): string {
  const code = (err as AuthError)?.code ?? "";
  const map: Record<string, string> = {
    "auth/user-not-found":        "E-mail não cadastrado. Crie uma conta primeiro.",
    "auth/wrong-password":        "Senha incorreta. Verifique e tente novamente.",
    "auth/invalid-credential":    "E-mail ou senha incorretos.",
    "auth/invalid-email":         "E-mail inválido. Verifique o endereço.",
    "auth/email-already-in-use":  "Este e-mail já tem uma conta. Faça login.",
    "auth/weak-password":         "Senha muito fraca. Use pelo menos 6 caracteres.",
    "auth/too-many-requests":     "Muitas tentativas. Aguarde alguns minutos.",
    "auth/network-request-failed":"Sem conexão. Verifique sua internet.",
    "auth/popup-closed-by-user":  "Login cancelado. Tente novamente.",
    "auth/cancelled-popup-request":"Outra janela já está aberta.",
    "auth/popup-blocked":         "Popup bloqueado. Permita pop-ups para este site.",
    "auth/account-exists-with-different-credential":
                                  "Este e-mail já foi usado com outro método de login.",
  };
  return map[code] ?? "Erro inesperado. Tente novamente.";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPhoneLink, setNeedsPhoneLink] = useState(false);

  // ✅ Timeout de segurança — iOS PWA pode travar no loading
  // Se em 8s não resolver, força loading=false para não travar o app
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("[Auth] Timeout de segurança ativado — loading forçado para false");
          return false;
        }
        return prev;
      });
    }, 8000);
    return () => clearTimeout(t);
  }, []);

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
      setFirebaseUser(fUser);
      void syncServerSession(fUser);

      if (!fUser) {
        setUser(null);
        setClient(null);
        setLoading(false);
        return;
      }

      // ── Passo 1: liberar UI imediatamente com dados do Firebase Auth ──
      // O usuário vê a tela sem esperar Firestore
      const quickUser: User = {
        uid: fUser.uid,
        name: fUser.displayName || "Usuário",
        email: fUser.email || "",
        role: "client",
        createdAt: new Date(),
        isActive: true,
        ...(fUser.photoURL && { photoURL: fUser.photoURL }),
      };
      setUser(quickUser);
      setLoading(false); // ← LIBERA A UI AQUI, sem esperar Firestore

      // ── Passo 2: enriquecer com dados do Firestore em background ──
      try {
        const [userDoc, clientDoc] = await Promise.all([
          getDoc(doc(db, "users", fUser.uid)),
          getDoc(doc(db, "clients", fUser.uid)),
        ]);

        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Criar perfil silenciosamente em background
          setDoc(doc(db, "users", fUser.uid), quickUser).catch(() => {});
        }

        if (clientDoc.exists()) {
          setClient(clientDoc.data() as Client);
          setNeedsPhoneLink(false);
        } else {
          setNeedsPhoneLink(true);
          setClient(null);
        }
      } catch {
        // Firestore falhou — usuário já está logado com dados do Auth, tudo bem
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!auth) return { ok: false, error: "Firebase não configurado." };
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ ok: boolean; error?: string }> => {
    if (!auth) return { ok: false, error: "Firebase não configurado." };
    try {
      if (!email || !password || !name) return { ok: false, error: "Preencha todos os campos." };
      if (name.trim().length < 2)       return { ok: false, error: "Nome muito curto." };
      if (password.length < 6)          return { ok: false, error: "Senha deve ter pelo menos 6 caracteres." };

      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;
      const newUser: User = {
        uid, name: name.trim(), email, role: "client",
        createdAt: new Date(), isActive: true,
      };
      await setDoc(doc(db, "users", uid), newUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
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

    const existing = await clientService.findByPhone('', sanitized);

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
        totalVisits: 0,
        totalSpent: 0,
        studioId: "",
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

  const signInWithGoogle = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!auth) return { ok: false, error: "Firebase não configurado." };
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  const signInWithApple = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!auth) return { ok: false, error: "Firebase não configurado." };
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      // Locale pt-BR para o fluxo Apple
      provider.setCustomParameters({ locale: "pt_BR" });
      await signInWithPopup(auth, provider);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapAuthError(err) };
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, client, loading, needsPhoneLink, signOut, signIn, signUp, signInWithGoogle, signInWithApple, linkOrCreateByPhone, resetPassword }}>
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
