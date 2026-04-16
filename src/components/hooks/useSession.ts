"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin" | "moderator";
  walletAddress: string;
  cryptoBalance: number;
}

interface SessionData {
  user: SessionUser | null;
  walletAddress: string | null;
  cryptoBalance: number;
  balance: number;
  role: "buyer" | "seller" | "admin" | "moderator";
  loading: boolean;
  authenticated: boolean;
  refetch: () => Promise<void>;
}

// ─── In-memory session cache (persists across page navigations) ───
let cachedSession: {
  user: SessionUser | null;
  walletAddress: string | null;
  cryptoBalance: number;
  balance: number;
  role: "buyer" | "seller" | "admin" | "moderator";
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 30_000; // 30s stale-while-revalidate

function getCachedSession() {
  if (!cachedSession) return null;
  return cachedSession;
}

function setCachedSession(data: Omit<NonNullable<typeof cachedSession>, "timestamp">) {
  cachedSession = { ...data, timestamp: Date.now() };
}

function isCacheStale() {
  if (!cachedSession) return true;
  return Date.now() - cachedSession.timestamp > CACHE_TTL_MS;
}

export function useSession(): SessionData {
  const cached = getCachedSession();
  const [user, setUser] = useState<SessionUser | null>(cached?.user || null);
  const [walletAddress, setWalletAddress] = useState<string | null>(cached?.walletAddress || null);
  const [balance, setBalance] = useState<number>(cached?.balance || 0);
  const [cryptoBalance, setCryptoBalance] = useState<number>(cached?.cryptoBalance || 0);
  const [role, setRole] = useState<"buyer" | "seller" | "admin" | "moderator">(cached?.role || "buyer");
  // If we have a cached session, skip the loading state entirely
  const [loading, setLoading] = useState(!cached);

  const applyData = useCallback((data: any) => {
    setUser(data.user);
    setWalletAddress(data.user.walletAddress || null);
    setCryptoBalance(data.user.cryptoBalance || 0);
    setRole(data.user.role || "buyer");
    setBalance(data.balance || 0);
    setCachedSession({
      user: data.user,
      walletAddress: data.user.walletAddress || null,
      cryptoBalance: data.user.cryptoBalance || 0,
      balance: data.balance || 0,
      role: data.user.role || "buyer",
    });
  }, []);

  const clearData = useCallback(() => {
    setUser(null);
    setWalletAddress(null);
    setCryptoBalance(0);
    setRole("buyer");
    setBalance(0);
    cachedSession = null;
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        applyData(data);
      } else {
        clearData();
      }
    } catch {
      clearData();
    } finally {
      setLoading(false);
    }
  }, [applyData, clearData]);

  useEffect(() => {
    if (cached && !isCacheStale()) {
      // Use cached data immediately, no loading state
      setLoading(false);
      // Background revalidate
      fetchSession();
    } else {
      fetchSession();
    }
  }, [fetchSession]);

  return { user, walletAddress, cryptoBalance, balance, role, loading, authenticated: !!user, refetch: fetchSession };
}
