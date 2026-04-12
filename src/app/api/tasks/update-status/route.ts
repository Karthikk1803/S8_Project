import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { reports, notifications } from "@/server/db/schema";
import { addLedgerEntry } from "@/server/ledger/ledger";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const updateSchema = z.object({
  reportId: z.number(),
  status: z.enum(["in_progress", "verified"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { reportId, status } = parsed.data;

    const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (status === "in_progress") {
      db.update(reports)
        .set({ status: "in_progress", collectorId: session.userId })
        .where(eq(reports.id, reportId))
        .run();

      return NextResponse.json({ message: "Task started", status: "in_progress" });
    }

    if (status === "verified") {
      db.update(reports)
        .set({ status: "verified" })
        .where(eq(reports.id, reportId))
        .run();

      // Award collector credits
      const collectCredits = 25;
      addLedgerEntry(
        session.userId,
        "earn_collect",
        collectCredits,
        `Earned ${collectCredits} credits for collecting ${report.wasteType} waste`,
        `report:${reportId}`
      );

      // Notify the reporter
      db.insert(notifications).values({
        userId: report.userId,
        message: `Your ${report.wasteType} waste report has been collected and verified!`,
        type: "collection",
        isRead: 0,
        createdAt: new Date().toISOString(),
      }).run();

      return NextResponse.json({
        message: "Task verified and completed",
        status: "verified",
        creditsEarned: collectCredits,
      });
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
