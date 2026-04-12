import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure uploads dir exists (should be created by client.ts, but double-checking)
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

    // Save physical file
    const ext = file.name.split('.').pop() || "jpg";
    const filename = `item_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ imagePath: `/uploads/${filename}` });
  } catch (err: any) {
    console.error("Marketplace upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
