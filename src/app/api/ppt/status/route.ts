import { NextResponse } from "next/server";
import { getPptEngineStatus } from "@/lib/ppt/pptExportService";
import { getPptAiStatus } from "@/lib/ppt/pptAiService";

export async function GET() {
  const engine = await getPptEngineStatus();
  const ai = getPptAiStatus();
  return NextResponse.json({ engine, ai });
}
