import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { chatMessages, chatThreads } from "@/server/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { threadId: tidStr } = await params;
    const threadId = parseInt(tidStr, 10);
    if (isNaN(threadId)) return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });

    const thread = db.select().from(chatThreads).where(eq(chatThreads.id, threadId)).get();
    if (!thread || (thread.buyerId !== session.userId && thread.sellerId !== session.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = db
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        senderId: chatMessages.senderId,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(asc(chatMessages.createdAt))
      .all();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch thread messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
