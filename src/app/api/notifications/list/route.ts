import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userNotifs = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(10)
      .all();

    return NextResponse.json({ notifications: userNotifs });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
