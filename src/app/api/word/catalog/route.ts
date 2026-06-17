import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { M365_WORD_FEATURES } from "@/lib/word/m365WordCatalog";

type CatalogFile = {
  wordDocCount?: number;
  items?: { name: string; href: string }[];
};

export async function GET() {
  const catalogPath = path.join(process.cwd(), "vendor", "microsoft-365-docs", "word-feature-catalog.json");
  let file: CatalogFile = {};

  if (fs.existsSync(catalogPath)) {
    try {
      file = JSON.parse(fs.readFileSync(catalogPath, "utf-8")) as CatalogFile;
    } catch {
      file = {};
    }
  }

  return NextResponse.json({
    wordDocCount: file.wordDocCount ?? M365_WORD_FEATURES.length,
    items: file.items ?? M365_WORD_FEATURES.map((f) => ({
      name: f.label,
      href: f.docPath ?? f.id,
    })),
    features: M365_WORD_FEATURES,
  });
}
