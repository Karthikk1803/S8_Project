import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { reports, notifications } from "@/server/db/schema";
import { addLedgerEntry } from "@/server/ledger/ledger";

export const runtime = "nodejs";

const createReportSchema = z.object({
  location: z.string().min(1),
  wasteType: z.string().min(1),
  amount: z.string().min(1),
  imageDataUrl: z.string().optional(),
  verificationResultJson: z.string().optional(),
  points: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { location, wasteType, amount, imageDataUrl, verificationResultJson, points } = parsed.data;

    // Parse verification result to determine token eligibility
    let confidence = 0;
    let recyclable = false;
    if (verificationResultJson) {
      try {
        const verification = JSON.parse(verificationResultJson);
        confidence = verification.confidence || 0;
        recyclable = verification.recyclable || false;
      } catch {
        // ignore parse errors
      }
    }

    // Determine status and token reward
    let reportStatus = "pending";
    let tokenReward = 0;

    if (recyclable && confidence >= 0.70) {
      // High confidence recyclable: auto-award 5 tokens
      tokenReward = 5;
      reportStatus = "pending";
    } else if (recyclable && confidence < 0.70) {
      // Low confidence recyclable: needs moderator review
      tokenReward = 0;
      reportStatus = "pending_review";
    }
    // Non-recyclable: status stays "pending", no token reward

    const result = db.insert(reports).values({
      userId: session.userId,
      location,
      wasteType,
      amount,
      imageDataUrl: imageDataUrl || null,
      verificationResultJson: verificationResultJson || null,
      status: reportStatus,
      tokenReward,
      createdAt: new Date().toISOString(),
    }).run();

    const reportId = Number(result.lastInsertRowid);

    // Award base credits for reporting
    const earnedPoints = points || 10;
    addLedgerEntry(
      session.userId,
      "earn_report",
      earnedPoints,
      `Earned ${earnedPoints} credits for reporting ${wasteType} waste`,
      `report:${reportId}`
    );

    // Award token bonus if eligible (recyclable + high confidence)
    if (tokenReward > 0) {
      addLedgerEntry(
        session.userId,
        "earn_token_report",
        tokenReward,
        `Earned ${tokenReward} bonus tokens for reporting recyclable ${wasteType} waste (${Math.round(confidence * 100)}% confidence)`,
        `report:${reportId}`
      );
    }

    // Create notification
    let notifMessage = `Your waste report for ${wasteType} has been submitted and you earned ${earnedPoints} credits!`;
    if (tokenReward > 0) {
      notifMessage += ` Plus ${tokenReward} bonus tokens for recyclable waste! 🎉`;
    } else if (reportStatus === "pending_review") {
      notifMessage += ` Your recyclable waste report is pending moderator review for token eligibility.`;
    }

    db.insert(notifications).values({
      userId: session.userId,
      message: notifMessage,
      type: "reward",
      isRead: 0,
      createdAt: new Date().toISOString(),
    }).run();

    return NextResponse.json({
      id: reportId,
      pointsEarned: earnedPoints,
      tokenReward,
      status: reportStatus,
      message: reportStatus === "pending_review"
        ? "Report submitted! Pending moderator review for token reward."
        : "Report submitted successfully",
    });
  } catch (error: any) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
