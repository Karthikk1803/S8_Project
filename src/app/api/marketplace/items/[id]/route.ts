import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { marketplaceItems, users, bids } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });

    const itemRow = db
      .select({
        id: marketplaceItems.id,
        sellerId: marketplaceItems.sellerId,
        title: marketplaceItems.title,
        description: marketplaceItems.description,
        imagePath: marketplaceItems.imagePath,
        aiClassification: marketplaceItems.aiClassification,
        category: marketplaceItems.category,
        startingPrice: marketplaceItems.startingPrice,
        currentPrice: marketplaceItems.currentPrice,
        status: marketplaceItems.status,
        auctionEndsAt: marketplaceItems.auctionEndsAt,
        winnerId: marketplaceItems.winnerId,
        sellerName: users.name,
        sellerEmail: users.email,
      })
      .from(marketplaceItems)
      .innerJoin(users, eq(marketplaceItems.sellerId, users.id))
      .where(eq(marketplaceItems.id, itemId))
      .get();

    if (!itemRow) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Lazy evaluation for auction expiry
    if (itemRow.status === "active" && itemRow.auctionEndsAt && new Date(itemRow.auctionEndsAt) < new Date()) {
      const highestBid = db.select().from(bids).where(eq(bids.itemId, itemId)).orderBy(desc(bids.amount)).get();
      const newStatus = highestBid ? "sold" : "expired";
      const winnerId = highestBid ? highestBid.bidderId : null;
      db.update(marketplaceItems).set({ status: newStatus, winnerId }).where(eq(marketplaceItems.id, itemId)).run();
      itemRow.status = newStatus;
      itemRow.winnerId = winnerId;
    }

    const bidHistory = db
      .select({
        id: bids.id,
        amount: bids.amount,
        createdAt: bids.createdAt,
        bidderId: bids.bidderId,
        bidderName: users.name,
      })
      .from(bids)
      .innerJoin(users, eq(bids.bidderId, users.id))
      .where(eq(bids.itemId, itemId))
      .orderBy(desc(bids.createdAt))
      .all();

    return NextResponse.json({ item: itemRow, bids: bidHistory });
  } catch (error: any) {
    console.error("Fetch single item error:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}
