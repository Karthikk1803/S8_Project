"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts";

const trendData = [
  { day: "Mon", recycled: 4000, active_users: 2400 },
  { day: "Tue", recycled: 3000, active_users: 1398 },
  { day: "Wed", recycled: 2000, active_users: 9800 },
  { day: "Thu", recycled: 2780, active_users: 3908 },
  { day: "Fri", recycled: 1890, active_users: 4800 },
  { day: "Sat", recycled: 2390, active_users: 3800 },
  { day: "Sun", recycled: 3490, active_users: 4300 },
];

interface LeaderboardUser {
  id: number;
  name: string;
  balance: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { user, loading: sessionLoading } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // We fetch from a simple endpoint; for now, call /api/auth/me
        // In a production app, there'd be a dedicated leaderboard endpoint.
        // Let's create a mock leaderboard from the limited data we have.
        const res = await fetch("/api/leaderboard", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setLeaders(data.leaders || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-gray-600";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className={`h-5 w-5 ${getRankColor(rank)}`} />;
    return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Medal className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Leaderboard</h1>
      </div>

      <div className="glass-card rounded-3xl p-6 border shadow-sm mb-8" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
           Market Trends
        </h2>
        <p className="text-xs text-gray-500 mb-6">Weekly platform waste recovery metrics</p>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecycled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="recycled" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRecycled)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card border rounded-2xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
        {leaders.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users yet. Be the first to earn credits!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  leader.id === user?.id ? "bg-green-50 border-l-4 border-green-500" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-10 flex justify-center">{getRankIcon(leader.rank)}</div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {leader.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center">
                    {leader.name}
                    {leader.id === user?.id && (
                      <Badge variant="default" className="ml-2 text-[10px]">You</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{leader.balance}</p>
                  <p className="text-xs text-gray-400">credits</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
