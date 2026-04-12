import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { chatThreads, chatMessages, users, marketplaceItems } from "@/server/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const createThreadSchema = z.object({
  sellerId: z.number().int().positive(),
  itemId: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const threads = db
      .select({
        id: chatThreads.id,
        buyerId: chatThreads.buyerId,
        sellerId: chatThreads.sellerId,
        itemId: chatThreads.itemId,
        createdAt: chatThreads.createdAt,
      })
      .from(chatThreads)
      .where(or(eq(chatThreads.buyerId, session.userId), eq(chatThreads.sellerId, session.userId)))
      .orderBy(desc(chatThreads.createdAt))
      .all();

    // Enrich with other party info and latest message
    const enrichedThreads = threads.map(t => {
      const isBuyer = t.buyerId === session.userId;
      const otherPartyId = isBuyer ? t.sellerId : t.buyerId;

      const otherParty = db.select({ name: users.name }).from(users).where(eq(users.id, otherPartyId)).get();
      
      const latestMsg = db
        .select({ content: chatMessages.content, createdAt: chatMessages.createdAt })
        .from(chatMessages)
        .where(eq(chatMessages.threadId, t.id))
        .orderBy(desc(chatMessages.createdAt))
        .get();

      let itemTitle = null;
      if (t.itemId) {
        const item = db.select({ title: marketplaceItems.title }).from(marketplaceItems).where(eq(marketplaceItems.id, t.itemId)).get();
        if (item) itemTitle = item.title;
      }

      return {
        id: t.id,
        otherPartyName: otherParty?.name || "Unknown User",
        itemTitle,
        latestMessage: latestMsg?.content || "No messages yet",
        updatedAt: latestMsg?.createdAt || t.createdAt,
      };
    });

    // Sort by latest message time
    enrichedThreads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ threads: enrichedThreads });
  } catch (error) {
    console.error("Fetch threads error:", error);
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createThreadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { sellerId, itemId } = parsed.data;

    if (sellerId === session.userId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Check if thread exists
    let existingThread;
    if (itemId) {
      existingThread = db.select().from(chatThreads)
        .where(and(
          eq(chatThreads.buyerId, session.userId),
          eq(chatThreads.sellerId, sellerId),
          eq(chatThreads.itemId, itemId)
        )).get();
    } else {
      existingThread = db.select().from(chatThreads)
        .where(and(
          eq(chatThreads.buyerId, session.userId),
          eq(chatThreads.sellerId, sellerId)
        )).get();
    }

    if (existingThread) {
      return NextResponse.json({ threadId: existingThread.id });
    }

    // Create new
    const res = db.insert(chatThreads).values({
      buyerId: session.userId,
      sellerId,
      itemId: itemId || null,
      createdAt: new Date().toISOString()
    }).run();

    return NextResponse.json({ threadId: res.lastInsertRowid });
  } catch (error) {
    console.error("Create thread error:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
