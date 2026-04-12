import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { marketplaceItems, bids } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const bidSchema = z.object({
  itemId: z.number().int().positive(),
  amount: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = bidSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { itemId, amount } = parsed.data;

    const item = db.select().from(marketplaceItems).where(eq(marketplaceItems.id, itemId)).get();
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    
    if (item.status !== "active") return NextResponse.json({ error: "Auction is not active" }, { status: 400 });
    
    if (item.auctionEndsAt && new Date(item.auctionEndsAt) < new Date()) {
      db.update(marketplaceItems).set({ status: "expired" }).where(eq(marketplaceItems.id, itemId)).run();
      return NextResponse.json({ error: "Auction has ended" }, { status: 400 });
    }

    if (amount <= item.currentPrice) return NextResponse.json({ error: "Bid must be higher than current price" }, { status: 400 });

    db.transaction(() => {
      db.insert(bids).values({
        itemId,
        bidderId: session.userId,
        amount,
        createdAt: new Date().toISOString()
      }).run();

      db.update(marketplaceItems).set({ currentPrice: amount }).where(eq(marketplaceItems.id, itemId)).run();
    });

    return NextResponse.json({ success: true, currentPrice: amount });
  } catch (error: any) {
    console.error("Place bid error:", error);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
