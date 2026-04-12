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

    const result = db.insert(reports).values({
      userId: session.userId,
      location,
      wasteType,
      amount,
      imageDataUrl: imageDataUrl || null,
      verificationResultJson: verificationResultJson || null,
      status: "pending",
      createdAt: new Date().toISOString(),
    }).run();

    const reportId = Number(result.lastInsertRowid);

    // Award credits
    const earnedPoints = points || 10;
    addLedgerEntry(
      session.userId,
      "earn_report",
      earnedPoints,
      `Earned ${earnedPoints} credits for reporting ${wasteType} waste`,
      `report:${reportId}`
    );

    // Create notification
    db.insert(notifications).values({
      userId: session.userId,
      message: `Your waste report for ${wasteType} has been submitted and you earned ${earnedPoints} credits!`,
      type: "reward",
      isRead: 0,
      createdAt: new Date().toISOString(),
    }).run();

    return NextResponse.json({
      id: reportId,
      pointsEarned: earnedPoints,
      message: "Report submitted successfully",
    });
  } catch (error: any) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
