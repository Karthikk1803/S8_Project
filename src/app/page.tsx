"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Leaf, ArrowRight, Globe, Recycle, Coins, TreePine, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

interface ImpactStats {
  wasteCollected: number;
  reportsSubmitted: number;
  tokensEarned: number;
  co2Offset: number;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

const ECO_TIPS = [
  { emoji: "♻️", tip: "Recycling one aluminum can saves enough energy to run a TV for 3 hours." },
  { emoji: "🌊", tip: "8 million tons of plastic end up in our oceans every year — your actions matter." },
  { emoji: "🌱", tip: "Composting at home can divert 30% of household waste from landfills." },
  { emoji: "💡", tip: "LED bulbs use 75% less energy and last 25 times longer than incandescent ones." },
  { emoji: "🛍️", tip: "One reusable bag replaces over 700 single-use plastic bags in its lifetime." },
  { emoji: "🌍", tip: "If food waste were a country, it'd be the 3rd largest greenhouse gas emitter." },
];

export default function HomePage() {
  const { authenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ImpactStats>({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0,
  });
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate eco tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ECO_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const animWaste = useAnimatedCounter(stats.wasteCollected);
  const animReports = useAnimatedCounter(stats.reportsSubmitted);
  const animTokens = useAnimatedCounter(stats.tokensEarned);
  const animCo2 = useAnimatedCounter(Math.round(stats.co2Offset));

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/reports/recent", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const reports = data.reports || [];
          const reportsCount = reports.length;
          let wasteCount = 0;
          reports.forEach((r: any) => {
            const match = r.amount.match(/\d+/);
            if (match) wasteCount += parseInt(match[0]);
          });

          const balRes = await fetch("/api/ledger/balance", { credentials: "include" });
          const balData = balRes.ok ? await balRes.json() : { balance: 0 };

          setStats({
            wasteCollected: wasteCount,
            reportsSubmitted: reportsCount,
            tokensEarned: balData.balance || 0,
            co2Offset: parseFloat((wasteCount * 0.5).toFixed(1)),
          });
        }
      } catch {
        // stats remain at default
      }
    }
    if (authenticated) fetchStats();
  }, [authenticated]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden hero-gradient rounded-3xl p-8 md:p-16 mb-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse" />
              <div className="absolute inset-4 rounded-full border-2 border-green-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-8 rounded-full border-2 border-green-600 animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute inset-12 rounded-full border-2 border-green-700 animate-pulse" style={{ animationDelay: "1.5s" }} />
              <Globe className="absolute inset-0 m-auto h-24 w-24 text-green-600 animate-float" />
            </div>
          </div>
          {/* Floating particles */}
          <div className="absolute top-10 left-[20%] w-3 h-3 bg-green-400/30 rounded-full animate-float" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-20 left-[40%] w-2 h-2 bg-emerald-400/30 rounded-full animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute top-20 right-[30%] w-4 h-4 bg-teal-400/20 rounded-full animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 animate-glow">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--foreground)" }}>
            Turn <span className="gradient-text">Waste</span> into <span className="gradient-text">Rewards</span>
          </h1>
          <p className="text-lg mb-8 max-w-lg" style={{ color: "var(--muted-foreground)" }}>
            Report waste, earn credits, and make a real impact on the environment. Join the zero-waste revolution with RECOPOINT.
          </p>
          {!loading && (
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="lg"
                onClick={() => router.push(authenticated ? "/report" : "/login")}
                className="text-base px-8 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all"
              >
                {authenticated ? "Report Waste" : "Get Started"}
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
              {!authenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/marketplace")}
                  className="text-base px-8"
                >
                  Browse Marketplace
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Eco Tips Carousel */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
            {ECO_TIPS[tipIndex].emoji} Did You Know?
          </p>
          <p className="text-sm truncate" style={{ color: "var(--muted-foreground)" }} key={tipIndex}>
            {ECO_TIPS[tipIndex].tip}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {ECO_TIPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === tipIndex ? "w-4 bg-green-500" : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      </div>

      {/* Impact Cards with Animated Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Recycle,
            label: "Waste Collected",
            value: animWaste,
            unit: "items",
            color: "text-green-600",
            bg: "from-green-500/10 to-emerald-500/10",
            border: "border-green-200/50",
          },
          {
            icon: TrendingUp,
            label: "Reports Submitted",
            value: animReports,
            unit: "reports",
            color: "text-blue-600",
            bg: "from-blue-500/10 to-cyan-500/10",
            border: "border-blue-200/50",
          },
          {
            icon: Coins,
            label: "Tokens Earned",
            value: animTokens,
            unit: "credits",
            color: "text-amber-600",
            bg: "from-amber-500/10 to-orange-500/10",
            border: "border-amber-200/50",
          },
          {
            icon: TreePine,
            label: "CO₂ Offset",
            value: animCo2,
            unit: "kg",
            color: "text-emerald-600",
            bg: "from-emerald-500/10 to-teal-500/10",
            border: "border-emerald-200/50",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border ${card.border} group cursor-default`}
            >
              <div className={`bg-gradient-to-br ${card.bg} h-12 w-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold animate-counter" style={{ color: "var(--foreground)" }}>
                {card.value}
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* How It Works + Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>How It Works</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Report", desc: "Upload a photo of waste and our AI identifies it automatically.", icon: "📸" },
              { step: "2", title: "Collect", desc: "Pick up reported waste tasks and verify with photo proof.", icon: "🗑️" },
              { step: "3", title: "Earn", desc: "Earn credits for every report and collection you complete.", icon: "💰" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 group">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Features */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>Platform Features</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, label: "AI Detection", desc: "YOLO-powered waste recognition" },
              { icon: Coins, label: "Token Economy", desc: "Earn & redeem green credits" },
              { icon: Users, label: "Community", desc: "Leaderboards & achievements" },
              { icon: Globe, label: "Marketplace", desc: "Auction upcycled goods" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="p-4 rounded-xl border transition-all duration-200 hover:shadow-md" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                  <Icon className="h-6 w-6 text-green-600 mb-2" />
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
