import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { reports, users, marketplaceItems, notifications } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/server/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminUser = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (adminUser?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reportId, startingPrice, durationHours } = await req.json();
    if (!reportId) return NextResponse.json({ error: "Missing reportId" }, { status: 400 });

    const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const now = new Date();
    const endsAt = new Date(now.getTime() + (durationHours || 12) * 60 * 60 * 1000).toISOString();

    const newItem = db.insert(marketplaceItems).values({
      sellerId: report.userId,
      title: `Wholesale ${report.wasteType} (${report.amount})`,
      description: `Bulk reported waste at ${report.location}. Geotagged and verified. Available for B2B collection.`,
      imagePath: report.imageDataUrl || "/uploads/placeholder.png",
      category: "wholesale_waste",
      startingPrice: Number(startingPrice) || 10,
      currentPrice: Number(startingPrice) || 10,
      status: "active",
      auctionEndsAt: endsAt,
    }).returning().get();

    db.update(reports).set({ status: "auctioned" }).where(eq(reports.id, report.id)).run();

    db.insert(notifications).values({
      userId: report.userId,
      message: `Your reported waste (${report.wasteType}) was highly valued and has been listed on the Marketplace!`,
      type: "system",
      isRead: 0,
    }).run();

    return NextResponse.json({ success: true, itemId: newItem.id });
  } catch (error) {
    console.error("Auction translation error:", error);
    return NextResponse.json({ error: "Failed to translate report to auction" }, { status: 500 });
  }
}
