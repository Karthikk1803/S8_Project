"use client";

import { useState, useEffect } from "react";
import { 
  Copy, ArrowDownToLine, ArrowUpFromLine, 
  Repeat, CreditCard, ChevronDown, CheckCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

interface WalletTx {
  id: number;
  txHash: string;
  toAddress: string;
  amountCredits: number;
  memo: string;
  signature: string;
  createdAt: string;
}

export default function WalletPage() {
  const { walletAddress, cryptoBalance, loading: sessionLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"tokens" | "activity">("tokens");
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    async function fetchTxs() {
      try {
        const res = await fetch("/api/wallet/transactions", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
        }
      } catch {
        // ignore
      } finally {
        setTxLoading(false);
      }
    }
    fetchTxs();
  }, []);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied to clipboard");
    }
  };

  const handleMockAction = (action: string) => {
    toast.success(`${action} feature is currently being upgraded on the ZeroWaste Network.`);
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in shadow-xl rounded-b-3xl border overflow-hidden relative min-h-[600px] flex flex-col" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
      {/* Wallet Header (MetaMask Style) */}
      <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-full transition-colors">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
            RECO Testnet <ChevronDown className="h-4 w-4 text-gray-400" />
          </span>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 border-2 border-white shadow-sm ring-2 ring-gray-100"></div>
      </div>

      {/* Account Info */}
      <div className="pb-6 pt-4 flex-none" style={{ background: "var(--card)" }}>
        <div className="text-center space-y-1 mb-6">
          <h2 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Account 1</h2>
          <div 
            onClick={copyAddress}
            className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-xs text-gray-600 font-mono"
          >
            {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : "0x000...0000"}
            <Copy className="h-3 w-3" />
          </div>
        </div>

        {/* Big Balance */}
        <div className="text-center mb-8">
          <p className="text-5xl font-bold tracking-tight text-gray-900 mb-1 flex items-center justify-center gap-2">
            {cryptoBalance.toFixed(4)} 
            <span className="text-2xl text-gray-500 mt-2 font-medium">ETH</span>
          </p>
          <p className="text-sm text-gray-500 font-medium">
            $ {(cryptoBalance * 3142.50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 px-6">
          <button onClick={() => handleMockAction("Buy")} className="flex flex-col items-center gap-2 group">
            <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center group-hover:bg-green-700 transition-colors shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-green-700">Buy</span>
          </button>
          
          <button onClick={() => handleMockAction("Send")} className="flex flex-col items-center gap-2 group">
            <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center group-hover:bg-green-700 transition-colors shadow-sm">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-green-700">Send</span>
          </button>

          <button onClick={() => handleMockAction("Swap")} className="flex flex-col items-center gap-2 group">
            <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center group-hover:bg-green-700 transition-colors shadow-sm">
              <Repeat className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-green-700">Swap</span>
          </button>

          <button onClick={() => handleMockAction("Receive")} className="flex flex-col items-center gap-2 group">
            <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center group-hover:bg-green-700 transition-colors shadow-sm">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-green-700">Receive</span>
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex-1 flex flex-col mt-2" style={{ background: "var(--card)" }}>
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab("tokens")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "tokens" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Tokens
          </button>
          <button 
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "activity" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "tokens" && (
            <div className="divide-y divide-gray-50">
              <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xl">Ξ</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Ethereum</p>
                  <p className="text-sm text-gray-500">{cryptoBalance.toFixed(4)} ETH</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-Medium text-gray-900">$ {(cryptoBalance * 3142.50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              
              <div className="p-6 text-center">
                <p className="text-xs text-gray-500 mb-4">Don&apos;t see your token?</p>
                <Button variant="outline" size="sm" onClick={() => handleMockAction("Import Tokens")} className="text-green-600 hover:text-green-700">
                  Import tokens
                </Button>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              {txLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  You have no transactions
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">Send</p>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Confirmed
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900 text-sm">-{((tx.amountCredits * 0.005).toFixed(4))} ETH</p>
                        <p className="text-xs text-gray-500 font-mono mt-1 w-20 truncate" title={tx.txHash}>{tx.txHash}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 text-center border-t border-gray-100 text-[10px] text-gray-400 bg-gray-50">
          Need help? <a href="#" className="text-green-600 hover:underline">Contact RECOPOINT Support</a>
        </div>
      </div>
    </div>
  );
}
