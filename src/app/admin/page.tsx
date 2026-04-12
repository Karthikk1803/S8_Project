"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Loader2, ShieldCheck, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

interface PendingItem {
  id: number;
  title: string;
  description: string;
  imagePath: string;
  category: string;
  startingPrice: number;
  sellerName: string;
  createdAt: string;
}

export default function AdminPage() {
  const { role, authenticated, loading: sessionLoading } = useAuth();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [reportList, setReportList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [reportPrices, setReportPrices] = useState<Record<number, number>>({});
  const [approving, setApproving] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"items" | "reports">("items");

  const fetchDashboardData = async () => {
    try {
      const [itemsRes, reportsRes] = await Promise.all([
        fetch("/api/admin/items"),
        fetch("/api/admin/reports")
      ]);
      const itemsData = await itemsRes.json();
      const reportsData = await reportsRes.json();
      
      setItems(itemsData.items || []);
      setReportList(reportsData.reports || []);
      
      const defaultDurations: Record<number, number> = {};
      (itemsData.items || []).forEach((item: PendingItem) => {
        defaultDurations[item.id] = 12;
      });
      setDurations(defaultDurations);
      
      const defaultPrices: Record<number, number> = {};
      (reportsData.reports || []).forEach((r: any) => {
        defaultPrices[r.id] = 10;
      });
      setReportPrices(defaultPrices);
    } catch {
      toast.error("Failed to load admin payload");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && role === "admin") {
      fetchDashboardData();
    }
  }, [authenticated, role]);

  if (sessionLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  if (!authenticated || role !== "admin") {
    return <div className="text-center p-12 bg-white rounded-2xl">Access Denied: Platform Administrator only.</div>;
  }

  const handleApprove = async (id: number) => {
    setApproving(id);
    try {
      const durationHours = durations[id] || 12;
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, durationHours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Item approved for auction!");
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    } finally {
      setApproving(null);
    }
  };

  const handleAuctionReport = async (reportId: number) => {
    setApproving(reportId);
    try {
      const startingPrice = reportPrices[reportId] || 10;
      const res = await fetch("/api/admin/reports/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, startingPrice, durationHours: 24 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Report successfully translated to live Marketplace auction!");
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || "Auction translation failed");
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: "var(--foreground)" }}>
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-2">Review pending marketplace items and start auctions.</p>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1 mb-6 max-w-sm">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "items" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Tag className="h-4 w-4" /> Marketplace Pending
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "reports" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="h-4 w-4" /> Waste Reports
        </button>
      </div>

      <div className="glass-card rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "var(--border)" }}>
        {activeTab === "items" && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Approvals ({items.length})
              </h2>
            </div>
    
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3 opacity-20" />
                <p>All caught up! No items pending approval.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map(item => (
                  <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="h-32 w-32 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imagePath} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                        <span className="font-mono font-medium text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          ID: {item.id}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                        <p><strong className="text-gray-900">Seller:</strong> {item.sellerName}</p>
                        <p><strong className="text-gray-900">Starting Price:</strong> <span className="text-green-600 font-bold">{item.startingPrice} C</span></p>
                        <p><strong className="text-gray-900">Category:</strong> {item.category}</p>
                      </div>
                    </div>
    
                    <div className="shrink-0 w-full md:w-48 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Duration</label>
                        <select 
                          className="w-full text-sm border-gray-200 rounded-md shadow-sm bg-white"
                          value={durations[item.id] || 12}
                          onChange={(e) => setDurations({...durations, [item.id]: parseInt(e.target.value, 10)})}
                        >
                          <option value={1}>1 Hour (Fast Track)</option>
                          <option value={6}>6 Hours</option>
                          <option value={12}>12 Hours</option>
                          <option value={24}>24 Hours</option>
                          <option value={48}>48 Hours</option>
                        </select>
                      </div>
                      
                      <Button 
                        onClick={() => handleApprove(item.id)}
                        disabled={approving === item.id}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {approving === item.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Approve & Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "reports" && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Raw Waste Reports ({reportList.length})
              </h2>
            </div>
    
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : reportList.length === 0 ? (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3 opacity-20" />
                <p>No user reports available to auction.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reportList.map(report => (
                  <div key={report.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="h-32 w-32 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={report.imageDataUrl} alt={report.wasteType} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{report.wasteType}</h3>
                        <span className="font-mono font-medium text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          R-ID: {report.id}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                        Location: <span className="font-medium text-gray-900">{report.location}</span>
                      </p>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                        <p><strong className="text-gray-900">Reporter:</strong> {report.reporterName}</p>
                        <p><strong className="text-gray-900">Amount:</strong> <span className="text-amber-600 font-bold">{report.amount}</span></p>
                        <p><strong className="text-gray-900">Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
    
                    <div className="shrink-0 w-full md:w-48 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Start Price (Credits)</label>
                        <input
                          type="number" 
                          min="1"
                          className="w-full text-sm border-gray-200 rounded-md shadow-sm bg-white"
                          value={reportPrices[report.id] || 10}
                          onChange={(e) => setReportPrices({...reportPrices, [report.id]: parseInt(e.target.value, 10)})}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleAuctionReport(report.id)}
                        disabled={approving === report.id}
                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      >
                        {approving === report.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                        List to Market
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
