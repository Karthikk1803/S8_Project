"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Camera, MapPin, AlertTriangle, CheckCircle, Loader2, Send, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { searchLocations } from "@/lib/location/autocomplete";
import toast from "react-hot-toast";

interface DetectedObject {
  class: string;
  waste_type: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface Classification {
  wasteType: string;
  confidence: number;
  detectedObjects: DetectedObject[];
  recyclable: boolean;
  points: number;
  objectCount: number;
  modelMatch?: boolean;
}

/* ── Radial Confidence Gauge ──────────────────────────────── */
function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value * circumference);
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{pct}%</span>
        <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Confidence</span>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const { authenticated, loading: sessionLoading, refetch } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent reports
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/reports/recent", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setRecentReports(data.reports || []))
      .catch(() => {});
  }, [authenticated]);

  // Try geolocation
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) return;

    const timeout = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoStatus(`Using current location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setGeoStatus(null);
        },
        { timeout: 4000 }
      );
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const processFile = (file: File) => {
    setImageFile(file);
    setClassification(null);
    setAiError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleClassify = async () => {
    if (!imageFile) return;
    setClassifying(true);
    setAiError(null);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch("/api/classify", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Classification failed");
        if (data.hint) setAiError((prev) => prev + "\n💡 " + data.hint);
        toast.error("AI classification failed");
        return;
      }
      if (data.classification) {
        setClassification(data.classification);
        toast.success("AI classification complete!");
      }
    } catch (err: any) {
      setAiError("Network error reaching AI server");
      toast.error("Failed to reach AI server");
    } finally {
      setClassifying(false);
    }
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !classification?.detectedObjects) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    classification.detectedObjects.forEach((obj) => {
      const [x1, y1, x2, y2] = obj.bbox;
      const w = x2 - x1;
      const h = y2 - y1;

      // Green stroke
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, w, h);

      // Label background
      const label = `${obj.class} ${(obj.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 14px sans-serif";
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x1, y1 - 22, textWidth + 8, 22);

      // Label text
      ctx.fillStyle = "#000000";
      ctx.fillText(label, x1 + 4, y1 - 6);
    });

    // "✓ AI Detected" chip
    ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
    ctx.beginPath();
    ctx.roundRect(canvas.width - 140, 10, 130, 28, 8);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("✓ AI Detected", canvas.width - 130, 30);
  }, [classification]);

  useEffect(() => {
    if (classification?.detectedObjects && imgRef.current) {
      if (imgRef.current.complete) {
        drawBoundingBoxes();
      } else {
        imgRef.current.onload = drawBoundingBoxes;
      }
    }
  }, [classification, drawBoundingBoxes]);

  const handleLocationInput = (value: string) => {
    setLocation(value);
    if (value.length >= 2) {
      setLocationSuggestions(searchLocations(value));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!classification || !location) {
      toast.error("Complete all fields first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          wasteType: classification.wasteType,
          amount: `${classification.objectCount} item(s)`,
          verificationResultJson: JSON.stringify(classification),
          points: classification.points,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Report submitted! Earned ${data.pointsEarned} credits 🎉`);
      setImageFile(null);
      setImagePreview(null);
      setClassification(null);
      setLocation("");
      refetch();
      // Refresh recent reports
      const recentRes = await fetch("/api/reports/recent", { credentials: "include" });
      const recentData = await recentRes.json();
      setRecentReports(recentData.reports || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Report Waste</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Upload a photo and let AI classify it</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image upload + preview */}
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`glass-card border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragOver ? "border-green-500 bg-green-50/30 scale-[1.01]" : "border-gray-300 hover:border-green-500 hover:bg-green-50/10"
            }`}
            style={{ borderColor: dragOver ? undefined : "var(--border)" }}
          >
            {!imagePreview ? (
              <div className="space-y-3 py-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-medium" style={{ color: "var(--foreground)" }}>Drop or click to upload waste image</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Supports JPG, PNG, WebP</p>
              </div>
            ) : (
              <div className="relative">
                {classification?.detectedObjects ? (
                  <canvas ref={canvasRef} className="w-full rounded-xl" />
                ) : (
                  <img ref={imgRef} src={imagePreview} alt="Preview" className="w-full rounded-xl" />
                )}
                {/* Hidden img for canvas drawing */}
                {classification?.detectedObjects && (
                  <img ref={imgRef} src={imagePreview} alt="" className="hidden" />
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {imagePreview && !classification && (
            <Button
              onClick={handleClassify}
              disabled={classifying}
              variant="blue"
              className="w-full shadow-lg shadow-blue-500/20"
            >
              {classifying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI...</>
              ) : (
                <><Zap className="h-4 w-4" /> Verify with AI</>
              )}
            </Button>
          )}

          {aiError && (
            <div className="rounded-xl p-4 border" style={{ background: "rgba(239, 68, 68, 0.05)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-medium">AI Server Error</p>
                  <p className="text-xs text-red-600 mt-1 whitespace-pre-line">{aiError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI results + location + submit */}
        <div className="space-y-4">
          {classification && (
            <div className="glass-card rounded-2xl p-6 space-y-4 border" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>AI Classification Result</h3>
              </div>

              {/* Confidence Gauge + Stats side by side */}
              <div className="flex items-center gap-6">
                <ConfidenceGauge value={classification.confidence} />
                <div className="flex-1 space-y-2">
                  <div className="p-3 rounded-xl" style={{ background: "var(--secondary)" }}>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Waste Type</p>
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{classification.wasteType}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl" style={{ background: "var(--secondary)" }}>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Objects</p>
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>{classification.objectCount}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "var(--secondary)" }}>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Points</p>
                      <p className="font-semibold text-green-600">{classification.points}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Badge variant={classification.recyclable ? "default" : "warning"}>
                {classification.recyclable ? "♻️ Recyclable" : "⚠️ Non-recyclable"}
              </Badge>

              {!classification.modelMatch && (
                <div className="rounded-xl p-3 flex items-start gap-2 mt-2" style={{ background: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.2)" }}>
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-tight">
                    <strong>AI Note:</strong> The model had low confidence or no clear detections for this specific image. Providing a general waste classification fallback.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <div className="relative">
            <label className="flex items-center gap-1 text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              <MapPin className="inline h-4 w-4" />
              Location
            </label>
            {geoStatus && (
              <p className="text-xs text-green-600 mb-1">{geoStatus}</p>
            )}
            <Input
              value={location}
              onChange={(e) => handleLocationInput(e.target.value)}
              onFocus={() => location.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for a location..."
              style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 glass-card rounded-xl shadow-lg max-h-48 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                {locationSuggestions.map((loc) => (
                  <button
                    key={loc}
                    onMouseDown={() => { setLocation(loc); setShowSuggestions(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-green-50/50"
                    style={{ color: "var(--foreground)" }}
                  >
                    <MapPin className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          {classification && (
            <Button
              onClick={handleSubmitReport}
              disabled={submitting || !location}
              className="w-full shadow-lg shadow-green-500/20"
              size="lg"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Report</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--foreground)" }}>Recent Reports</h2>
          <div className="glass-card rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "var(--secondary)" }}>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Location</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Type</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Amount</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Status</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((r) => (
                    <tr key={r.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>{r.location}</td>
                      <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>{r.wasteType}</td>
                      <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>{r.amount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "verified" ? "default" : r.status === "in_progress" ? "blue" : "secondary"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
