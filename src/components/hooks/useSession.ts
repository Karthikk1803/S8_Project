"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin";
  walletAddress: string;
  cryptoBalance: number;
}

interface SessionData {
  user: SessionUser | null;
  walletAddress: string | null;
  cryptoBalance: number;
  balance: number;
  role: "buyer" | "seller" | "admin";
  loading: boolean;
  authenticated: boolean;
  refetch: () => Promise<void>;
}

export function useSession(): SessionData {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [cryptoBalance, setCryptoBalance] = useState<number>(0);
  const [role, setRole] = useState<"buyer" | "seller" | "admin">("buyer");
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setWalletAddress(data.user.walletAddress || null);
        setCryptoBalance(data.user.cryptoBalance || 0);
        setRole(data.user.role || "buyer");
        setBalance(data.balance || 0);
      } else {
        setUser(null);
        setWalletAddress(null);
        setCryptoBalance(0);
        setRole("buyer");
        setBalance(0);
      }
    } catch {
      setUser(null);
      setWalletAddress(null);
      setCryptoBalance(0);
      setRole("buyer");
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { user, walletAddress, cryptoBalance, balance, role, loading, authenticated: !!user, refetch: fetchSession };
}
