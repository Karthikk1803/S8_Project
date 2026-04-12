import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { marketplaceItems, users, bids } from "@/server/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const createItemSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  imagePath: z.string().startsWith("/"),
  aiClassification: z.string(),
  startingPrice: z.number().int().positive(),
  category: z.string().default("general"),
});

export async function GET(req: NextRequest) {
  try {
    // Only fetch active or approved items for browse
    // Include user details and max bid (currentPrice) and bid counts
    const items = db
      .select({
        id: marketplaceItems.id,
        title: marketplaceItems.title,
        description: marketplaceItems.description,
        imagePath: marketplaceItems.imagePath,
        category: marketplaceItems.category,
        startingPrice: marketplaceItems.startingPrice,
        currentPrice: marketplaceItems.currentPrice,
        status: marketplaceItems.status,
        auctionEndsAt: marketplaceItems.auctionEndsAt,
        sellerName: users.name,
        bidCount: sql<number>`(SELECT COUNT(*) FROM ${bids} WHERE ${bids.itemId} = ${marketplaceItems.id})`
      })
      .from(marketplaceItems)
      .innerJoin(users, eq(marketplaceItems.sellerId, users.id))
      .where(sql`${marketplaceItems.status} IN ('active', 'sold', 'expired')`)
      .orderBy(desc(marketplaceItems.createdAt))
      .all();

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Fetch items error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Must be seller or admin to list item
    const userRow = db.select({ role: users.role }).from(users).where(eq(users.id, session.userId)).get();
    if (!userRow || (userRow.role !== "seller" && userRow.role !== "admin")) {
      return NextResponse.json({ error: "Only sellers can list items" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, description, imagePath, aiClassification, startingPrice, category } = parsed.data;

    const res = db.insert(marketplaceItems).values({
      sellerId: session.userId,
      title,
      description,
      imagePath,
      aiClassification,
      category,
      startingPrice,
      currentPrice: startingPrice,
      status: "pending", // Requires admin approval
      createdAt: new Date().toISOString()
    }).run();

    return NextResponse.json({ success: true, itemId: res.lastInsertRowid });
  } catch (error: any) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
