import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { getBalance } from "@/server/ledger/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const balance = getBalance(session.userId);
    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error("Balance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
