import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { upiPayments } from "@/server/db/schema";
import { generateTransactionId, buildUpiUrl, generateQrDataUrl } from "@/server/payments/upi";

export const runtime = "nodejs";

const createSchema = z.object({
  amountINR: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amountINR } = parsed.data;
    const transactionId = generateTransactionId();
    const upiUrl = buildUpiUrl(amountINR, transactionId);
    const qrDataUrl = await generateQrDataUrl(upiUrl);

    const now = new Date().toISOString();
    db.insert(upiPayments).values({
      userId: session.userId,
      transactionId,
      upiUrl,
      amountINR,
      creditsAdded: 0,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }).run();

    return NextResponse.json({
      transactionId,
      upiUrl,
      qrDataUrl,
      amountINR,
      status: "pending",
    });
  } catch (error: any) {
    console.error("UPI create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
