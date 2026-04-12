import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { chatThreads } from "@/server/db/schema";
import { getSession } from "@/server/auth/session";
import { or, and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId } = await req.json();
    if (!recipientId) return NextResponse.json({ error: "Missing recipientId" }, { status: 400 });

    // Check if thread already exists between these two
    let thread = db.select().from(chatThreads).where(
      or(
        and(eq(chatThreads.buyerId, session.userId), eq(chatThreads.sellerId, recipientId)),
        and(eq(chatThreads.buyerId, recipientId), eq(chatThreads.sellerId, session.userId))
      )
    ).get();

    if (!thread) {
      // Create new thread
      thread = db.insert(chatThreads).values({
        buyerId: session.userId,
        sellerId: recipientId,
      }).returning().get();
    }

    return NextResponse.json({ threadId: thread.id });
  } catch (error) {
    console.error("Thread creation error:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
