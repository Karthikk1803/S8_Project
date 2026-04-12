import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { reports, users, ledgerEntries } from "@/server/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Total reports count
    const reportRows = await db.select({ count: sql<number>`count(*)` }).from(reports);
    const totalReports = reportRows[0]?.count || 0;

    // Total verified reports
    const verifiedRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(sql`${reports.status} = 'verified'`);
    const verifiedReports = verifiedRows[0]?.count || 0;

    // Total users
    const userRows = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalUsers = userRows[0]?.count || 0;

    // Total credits earned (sum of positive ledger entries)
    const creditRows = await db
      .select({ total: sql<number>`coalesce(sum(${ledgerEntries.amountCredits}), 0)` })
      .from(ledgerEntries)
      .where(sql`${ledgerEntries.entryType} IN ('earn_report', 'earn_collect')`);
    const totalCreditsEarned = creditRows[0]?.total || 0;

    // Estimate waste collected from report amounts
    let totalWasteItems = 0;
    const allReports = await db.select({ amount: reports.amount }).from(reports);
    allReports.forEach((r) => {
      const match = r.amount.match(/\d+/);
      if (match) totalWasteItems += parseInt(match[0]);
    });

    return NextResponse.json({
      totalReports,
      verifiedReports,
      totalUsers,
      totalCreditsEarned,
      totalWasteItems,
      co2OffsetKg: parseFloat((totalWasteItems * 0.5).toFixed(1)),
      treesEquivalent: Math.floor(totalWasteItems * 0.02),
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({
      totalReports: 0,
      verifiedReports: 0,
      totalUsers: 0,
      totalCreditsEarned: 0,
      totalWasteItems: 0,
      co2OffsetKg: 0,
      treesEquivalent: 0,
    });
  }
}
