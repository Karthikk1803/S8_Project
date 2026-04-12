"use client";

import { useState } from "react";
import { Settings as SettingsIcon, User, Mail, Save, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, walletAddress, loading: sessionLoading, refetch } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when user loads
  if (user && !initialized) {
    setName(user.name);
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profile updated!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-7 w-7 text-gray-600" />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Settings</h1>
      </div>

      <div className="glass-card border rounded-2xl p-6 space-y-6" style={{ borderColor: "var(--border)" }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4" /> Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4" /> Email
              </label>
              <Input value={user?.email || ""} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet</h2>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Wallet className="h-4 w-4" /> Wallet Address
            </label>
            <Input value={walletAddress || ""} disabled className="bg-gray-50 font-mono text-xs" />
            <p className="text-xs text-gray-400 mt-1">ZeroWaste Network wallet address (auto-generated)</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
