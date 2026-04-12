"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Filter, ShoppingBag, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  imagePath: string;
  category: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  auctionEndsAt: string | null;
  sellerName: string;
  bidCount: number;
}

export default function MarketplaceBrowsePage() {
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetch("/api/marketplace/items")
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(item => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: "var(--foreground)" }}>
            <ShoppingBag className="h-8 w-8 text-green-600" />
            ZeroWaste Marketplace
          </h1>
          <p className="text-gray-500 mt-2">Discover and bid on upcycled, recycled, and zero-waste goods.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full md:w-64 bg-white"
            />
          </div>
          <select 
            className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="recycled_goods">Recycled Goods</option>
            <option value="upcycled_fashion">Upcycled Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl border p-5 flex flex-col h-[350px]" style={{ borderColor: "var(--border)" }}>
              <div className="h-48 w-full bg-gray-200 animate-pulse rounded-xl mb-4" style={{ background: "var(--secondary)" }}></div>
              <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded mb-2" style={{ background: "var(--secondary)" }}></div>
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded mb-2" style={{ background: "var(--secondary)" }}></div>
              <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded mt-auto" style={{ background: "var(--secondary)" }}></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          No items found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isAuctionActive = item.status === "active" && item.auctionEndsAt && new Date(item.auctionEndsAt) > new Date();
            
            return (
              <div 
                key={item.id} 
                onClick={() => router.push(`/marketplace/${item.id}`)}
                className="group glass-card rounded-2xl border overflow-hidden hover:shadow-xl transition-all cursor-pointer flex flex-col"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img 
                    src={item.imagePath} 
                    alt={item.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.status === "sold" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg">Sold</span>
                    </div>
                  )}
                  {item.status === "expired" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-gray-500 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg">Ended</span>
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {item.description}
                  </p>
                  
                  <div className="pt-4 border-t border-gray-100 flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Current Bid</p>
                      <p className="text-lg font-bold text-green-600">{item.currentPrice} Credits</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md">
                        {isAuctionActive ? (
                          <><Clock className="h-3 w-3" /> Live Auction</>
                        ) : (
                          <span>{item.bidCount} Bids</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
