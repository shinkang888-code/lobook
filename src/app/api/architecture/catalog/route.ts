import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { ARCHITECTURE_PATTERNS } from "@/lib/architecture/architectureCatalog";

type CatalogFile = {
  archDocCount?: number;
  items?: { name: string; href: string }[];
};

export async function GET() {
  const catalogPath = path.join(process.cwd(), "vendor", "architecture-center", "pattern-catalog.json");
  let file: CatalogFile = {};

  if (fs.existsSync(catalogPath)) {
    try {
      file = JSON.parse(fs.readFileSync(catalogPath, "utf-8")) as CatalogFile;
    } catch {
      file = {};
    }
  }

  return NextResponse.json({
    archDocCount: file.archDocCount ?? ARCHITECTURE_PATTERNS.length,
    items: file.items ?? ARCHITECTURE_PATTERNS.map((p) => ({
      name: p.label,
      href: p.docPath ?? p.id,
    })),
    patterns: ARCHITECTURE_PATTERNS,
    learnBase: "https://learn.microsoft.com/azure/architecture",
    repo: "https://github.com/shinkang888-code/architecture-center",
  });
}
