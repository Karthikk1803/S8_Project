"use client";

import { useState, useRef } from "react";
import { Upload, Camera, Send, Loader2, AlertTriangle, CheckCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SellPage() {
  const { role, authenticated, loading: sessionLoading } = useAuth();
  const router = useRouter();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [aiClassification, setAiClassification] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (sessionLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  if (!authenticated || (role !== "seller" && role !== "admin")) {
    return <div className="text-center p-12 bg-white rounded-2xl">Access Denied: Only Green Merchants can list items.</div>;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setAiClassification(null);
    setAiError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
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
      if (!res.ok) throw new Error(data.error || "Classification failed");
      
      setAiClassification(data.classification);
      toast.success("AI classification complete!");
    } catch (err: any) {
      setAiError(err.message);
      toast.error("Failed to reach AI server");
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !startingPrice || !imageFile || !aiClassification) {
      toast.error("Please complete all fields and verify image with AI");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append("image", imageFile);
      const uploadRes = await fetch("/api/marketplace/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // 2. Create item
      const createRes = await fetch("/api/marketplace/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startingPrice: parseInt(startingPrice, 10),
          category,
          imagePath: uploadData.imagePath,
          aiClassification: JSON.stringify(aiClassification),
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create listing");

      toast.success("Item submitted to Admin for approval!");
      router.push("/marketplace");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: "var(--foreground)" }}>
          <Tag className="h-8 w-8 text-green-600" />
          List New Item
        </h1>
        <p className="text-gray-500 mt-2">Upload your recycled or upcycled item for auction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image & AI */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--foreground)" }}>Item Photo</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-colors h-64 flex flex-col items-center justify-center relative overflow-hidden"
            >
              {!imagePreview ? (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="text-gray-600 font-medium text-sm">Drop or click to upload</p>
                </div>
              ) : (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {imagePreview && !aiClassification && (
              <Button
                onClick={handleClassify}
                disabled={classifying}
                variant="blue"
                className="w-full mt-4"
              >
                {classifying ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2" /> Verify with ZeroWaste AI</>
                )}
              </Button>
            )}

            {aiError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            )}

            {aiClassification && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 text-sm">AI Verification Passed</h3>
                </div>
                <div className="text-xs text-green-800 space-y-1">
                  <p><strong>Detected:</strong> {aiClassification.wasteType}</p>
                  <p><strong>Confidence:</strong> {(aiClassification.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Recyclable:</strong> {aiClassification.recyclable ? "Yes" : "No"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Item Details */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border space-y-5" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--foreground)" }}>Item Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input 
                placeholder="E.g. Upcycled Denim Jacket" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full min-h-[120px] rounded-md border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe the materials used, condition, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="recycled_goods">Recycled Goods</option>
                  <option value="upcycled_fashion">Upcycled Fashion</option>
                  <option value="electronics">Electronics</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price (Credits)</label>
                <Input 
                  type="number"
                  min="1"
                  placeholder="E.g. 50" 
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-gray-100">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !aiClassification || !title || !description || !startingPrice}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> List for Auction</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
