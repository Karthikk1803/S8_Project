import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { reports, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminUser = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (adminUser?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = db.select({
      id: reports.id,
      location: reports.location,
      wasteType: reports.wasteType,
      amount: reports.amount,
      imageDataUrl: reports.imageDataUrl,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterName: users.name,
      reporterEmail: users.email,
    })
    .from(reports)
    .innerJoin(users, eq(reports.userId, users.id))
    .where(eq(reports.status, "pending"))
    .orderBy(desc(reports.createdAt))
    .all();

    return NextResponse.json({ reports: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
