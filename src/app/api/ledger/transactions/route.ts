import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { getTransactions } from "@/server/ledger/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const transactions = getTransactions(session.userId);
    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
