import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { reports, users } from "@/server/db/schema";
import { sql, ne, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all tasks (reports not created by current user, or all pending/in_progress)
    const rows = db
      .select({
        id: reports.id,
        location: reports.location,
        wasteType: reports.wasteType,
        amount: reports.amount,
        status: reports.status,
        createdAt: reports.createdAt,
        userId: reports.userId,
        collectorId: reports.collectorId,
      })
      .from(reports)
      .orderBy(sql`${reports.createdAt} desc`)
      .limit(50)
      .all();

    // Get reporter names
    const enriched = rows.map((row) => {
      const reporter = db.select({ name: users.name }).from(users).where(eq(users.id, row.userId)).get();
      return {
        ...row,
        reporterName: reporter?.name || "Unknown",
      };
    });

    return NextResponse.json({ tasks: enriched });
  } catch (error: any) {
    console.error("Tasks list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
