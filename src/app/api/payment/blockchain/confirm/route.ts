import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { users, ledgerEntries, walletTransactions } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { addLedgerEntry } from "@/server/ledger/ledger";

export const runtime = "nodejs";

const confirmSchema = z.object({
  creditsToBuy: z.number().int().positive(),
  txHash: z.string().startsWith("0x"),
});

const CRYPTO_PER_CREDIT = 0.005;

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

    const { creditsToBuy, txHash } = parsed.data;
    const costInCrypto = creditsToBuy * CRYPTO_PER_CREDIT;

    const userRecord = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userRecord.cryptoBalance < costInCrypto) {
      return NextResponse.json({ error: "Insufficient crypto balance" }, { status: 400 });
    }

    // 1. Deduct crypto balance
    db.update(users)
      .set({ cryptoBalance: sql`${users.cryptoBalance} - ${costInCrypto}` })
      .where(eq(users.id, session.userId))
      .run();

    // 2. Add ledger entry for credits
    addLedgerEntry(
      session.userId,
      "purchase_blockchain",
      creditsToBuy,
      `Bought ${creditsToBuy} credits via blockchain`
    );

    // 3. Log mock wallet transaction
    db.insert(walletTransactions).values({
      userId: session.userId,
      txHash,
      toAddress: "0x000000000000000000000000000000000000dead",
      amountCredits: creditsToBuy,
      memo: `Bought ${creditsToBuy} credits for ${costInCrypto} ETH`,
      signature: "0x_mock_signature_" + Date.now(),
    }).run();

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToBuy,
      costInCrypto,
      txHash,
    });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }
    console.error("Blockchain confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
