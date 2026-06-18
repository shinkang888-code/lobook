import { NextResponse } from "next/server";
import { LIBREOFFICE_ENGINE_BINDINGS } from "@/lib/libreoffice/libreOfficeCatalog";
import { getLibreOfficeRuntimeStatus } from "@/lib/libreoffice/libreOfficeStatus";

export async function GET() {
  const runtime = await getLibreOfficeRuntimeStatus();
  return NextResponse.json({
    bindings: LIBREOFFICE_ENGINE_BINDINGS,
    runtime,
  });
}
