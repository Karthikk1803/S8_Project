"use client";

import { useState, useEffect, use } from "react";
import { Clock, ShieldCheck, ArrowLeft, Loader2, User, Trophy, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Bid {
  id: number;
  amount: number;
  createdAt: string;
  bidderName: string;
}

interface Item {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  imagePath: string;
  category: string;
  aiClassification: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  auctionEndsAt: string | null;
  sellerName: string;
  winnerId: number | null;
}

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, authenticated, loading: sessionLoading } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [bidAmount, setBidAmount] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/marketplace/items/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItem(data.item);
      setBids(data.bids || []);
      if (data.item.currentPrice) {
        setBidAmount((data.item.currentPrice + 1).toString());
      }
    } catch (err) {
      toast.error("Failed to load item");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (!item || item.status !== "active" || !item.auctionEndsAt) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(item.auctionEndsAt!).getTime();
      const dist = end - now;

      if (dist < 0) {
        setTimeLeft("Auction Ended");
        clearInterval(interval);
        // Soft refresh to trigger lazy eval
        fetchItem();
        return;
      }

      const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((dist % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [item]);

  const handlePlaceBid = async () => {
    if (!authenticated) {
      toast.error("Please login to place a bid");
      return;
    }
    const amountNum = parseInt(bidAmount, 10);
    if (!amountNum || amountNum <= (item?.currentPrice || 0)) {
      toast.error("Bid must be higher than current price");
      return;
    }

    setPlacingBid(true);
    try {
      const res = await fetch("/api/bids/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: parseInt(id, 10), amount: amountNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Bid placed successfully!");
      fetchItem(); // Refresh item + bids
    } catch (err: any) {
      toast.error(err.message || "Failed to place bid");
    } finally {
      setPlacingBid(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!authenticated) {
      toast.error("Please login to message the seller");
      return;
    }
    setStartingChat(true);
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: item?.sellerId, itemId: item?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/messages?thread=${data.threadId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start chat");
      setStartingChat(false);
    }
  };

  if (loading || sessionLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  if (!item) return <div className="text-center p-12">Item not found</div>;

  const aiMeta = item.aiClassification ? JSON.parse(item.aiClassification) : null;
  const isWinner = user?.id === item.winnerId;
  const isSeller = user?.id === item.sellerId;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button 
        onClick={() => router.push("/marketplace")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Browse
      </button>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="w-full md:w-1/2 min-h-[400px] bg-gray-50 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 p-8">
          <img 
            src={item.imagePath} 
            alt={item.title} 
            className="w-full max-h-[500px] object-contain rounded-xl shadow-lg"
          />
          {item.status === "sold" && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm shadow-md flex items-center gap-1">
              <Trophy className="h-4 w-4" /> Sold
            </div>
          )}
        </div>

        {/* Right: Details & Bidding panel */}
        <div className="w-full md:w-1/2 p-8 flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-gray-500 uppercase tracking-wide text-[10px]">{item.category}</Badge>
            {aiMeta?.recyclable && (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">♻️ Verified Recyclable</Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{item.title}</h1>
          
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg w-max">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Listed by <strong className="text-gray-900 font-medium">{item.sellerName}</strong></span>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 mt-auto">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Current Price</p>
                <div className="text-4xl font-black text-green-600 tracking-tight">
                  {item.currentPrice} <span className="text-lg text-green-700 font-bold ml-1">C</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Starting Price: {item.startingPrice} C</p>
              </div>

              {item.status === "active" && (
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ends In</p>
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <Clock className="h-4 w-4" /> {timeLeft || "Calculating..."}
                  </div>
                </div>
              )}
            </div>

            {/* Auction Controls */}
            {item.status === "active" ? (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">C</span>
                  <Input 
                    type="number" 
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    className="pl-8 h-12 text-lg font-semibold bg-white border-2 focus:ring-0 focus:border-green-500 transition-colors"
                  />
                </div>
                <Button 
                  onClick={handlePlaceBid} 
                  disabled={placingBid}
                  className="h-12 px-8 bg-green-600 hover:bg-green-700 text-base shadow-lg shadow-green-200"
                >
                  {placingBid ? <Loader2 className="h-5 w-5 animate-spin" /> : "Place Bid"}
                </Button>
              </div>
            ) : item.status === "sold" ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-bold text-green-900 mb-1">Auction Won!</h3>
                <p className="text-sm text-green-700">Winning Bid: {item.currentPrice} C</p>
                
                {isWinner && (
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 shadow-lg" size="lg">
                    <CreditCard className="mr-2 h-4 w-4" /> Pay Seller Direct
                  </Button>
                )}
                {isSeller && (
                  <div className="mt-4 text-sm font-medium text-green-800 bg-green-100 py-2 rounded-lg">
                    Waiting for buyer to pay {item.currentPrice} C
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm font-medium">
                This auction has {item.status}.
              </div>
            )}
            
            {/* Contact Seller Button */}
            {!isSeller && (
              <Button 
                variant="outline" 
                onClick={handleMessageSeller}
                disabled={startingChat}
                className="w-full mt-3 bg-white hover:bg-gray-50"
              >
                {startingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Message Seller
              </Button>
            )}
          </div>

          {/* Bid History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center justify-between">
              Bid History <Badge variant="secondary" className="font-mono">{bids.length}</Badge>
            </h3>
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
              {bids.length === 0 ? (
                <p className="text-sm text-gray-400 italic bg-gray-50 py-3 rounded-lg text-center">No bids placed yet.</p>
              ) : (
                bids.map((bid, i) => (
                  <div key={bid.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{bid.bidderName}</span>
                      {i === 0 && item.status === "active" && <Badge variant="default" className="bg-green-100 text-green-700 text-[10px] scale-90">Highest</Badge>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{bid.amount} C</p>
                      <p className="text-[10px] text-gray-400">{new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
