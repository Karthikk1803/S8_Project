import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { users, ledgerEntries } from "@/server/db/schema";
import { sql, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all users
    const allUsers = db.select().from(users).all();

    const ADD_TYPES = ["earn_report", "earn_collect", "purchase_upi", "transfer_in"];
    const SUB_TYPES = ["redeem", "transfer_out"];

    // Optimize N+1 query: Fetch all aggregate balances in a single query
    const allAggregates = db
      .select({
        userId: ledgerEntries.userId,
        entryType: ledgerEntries.entryType,
        total: sql<number>`sum(${ledgerEntries.amountCredits})`,
      })
      .from(ledgerEntries)
      .groupBy(ledgerEntries.userId, ledgerEntries.entryType)
      .all();

    const leaders = allUsers.map((u) => {
      let balance = 0;
      // Find aggregates for this user
      const userAggs = allAggregates.filter((agg) => agg.userId === u.id);
      
      for (const row of userAggs) {
        if (ADD_TYPES.includes(row.entryType)) balance += row.total;
        else if (SUB_TYPES.includes(row.entryType)) balance -= row.total;
      }

      return { id: u.id, name: u.name, balance };
    });

    // Sort by balance descending and add rank
    leaders.sort((a, b) => b.balance - a.balance);
    const ranked = leaders.map((l, i) => ({ ...l, rank: i + 1 }));

    return NextResponse.json({ leaders: ranked });
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
