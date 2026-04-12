import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { createToken } from "@/server/auth/jwt";
import { getSessionCookieName } from "@/server/auth/session";
import { generateWallet } from "@/server/wallet/mockWallet";
import { addLedgerEntry } from "@/server/ledger/ledger";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, name, password } = parsed.data;

    // Check if email exists
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const wallet = generateWallet();

    db.insert(users).values({
      email,
      name,
      passwordHash,
      walletAddress: wallet.address,
      walletSecretEnc: wallet.encryptedSecret,
      createdAt: new Date().toISOString(),
    }).run();

    const newUser = db.select().from(users).where(eq(users.email, email)).get();
    if (!newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Welcome bonus
    addLedgerEntry(newUser.id, "earn_report", 50, "Welcome bonus credits");

    const token = await createToken({ userId: newUser.id, email: newUser.email });
    const response = NextResponse.json({
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      walletAddress: newUser.walletAddress,
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
