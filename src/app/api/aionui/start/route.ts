import { NextResponse } from "next/server";
import { getAionUiStatus, startAionUiWebui } from "@/lib/aionui/aionuiService";

export async function POST() {
  try {
    const before = await getAionUiStatus();
    if (before.running && before.webUrl) {
      return NextResponse.json({ url: before.webUrl, started: false });
    }
    const { url } = await startAionUiWebui();
    return NextResponse.json({ url, started: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AionUi 시작 실패" },
      { status: 500 },
    );
  }
}
