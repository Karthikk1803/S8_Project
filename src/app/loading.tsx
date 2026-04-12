import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm animate-fade-in" style={{ background: "rgba(0,0,0,0.1)" }}>
      <div className="flex flex-col items-center gap-4 glass-card p-6 rounded-2xl shadow-xl border" style={{ borderColor: "var(--border)" }}>
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-sm font-medium animate-pulse" style={{ color: "var(--muted-foreground)" }}>Loading content...</p>
      </div>
    </div>
  );
}
