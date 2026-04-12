import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const unread = db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, session.userId), eq(notifications.isRead, 0)))
      .orderBy(sql`${notifications.createdAt} desc`)
      .limit(20)
      .all();

    return NextResponse.json({ notifications: unread, count: unread.length });
  } catch (error: any) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
