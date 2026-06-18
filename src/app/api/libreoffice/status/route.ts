import { NextResponse } from "next/server";
import { getLibreOfficeRuntimeStatus } from "@/lib/libreoffice/libreOfficeStatus";

export async function GET() {
  const status = await getLibreOfficeRuntimeStatus();
  return NextResponse.json(status);
}
