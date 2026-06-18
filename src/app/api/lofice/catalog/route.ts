import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { LOFICE_ENGINES } from "@/lib/lofice/loficeCatalog";
import { isDdddOcrServerAvailable } from "@/lib/documentOcr/ddddocr-config";

export async function GET() {
  const manifestPath = path.join(process.cwd(), "vendor", "lofice", "engine-manifest.json");
  let manifest: Record<string, unknown> = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<string, unknown>;
    } catch {
      manifest = {};
    }
  }

  return NextResponse.json({
    engines: LOFICE_ENGINES,
    manifest,
    ocr: {
      tesseract: true,
      ddddocr: isDdddOcrServerAvailable(),
    },
    repo: "https://github.com/shinkang888-code/lofice",
  });
}
