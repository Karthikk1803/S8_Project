"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "@/components/hooks/useSession";

type SessionData = ReturnType<typeof useSession>;

const AuthContext = createContext<SessionData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
