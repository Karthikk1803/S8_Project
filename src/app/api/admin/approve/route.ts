import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { marketplaceItems, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const approveSchema = z.object({
  itemId: z.number().int().positive(),
  durationHours: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRow = db.select({ role: users.role }).from(users).where(eq(users.id, session.userId)).get();
    if (!userRow || userRow.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { itemId, durationHours } = parsed.data;

    const auctionEndsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    db.update(marketplaceItems)
      .set({ status: "active", auctionEndsAt })
      .where(eq(marketplaceItems.id, itemId))
      .run();

    return NextResponse.json({ success: true, auctionEndsAt });
  } catch (error) {
    console.error("Admin approve error:", error);
    return NextResponse.json({ error: "Failed to approve item" }, { status: 500 });
  }
}
