"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, MapPin, Clock, CheckCircle, Play, Upload, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

interface Task {
  id: number;
  location: string;
  wasteType: string;
  amount: string;
  status: string;
  createdAt: string;
  userId: number;
  collectorId: number | null;
  reporterName: string;
}

export default function CollectPage() {
  const { user, authenticated, loading: sessionLoading, refetch } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyImage, setVerifyImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks/list", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) fetchTasks();
  }, [authenticated]);

  const handleStartCollection = async (taskId: number) => {
    try {
      const res = await fetch("/api/tasks/update-status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: taskId, status: "in_progress" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Collection started!");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to start collection");
    }
  };

  const handleVerifyAndComplete = async (taskId: number) => {
    if (!verifyImage) {
      toast.error("Please upload a verification photo");
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      // Classify the verification image
      const formData = new FormData();
      formData.append("image", verifyImage);
      const classifyRes = await fetch("/api/classify", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const classifyData = await classifyRes.json();

      if (!classifyRes.ok) {
        toast.error(classifyData.error || "AI verification failed");
        if (classifyData.hint) {
          toast.error(classifyData.hint, { duration: 5000 });
        }
        return;
      }

      if (!classifyData.classification) {
        toast.error("AI could not classify the image");
        return;
      }

      const { wasteType, confidence } = classifyData.classification;

      // Verify: wasteType matches and confidence >= 0.70
      const typeMatches = wasteType.toLowerCase() === task.wasteType.toLowerCase();
      const confPasses = confidence >= 0.70;

      if (!typeMatches || !confPasses) {
        toast.error(
          `Verification failed. Detected: ${wasteType} (${(confidence * 100).toFixed(0)}%). ` +
          `Expected: ${task.wasteType} with ≥70% confidence.`
        );
        return;
      }

      // Mark as verified
      const updateRes = await fetch("/api/tasks/update-status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: taskId, status: "verified" }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error);

      toast.success(`Verified! Earned ${updateData.creditsEarned} credits! 🎉`);
      setVerifyingId(null);
      setVerifyImage(null);
      refetch();
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <Trash2 className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Collect Waste</h1>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border" style={{ borderColor: "var(--border)" }}>
          <Trash2 className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
          <h3 className="text-lg font-medium" style={{ color: "var(--muted-foreground)" }}>No tasks available</h3>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Check back later for waste reports to collect</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="glass-card rounded-2xl p-6 border" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{task.wasteType}</h3>
                    <Badge
                      variant={
                        task.status === "verified" ? "default" :
                        task.status === "in_progress" ? "blue" : "secondary"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {task.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> {task.amount}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <span>Reported by {task.reporterName}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {task.status === "pending" && task.userId !== user?.id && (
                    <Button size="sm" onClick={() => handleStartCollection(task.id)}>
                      <Play className="h-3 w-3" /> Start Collection
                    </Button>
                  )}
                  {task.status === "in_progress" && task.collectorId === user?.id && (
                    <Button
                      size="sm"
                      variant="blue"
                      onClick={() => {
                        setVerifyingId(task.id);
                        setVerifyImage(null);
                      }}
                    >
                      <CheckCircle className="h-3 w-3" /> Complete & Verify
                    </Button>
                  )}
                  {task.status === "verified" && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" /> Completed
                    </div>
                  )}
                </div>
              </div>

              {/* Verification modal inline */}
              {verifyingId === task.id && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Upload proof photo:</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      {verifyImage ? verifyImage.name : "Choose Photo"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setVerifyImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="blue"
                      disabled={!verifyImage}
                      onClick={() => handleVerifyAndComplete(task.id)}
                    >
                      Verify with AI
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setVerifyingId(null); setVerifyImage(null); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
