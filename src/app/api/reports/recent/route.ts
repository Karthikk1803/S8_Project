import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { reports, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rows = db
      .select({
        id: reports.id,
        location: reports.location,
        wasteType: reports.wasteType,
        amount: reports.amount,
        status: reports.status,
        createdAt: reports.createdAt,
        userId: reports.userId,
      })
      .from(reports)
      .where(eq(reports.userId, session.userId))
      .orderBy(desc(reports.createdAt))
      .limit(20)
      .all();

    return NextResponse.json({ reports: rows });
  } catch (error: any) {
    console.error("Recent reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
