import { NextResponse } from "next/server";
import { getMarkitdownStatus } from "@/lib/convert/markitdownService";

export async function GET() {
  const status = await getMarkitdownStatus();
  return NextResponse.json(status);
}
