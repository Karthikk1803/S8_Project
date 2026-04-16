import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { reports, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check role
    const user = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all reports with status "pending_review"
    const rows = db
      .select()
      .from(reports)
      .where(eq(reports.status, "pending_review"))
      .all();

    const enriched = rows.map((row) => {
      const reporter = db.select({ name: users.name }).from(users).where(eq(users.id, row.userId)).get();

      // Parse confidence from verification result
      let confidence = 0;
      if (row.verificationResultJson) {
        try {
          const parsed = JSON.parse(row.verificationResultJson);
          confidence = parsed.confidence || 0;
        } catch {
          // ignore
        }
      }

      return {
        id: row.id,
        location: row.location,
        wasteType: row.wasteType,
        amount: row.amount,
        reporterName: reporter?.name || "Unknown",
        confidence,
        createdAt: row.createdAt,
      };
    });

    return NextResponse.json({ reports: enriched });
  } catch (error: any) {
    console.error("Moderation queue error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
