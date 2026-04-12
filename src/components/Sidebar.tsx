"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Home, FileText, Trash2, Gift, Trophy, Settings, MessageSquare, X, Wallet, Store, Tag, ShieldCheck, User, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role, authenticated } = useAuth();
  
  const dynamicNavItems = [
    { href: "/", label: "Home", icon: Home, show: true },
    { href: "/marketplace", label: "Marketplace", icon: Store, show: true },
    { href: "/sell", label: "Sell Items", icon: Tag, show: role === "seller" || role === "admin" },
    { href: "/admin", label: "Admin Dashboard", icon: ShieldCheck, show: role === "admin" },
    { href: "/report", label: "Report Waste", icon: FileText, show: true },
    { href: "/collect", label: "Collect Waste", icon: Trash2, show: true },
    { href: "/rewards", label: "Rewards", icon: Gift, show: true },
    { href: "/wallet", label: "Wallet", icon: Wallet, show: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, show: true },
    { href: "/messages", label: "Messages", icon: MessageSquare, show: authenticated },
  ].filter(item => item.show);

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 pt-20 pb-4 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 border-r",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "var(--border)",
        }}
      >
        {/* Mobile close button */}
        <div className="flex justify-end px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Eco tip card */}
        <div className="mx-3 mb-4 p-3 rounded-xl border" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Eco Tip</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            A single recycled bottle saves enough energy to power a laptop for 2.5 hours! 🌍
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 mt-1 overflow-y-auto">
          {dynamicNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-green-500/10 text-green-700"
                    : "hover:bg-gray-100"
                )}
                style={!isActive ? { color: "var(--muted-foreground)" } : undefined}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110", 
                    isActive ? "text-green-600" : ""
                  )} 
                  style={!isActive ? { color: "var(--muted-foreground)" } : undefined}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="px-3 mt-auto pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === "/settings"
                ? "bg-green-500/10 text-green-700"
                : "hover:bg-gray-100"
            )}
            style={pathname !== "/settings" ? { color: "var(--muted-foreground)" } : undefined}
          >
            <Settings className={cn("h-5 w-5", pathname === "/settings" ? "text-green-600" : "")} style={pathname !== "/settings" ? { color: "var(--muted-foreground)" } : undefined} />
            Settings
          </Link>
          
          {/* Version badge */}
          <div className="mt-3 px-3 py-2">
            <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>RECOPOINT v2.0 · ZeroWaste Network</p>
          </div>
        </div>
      </aside>
    </>
  );
}
