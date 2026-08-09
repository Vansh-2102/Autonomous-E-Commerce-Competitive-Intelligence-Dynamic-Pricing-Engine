"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import Cookies from "js-cookie";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        Cookies.set("auth_token", token, { expires: 7, path: "/" });
      } else {
        Cookies.remove("auth_token", { path: "/" });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      const token = await result.user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7, path: "/" });
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      const token = await result.user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7, path: "/" });
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user && name) {
      await updateProfile(result.user, { displayName: name });
    }
    if (result.user) {
      const token = await result.user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7, path: "/" });
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    Cookies.remove("auth_token", { path: "/" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
