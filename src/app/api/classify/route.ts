import { NextRequest, NextResponse } from "next/server";
import { classifyImage } from "@/server/ai/pythonClient";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const result = await classifyImage(base64);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "AI classification failed",
          hint: "Start the AI server: cd RECO_APP && python api_server.py",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Classify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
