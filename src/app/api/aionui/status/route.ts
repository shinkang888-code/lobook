import { NextResponse } from "next/server";
import { getAionUiStatus } from "@/lib/aionui/aionuiService";
import { isCoworkAiEnabled, getCoworkAiProvider } from "@/lib/aionui/coworkChatService";

export async function GET() {
  const aion = await getAionUiStatus();
  return NextResponse.json({
    aion,
    studioChat: {
      enabled: isCoworkAiEnabled(),
      provider: getCoworkAiProvider(),
    },
  });
}
