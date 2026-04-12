import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { walletTransactions } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const txs = db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, session.userId))
      .orderBy(desc(walletTransactions.createdAt))
      .all();

    return NextResponse.json({ transactions: txs });
  } catch (error: any) {
    console.error("Fetch mock wallet txs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
