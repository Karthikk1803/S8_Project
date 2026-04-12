import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { like, or } from "drizzle-orm";
import { getSession } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const matches = db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(
        or(
          like(users.name, `%${query}%`),
          like(users.email, `%${query}%`)
        )
      )
      .limit(10)
      .all();

    return NextResponse.json({ users: matches });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
