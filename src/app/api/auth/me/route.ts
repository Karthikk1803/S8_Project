import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { getBalance } from "@/server/ledger/ledger";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balance = getBalance(user.id);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, walletAddress: user.walletAddress, cryptoBalance: user.cryptoBalance },
      balance,
    });
  } catch (error: any) {
    console.error("Auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
