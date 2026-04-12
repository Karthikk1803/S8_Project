import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

const markReadSchema = z.object({
  notificationId: z.number().optional(),
  all: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { notificationId, all } = parsed.data;

    if (all) {
      db.update(notifications)
        .set({ isRead: 1 })
        .where(eq(notifications.userId, session.userId))
        .run();
    } else if (notificationId) {
      db.update(notifications)
        .set({ isRead: 1 })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, session.userId)
          )
        )
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
