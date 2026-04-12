"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Wallet, Copy, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onBalanceUpdate: () => void;
}

type Tab = "upi" | "blockchain";

const TREASURY_ADDRESS = "0x000000000000000000000000000000000000dead";

export default function PaymentModal({ open, onClose, onBalanceUpdate }: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>("upi");
  const [amountINR, setAmountINR] = useState(100);
  
  // Instant client-side state
  const [sessionTxId, setSessionTxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  // Blockchain state
  const [bcAmount, setBcAmount] = useState(10);
  const [bcLoading, setBcLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  // Auto-generate transaction ID
  useEffect(() => {
    if (open) {
      setSessionTxId(`TX${Date.now()}${Math.floor(Math.random() * 1000)}`);
    }
  }, [open, tab]);

  if (!open) return null;

  const upiUrl = `upi://pay?pa=recopoint@upi&pn=GreenMerchant&am=${amountINR}&cu=INR&tr=${sessionTxId}`;

  const confirmPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/upi/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: sessionTxId,
          paid: true,
          utr: "RBN" + Date.now().toString().slice(-6),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setConfirmed(true);
      setReceipt(data.receipt);
      toast.success(`${data.creditsAdded} credits added successfully!`);
      onBalanceUpdate();
      
      // Auto close after 1.5s
      setTimeout(() => {
        resetState();
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockchainSend = async () => {
    setBcLoading(true);
    try {
      const liveTxHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      
      const confirmRes = await fetch("/api/payment/blockchain/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditsToBuy: bcAmount,
          txHash: liveTxHash,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error);

      setTxHash(confirmData.txHash);
      toast.success(`${confirmData.creditsAdded} credits added! Cost: ${confirmData.costInCrypto.toFixed(3)} RECO ETH`);
      onBalanceUpdate();
      
      setTimeout(() => {
        resetState();
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Network transaction failed");
    } finally {
      setBcLoading(false);
    }
  };

  const resetState = () => {
    setConfirmed(false);
    setReceipt(null);
    setTxHash("");
    setSessionTxId(`TX${Date.now()}${Math.floor(Math.random() * 1000)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-col border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-xl font-bold text-gray-900">Add Account Credits</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" onClick={() => { resetState(); onClose(); }}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex px-4 gap-4 mt-2">
            <button
              onClick={() => { setTab("upi"); resetState(); }}
              className={`flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-all relative ${
                tab === "upi" ? "text-green-700" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <CreditCard className="h-4 w-4" /> Instant UPI
              {tab === "upi" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full shadow-[0_-2px_8px_rgba(22,163,74,0.5)]" />}
            </button>
            <button
              onClick={() => { setTab("blockchain"); resetState(); }}
              className={`flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-all relative ${
                tab === "blockchain" ? "text-indigo-700" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Wallet className="h-4 w-4" /> ZeroWaste Network
              {tab === "blockchain" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.5)]" />}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* UPI Tab */}
          {tab === "upi" && (
            <div className="space-y-6">
              {!confirmed ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Load Amount (₹)</label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[100, 500, 1000].map((amt) => (
                        <Button
                          key={amt}
                          variant={amountINR === amt ? "default" : "outline"}
                          className={amountINR === amt ? "bg-green-600 hover:bg-green-700 shadow-md font-bold border-0" : "bg-white font-medium"}
                          onClick={() => setAmountINR(amt)}
                        >
                          ₹{amt}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <Input
                        type="number"
                        min={10}
                        value={amountINR}
                        onChange={(e) => setAmountINR(Number(e.target.value))}
                        className="pl-8 h-12 text-lg font-bold bg-white border-gray-300 focus:border-green-500 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center bg-white border border-gray-100 shadow-sm rounded-xl p-6">
                    <div className="mb-4 bg-white p-2 border-2 border-green-100 rounded-2xl shadow-inner">
                      <QRCodeCanvas 
                        value={upiUrl} 
                        size={180} 
                        bgColor={"#ffffff"} 
                        fgColor={"#0f172a"} 
                        level={"Q"}
                        includeMargin={false}
                      />
                    </div>
                    
                    <p className="text-sm font-medium text-gray-600 mb-1">Scan with GPay, PhonePe, or Paytm</p>
                    <p className="text-xs text-gray-400 mb-4 font-mono">TX: {sessionTxId}</p>
                    
                    <Button 
                      onClick={confirmPayment} 
                      disabled={loading || amountINR < 10} 
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-base font-bold shadow-lg shadow-green-200"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                      Verify Transaction
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4 animate-in zoom-in duration-300 flex flex-col items-center">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <CheckCircle className="h-12 w-12 text-green-500 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Payment Verified!</h3>
                  <p className="text-green-600 font-medium bg-green-50 px-4 py-1.5 rounded-full inline-block">
                    +{receipt?.credits} Credits Loaded
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Blockchain Tab */}
          {tab === "blockchain" && (
            <div className="space-y-6">
              {!txHash ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Credits to Purchase</label>
                    <div className="relative mb-2">
                      <Input
                        type="number"
                        min={1}
                        value={bcAmount}
                        onChange={(e) => setBcAmount(Number(e.target.value))}
                        className="h-12 text-lg font-bold bg-white border-gray-300 focus:border-indigo-500 rounded-lg shadow-sm"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        <Wallet className="h-3 w-3" /> C
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-3 bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-gray-500 font-medium">Network Treasury</span>
                      <span className="font-mono text-indigo-600 font-medium truncate max-w-[150px]">{TREASURY_ADDRESS}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleBlockchainSend} 
                    disabled={bcLoading || bcAmount < 1} 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-base font-bold shadow-lg shadow-indigo-200"
                  >
                    {bcLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ArrowRight className="h-5 w-5 mr-2" />}
                    Authorize Web3 Transfer
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 space-y-4 animate-in zoom-in duration-300 flex flex-col items-center">
                  <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <CheckCircle className="h-12 w-12 text-indigo-500 animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Contract Executed</h3>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 w-full text-left">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Receipt Hash</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{txHash}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
