import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { upiPayments } from "@/server/db/schema";
import { addLedgerEntry, getBalance } from "@/server/ledger/ledger";
import { calculateCredits } from "@/server/payments/upi";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const confirmSchema = z.object({
  transactionId: z.string().min(1),
  paid: z.boolean(),
  utr: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { transactionId, paid, utr } = parsed.data;

    const payment = db
      .select()
      .from(upiPayments)
      .where(eq(upiPayments.transactionId, transactionId))
      .get();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status === "success") {
      return NextResponse.json({ error: "Payment already confirmed" }, { status: 400 });
    }

    if (!paid) {
      db.update(upiPayments)
        .set({ status: "failed", updatedAt: new Date().toISOString() })
        .where(eq(upiPayments.transactionId, transactionId))
        .run();
      return NextResponse.json({ status: "failed" });
    }

    const credits = calculateCredits(payment.amountINR);

    db.update(upiPayments)
      .set({
        status: "success",
        creditsAdded: credits,
        utr: utr || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(upiPayments.transactionId, transactionId))
      .run();

    addLedgerEntry(
      session.userId,
      "purchase_upi",
      credits,
      `Purchased ${credits} credits via UPI (₹${payment.amountINR})`,
      `upi:${transactionId}`
    );

    const newBalance = getBalance(session.userId);

    return NextResponse.json({
      status: "success",
      creditsAdded: credits,
      balance: newBalance,
      receipt: {
        transactionId,
        amountINR: payment.amountINR,
        credits,
        utr: utr || "N/A",
        timestamp: new Date().toISOString(),
        note: "Simulated confirmation (college project)",
      },
    });
  } catch (error: any) {
    console.error("UPI confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
