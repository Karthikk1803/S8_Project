"use client";

import { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownRight, ShoppingBag, Loader2, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import PaymentModal from "@/components/PaymentModal";
import toast from "react-hot-toast";

const REWARD_CATALOG = [
  { id: 1, name: "Eco Tote Bag", cost: 30, description: "Reusable organic cotton tote bag", emoji: "👜" },
  { id: 2, name: "Plant a Sapling", cost: 50, description: "Sponsor planting a native tree sapling", emoji: "🌱" },
  { id: 3, name: "Bamboo Straw Set", cost: 40, description: "Set of 6 reusable bamboo straws", emoji: "🥤" },
  { id: 4, name: "Recycled Notebook", cost: 20, description: "A5 notebook made from recycled paper", emoji: "📓" },
  { id: 5, name: "Solar Keychain Light", cost: 60, description: "Mini solar-powered LED keychain", emoji: "🔦" },
  { id: 6, name: "Compost Starter Kit", cost: 75, description: "Home composting starter with instructions", emoji: "🌿" },
];

interface LedgerEntry {
  id: number;
  entryType: string;
  amountCredits: number;
  description: string;
  createdAt: string;
}

export default function RewardsPage() {
  const { balance, authenticated, loading: sessionLoading, refetch } = useAuth();
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/ledger/transactions", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) fetchTransactions();
  }, [authenticated]);

  const handleRedeem = async (reward: typeof REWARD_CATALOG[0]) => {
    if (balance < reward.cost) {
      toast.error("Insufficient credits");
      return;
    }
    setRedeeming(reward.id);
    try {
      const res = await fetch("/api/ledger/redeem", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardName: reward.name, cost: reward.cost }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`🎉 Redeemed "${reward.name}"! ${reward.cost} credits deducted.`);
      await refetch();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Redemption failed");
    } finally {
      setRedeeming(null);
    }
  };

  const isCredit = (type: string) => 
    ["earn_report", "earn_collect", "purchase_upi", "transfer_in"].includes(type);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>Rewards</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-1">Available Balance</p>
            <div className="flex items-center gap-2">
              <Coins className="h-8 w-8" />
              <span className="text-4xl font-bold">{balance}</span>
              <span className="text-green-200 text-lg">credits</span>
            </div>
          </div>
          <Button
            onClick={() => setPaymentOpen(true)}
            className="bg-white text-green-700 hover:bg-green-50"
          >
            <CreditCard className="h-4 w-4" /> Buy Credits
          </Button>
        </div>
      </div>

      {/* Quick buy buttons */}
      <div className="flex gap-3 mb-6">
        {[100, 500].map((amt) => (
          <Button
            key={amt}
            variant="outline"
            onClick={() => setPaymentOpen(true)}
            className="flex-1"
          >
            Buy ₹{amt} ({Math.floor(amt / 10)} credits)
          </Button>
        ))}
      </div>

      {/* Convert Tokens to Crypto */}
      <div className="glass-card border rounded-2xl p-6 mb-8 mt-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> Convert tokens to RECO ETH
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Rate: 1 Credit = 0.005 ETH. Converted funds will appear in your Wallet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              disabled={balance < 10 || redeeming === 999}
              onClick={async () => {
                setRedeeming(999);
                try {
                  const creditsToConvert = 10; // Simple fixed block conversion for demo
                  const res = await fetch("/api/ledger/convert-to-crypto", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ creditsToConvert }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  toast.success(`Converted ${data.creditsConverted} credits for ${data.cryptoGained.toFixed(4)} ETH!`);
                  await refetch();
                  fetchTransactions();
                } catch (err: any) {
                  toast.error(err.message || "Failed to convert");
                } finally {
                  setRedeeming(null);
                }
              }}
            >
              {redeeming === 999 ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convert 10 Tokens to ETH"}
            </Button>
          </div>
        </div>
      </div>

      {/* Why RECO Tokens Justification */}
      <div className="glass-card border rounded-2xl p-6 mb-8 text-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          💡 Why do we use &quot;RECO Tokens&quot; instead of direct Cash or Crypto payouts?
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 mt-3">
          <li><strong>Micro-Transactions:</strong> Traditional bank UPI transfers and Ethereum gas fees are too high for tiny rewards. If you recycle a bottle worth ₹0.50, the transaction fee itself would cost more. A centralized ledger credit allows us to reward you instantly, for free!</li>
          <li><strong>Closed-Loop Green Economy:</strong> Direct cash could be spent on anything. By keeping rewards in Tokens, we can curate an Eco-Catalog (bags, trees, bamboo straws) ensuring the platform&apos;s value actively drives sustainable green initiatives.</li>
          <li><strong>Gamification:</strong> Virtual tokens enable seamless Leaderboards, badges, and milestones, fueling community engagement far better than isolated crypto balances.</li>
        </ul>
        <p className="mt-4 text-xs font-semibold text-gray-500 italic">
          However, you can still bridge your value by converting tokens back to crypto at any time!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--foreground)" }}>Transaction History</h2>
          <div className="glass-card border rounded-2xl divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No transactions yet</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isCredit(tx.entryType) ? "bg-green-50" : "bg-red-50"
                  }`}>
                    {isCredit(tx.entryType) ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    isCredit(tx.entryType) ? "text-green-600" : "text-red-600"
                  }`}>
                    {isCredit(tx.entryType) ? "+" : "-"}{tx.amountCredits}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reward Catalog */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--foreground)" }}>Redeem Rewards</h2>
          <div className="grid gap-3">
            {REWARD_CATALOG.map((reward) => (
              <div key={reward.id} className="glass-card border rounded-2xl p-4 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-3xl">{reward.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{reward.name}</h3>
                  <p className="text-xs text-gray-500">{reward.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-600">{reward.cost} credits</p>
                  <Button
                    size="sm"
                    variant={balance >= reward.cost ? "default" : "secondary"}
                    disabled={balance < reward.cost || redeeming === reward.id}
                    onClick={() => handleRedeem(reward)}
                    className="mt-1"
                  >
                    {redeeming === reward.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <><ShoppingBag className="h-3 w-3" /> Redeem</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onBalanceUpdate={() => { refetch(); fetchTransactions(); }}
      />
    </div>
  );
}
