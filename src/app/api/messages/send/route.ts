import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { chatMessages, chatThreads } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const sendMessageSchema = z.object({
  threadId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { threadId, content } = parsed.data;

    // Verify thread exists and user belongs to it
    const thread = db.select().from(chatThreads).where(eq(chatThreads.id, threadId)).get();
    if (!thread || (thread.buyerId !== session.userId && thread.sellerId !== session.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    db.insert(chatMessages).values({
      threadId,
      senderId: session.userId,
      content,
      createdAt: new Date().toISOString(),
    }).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
