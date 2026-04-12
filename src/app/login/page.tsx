"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refetch } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body: any = { email, password };
      if (mode === "signup") body.name = name;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      await refetch();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePioneerLogin = async () => {
    setLoading(true);
    try {
      // Try to login as pioneer user
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pioneer@recopoint.in", password: "buyer1234" }),
      });

      if (!res.ok) {
        // If pioneer user doesn't exist, create it
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "pioneer@recopoint.in", name: "Eco Pioneer", password: "buyer1234" }),
        });
        if (!signupRes.ok) {
          const data = await signupRes.json();
          throw new Error(data.error);
        }
      }

      toast.success("Logged in as Eco Pioneer!");
      await refetch();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Pioneer login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center -m-4 lg:-m-8">
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #065f46, #047857, #059669, #10b981)" }} />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white/10 rounded-full animate-float" />
        <div className="absolute top-[60%] left-[80%] w-3 h-3 bg-white/10 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[30%] left-[70%] w-5 h-5 bg-white/5 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[80%] left-[20%] w-3 h-3 bg-white/10 rounded-full animate-float" style={{ animationDelay: "3s" }} />
      </div>
      
      <div className="w-full max-w-md px-4">
        <div className="glass-card rounded-3xl shadow-2xl p-8 animate-fade-in" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)" }}>
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 animate-glow">
              <Leaf className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>RECOPOINT</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Zero-waste management platform</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "var(--secondary)" }}>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === "login" ? "bg-white shadow-sm" : ""
              }`}
              style={mode === "login" ? { color: "var(--foreground)", background: "var(--card)" } : { color: "var(--muted-foreground)" }}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === "signup" ? "bg-white shadow-sm" : ""
              }`}
              style={mode === "signup" ? { color: "var(--foreground)", background: "var(--card)" } : { color: "var(--muted-foreground)" }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Password</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full shadow-lg shadow-green-500/20" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </form>

          {/* Quick login + Guest */}
          <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={handlePioneerLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-colors"
              style={{ color: "var(--primary)", background: "rgba(22, 163, 74, 0.05)" }}
            >
              <Sparkles className="h-4 w-4" />
              Quick Login (Eco Pioneer)
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full text-xs text-center py-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Continue as Guest — Browse without login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
