import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { addLedgerEntry, getBalance } from "@/server/ledger/ledger";

export const runtime = "nodejs";

const redeemSchema = z.object({
  rewardName: z.string().min(1),
  cost: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { rewardName, cost } = parsed.data;
    const balance = getBalance(session.userId);

    if (balance < cost) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
    }

    addLedgerEntry(
      session.userId,
      "redeem",
      cost,
      `Redeemed: ${rewardName}`,
      `reward:${rewardName}`
    );

    const newBalance = getBalance(session.userId);

    return NextResponse.json({
      success: true,
      rewardName,
      cost,
      balance: newBalance,
    });
  } catch (error: any) {
    console.error("Redeem error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
