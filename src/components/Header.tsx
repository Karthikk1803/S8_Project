"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf, Menu, Search, Bell, Coins, LogIn, LogOut, User, Settings, ChevronDown, Moon, Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

interface HeaderProps {
  onToggleSidebar: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function Header({ onToggleSidebar, theme, onToggleTheme }: HeaderProps) {
  const { user, balance, authenticated, loading, refetch } = useAuth();
  const router = useRouter();
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState<any[]>([]);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/notifications/unread", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setNotifCount(data.count || 0))
      .catch(() => {});
      
    fetch("/api/notifications/list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setNotifList(data.notifications || []))
      .catch(() => {});
  }, [authenticated]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refetch();
    toast.success("Logged out");
    router.push("/login");
  };

  return (
    <header className="glass border-b border-gray-200 sticky top-0 z-50 transition-all duration-300" style={{ background: "var(--glass-bg)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow duration-300">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>RECOPOINT</h1>
              <p className="text-[10px] leading-none -mt-0.5" style={{ color: "var(--muted-foreground)" }}>Zero Waste Platform</p>
            </div>
          </Link>
        </div>

        {/* Center: Search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              const q = formData.get("q");
              if (q) router.push(`/marketplace?q=${encodeURIComponent(q.toString())}`);
            }}
            className="w-full relative"
          >
            <Input
              name="q"
              placeholder="Search marketplace items..."
              className="rounded-full border-gray-200 focus:ring-green-500 w-full pl-10"
              style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={onToggleTheme} title="Toggle theme" className="transition-transform duration-200 hover:rotate-12">
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
            )}
          </Button>

          {authenticated && (
            <>
              {/* Notifications */}
              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="icon" className="relative" onClick={() => {
                    if (notifCount > 0) {
                      fetch("/api/notifications/mark-read", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ all: true }),
                      }).then(() => setNotifCount(0));
                    }
                  }}>
                    <Bell className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 animate-counter">
                        {notifCount}
                      </span>
                    )}
                  </Button>
                }
              >
                <div className="w-[320px] p-0 -mx-1 -my-1">
                  <div className="px-4 py-3 border-b rounded-t-md" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                    <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Notifications</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifList.length === 0 ? (
                      <div className="p-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No notifications yet</div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {notifList.map(n => (
                          <div key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-green-50/30' : ''}`}>
                            <p className={`text-sm ${!n.isRead ? 'font-medium' : ''}`} style={{ color: !n.isRead ? "var(--foreground)" : "var(--muted-foreground)" }}>
                              {n.message}
                            </p>
                            <span className="text-[10px] mt-1 block" style={{ color: "var(--muted-foreground)" }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenu>

              {/* Balance pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-green-200/50">
                <Coins className="h-4 w-4" />
                <span>{balance}</span>
              </div>

              {/* User dropdown */}
              <DropdownMenu
                trigger={
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {user?.name}
                    </span>
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                  </Button>
                }
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenu>
            </>
          )}
          {!authenticated && !loading && (
            <Button onClick={() => router.push("/login")} className="gap-2 shadow-lg shadow-green-500/20">
              <LogIn className="h-4 w-4" /> Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
