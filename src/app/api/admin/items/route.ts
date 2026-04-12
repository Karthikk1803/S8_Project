import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { marketplaceItems, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRow = db.select({ role: users.role }).from(users).where(eq(users.id, session.userId)).get();
    if (!userRow || userRow.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const items = db
      .select({
        id: marketplaceItems.id,
        title: marketplaceItems.title,
        description: marketplaceItems.description,
        imagePath: marketplaceItems.imagePath,
        aiClassification: marketplaceItems.aiClassification,
        category: marketplaceItems.category,
        startingPrice: marketplaceItems.startingPrice,
        status: marketplaceItems.status,
        createdAt: marketplaceItems.createdAt,
        sellerName: users.name,
      })
      .from(marketplaceItems)
      .innerJoin(users, eq(marketplaceItems.sellerId, users.id))
      .where(eq(marketplaceItems.status, "pending"))
      .orderBy(desc(marketplaceItems.createdAt))
      .all();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Admin fetch items error:", error);
    return NextResponse.json({ error: "Failed to fetch pending items" }, { status: 500 });
  }
}
