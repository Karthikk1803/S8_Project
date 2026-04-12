import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { users, ledgerEntries, walletTransactions } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { addLedgerEntry, getBalance } from "@/server/ledger/ledger";

export const runtime = "nodejs";

const convertSchema = z.object({
  creditsToConvert: z.number().int().positive(),
});

const CRYPTO_PER_CREDIT = 0.005;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = convertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { creditsToConvert } = parsed.data;
    const currentBalance = getBalance(session.userId);

    if (currentBalance < creditsToConvert) {
      return NextResponse.json({ error: "Insufficient token credits" }, { status: 400 });
    }

    const user = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cryptoGained = creditsToConvert * CRYPTO_PER_CREDIT;

    // 1. Deduct credits via ledger entry
    addLedgerEntry(
      session.userId,
      "transfer_out", // Deducting credits
      creditsToConvert,
      `Converted ${creditsToConvert} tokens to ${cryptoGained.toFixed(4)} ETH`
    );

    // 2. Add crypto balance
    db.update(users)
      .set({ cryptoBalance: sql`${users.cryptoBalance} + ${cryptoGained}` })
      .where(eq(users.id, session.userId))
      .run();

    // 3. Log mock wallet transaction (Receiving crypto)
    const mockTxHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    
    db.insert(walletTransactions).values({
      userId: session.userId,
      txHash: mockTxHash,
      toAddress: user.walletAddress, // Receiving address
      amountCredits: creditsToConvert,
      memo: `Withdraw: ${creditsToConvert} credits to Mock ETH`,
      signature: "0x_mock_signature_" + Date.now(),
    }).run();

    return NextResponse.json({
      success: true,
      creditsConverted: creditsToConvert,
      cryptoGained,
      txHash: mockTxHash,
    });
  } catch (error: any) {
    console.error("Token conversion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
