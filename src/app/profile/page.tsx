"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2, User, Award, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const data = [
  { name: "Oct", spent: 400, earned: 240, recycled: 12 },
  { name: "Nov", spent: 300, earned: 139, recycled: 8 },
  { name: "Dec", spent: 200, earned: 980, recycled: 35 },
  { name: "Jan", spent: 278, earned: 390, recycled: 15 },
  { name: "Feb", spent: 189, earned: 480, recycled: 21 },
  { name: "Mar", spent: 239, earned: 380, recycled: 19 },
];

export default function ProfilePage() {
  const { user, balance, role, loading: sessionLoading } = useAuth();

  if (sessionLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-12 text-center text-gray-500">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
        {/* Profile Card */}
        <div className="glass-card rounded-3xl p-8 border shadow-sm w-full md:w-1/3 text-center flex flex-col items-center" style={{ borderColor: "var(--border)" }}>
          <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-green-400 to-indigo-500 flex items-center justify-center shadow-inner mb-6 relative">
            <User className="h-14 w-14 text-white" />
            <div className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Award className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-1 capitalize" style={{ color: "var(--foreground)" }}>{user.name}</h1>
          <p className="text-gray-500 mb-4">{user.email}</p>
          
          <div className="inline-flex px-4 py-1.5 rounded-full bg-gray-50 text-gray-700 font-medium text-sm mb-6 uppercase tracking-widest">
            {role}
          </div>

          <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
            <div>
              <p className="text-2xl font-bold text-green-600">{balance}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Credits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">110</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Recycled</p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="flex-1 w-full glass-card rounded-3xl p-8 border shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-indigo-500" /> Spending Analysis
              </h2>
              <p className="text-sm text-gray-500 mt-1">Your credit activity over the last 6 months</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="earned" name="Credits Earned" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="spent" name="Credits Spent" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
