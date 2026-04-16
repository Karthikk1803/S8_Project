"use client";

import { useState, useEffect } from "react";
import { Trash2, MapPin, Clock, CheckCircle, Play, Loader2 } from "lucide-react";
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
  const { user, role, authenticated, loading: sessionLoading, refetch } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

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

  const handleMarkCollected = async (taskId: number) => {
    setCompletingId(taskId);
    try {
      const res = await fetch("/api/tasks/update-status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: taskId, status: "verified" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Collected! Earned ${data.creditsEarned} credits! 🎉`);
      refetch();
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as collected");
    } finally {
      setCompletingId(null);
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
                  {task.status === "in_progress" && role === "admin" && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkCollected(task.id)}
                      disabled={completingId === task.id}
                    >
                      {completingId === task.id ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Completing...</>
                      ) : (
                        <><CheckCircle className="h-3 w-3" /> Mark as Collected</>
                      )}
                    </Button>
                  )}
                  {task.status === "verified" && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" /> Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
