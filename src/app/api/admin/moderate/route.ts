import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { reports, users, notifications } from "@/server/db/schema";
import { addLedgerEntry } from "@/server/ledger/ledger";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const moderateSchema = z.object({
  reportId: z.number(),
  action: z.enum(["approve", "reject"]),
  category: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check role: only admin or moderator can moderate
    const user = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Access denied. Admin or Moderator role required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = moderateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { reportId, action, category } = parsed.data;

    const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "pending_review") {
      return NextResponse.json({ error: "Report is not pending review" }, { status: 400 });
    }

    if (action === "approve") {
      // Update report: approve with optional category override
      const updateData: any = {
        status: "pending",
        tokenReward: 5,
        moderatorNotes: `Approved by ${user.name}${category ? ` — category set to: ${category}` : ""}`,
      };
      if (category) {
        updateData.wasteType = category;
      }

      db.update(reports)
        .set(updateData)
        .where(eq(reports.id, reportId))
        .run();

      // Award 5 tokens to the reporter
      addLedgerEntry(
        report.userId,
        "earn_token_report",
        5,
        `Earned 5 bonus tokens — moderator approved recyclable waste report #${reportId}`,
        `report:${reportId}`
      );

      // Notify the reporter
      db.insert(notifications).values({
        userId: report.userId,
        message: `Your recyclable waste report #${reportId} has been approved by a moderator! You earned 5 bonus tokens! 🎉`,
        type: "reward",
        isRead: 0,
        createdAt: new Date().toISOString(),
      }).run();

      return NextResponse.json({
        message: "Report approved and 5 tokens awarded to reporter",
        reportId,
        tokensAwarded: 5,
      });
    }

    if (action === "reject") {
      db.update(reports)
        .set({
          status: "rejected",
          moderatorNotes: `Rejected by ${user.name}`,
        })
        .where(eq(reports.id, reportId))
        .run();

      // Notify the reporter
      db.insert(notifications).values({
        userId: report.userId,
        message: `Your waste report #${reportId} was reviewed and could not be verified as recyclable. No bonus tokens awarded.`,
        type: "system",
        isRead: 0,
        createdAt: new Date().toISOString(),
      }).run();

      return NextResponse.json({
        message: "Report rejected",
        reportId,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Moderate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
