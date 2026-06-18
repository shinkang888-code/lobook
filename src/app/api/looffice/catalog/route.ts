import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { LOOFFICE_ENGINES } from "@/lib/looffice/loofficeCatalog";
import { isDdddOcrServerAvailable } from "@/lib/documentOcr/ddddocr-config";

export async function GET() {
  const manifestPath = path.join(process.cwd(), "vendor", "looffice", "engine-manifest.json");
  let manifest: Record<string, unknown> = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<string, unknown>;
    } catch {
      manifest = {};
    }
  }

  return NextResponse.json({
    engines: LOOFFICE_ENGINES,
    manifest,
    ocr: {
      tesseract: true,
      ddddocr: isDdddOcrServerAvailable(),
    },
    repo: "https://github.com/shinkang888-code/looffice",
  });
}
