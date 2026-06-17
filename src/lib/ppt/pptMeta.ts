import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseClient";

const META_DIR = path.join(process.cwd(), ".data", "book-ppt-meta");

export type PptExportMeta = {
  storagePath: string;
  fileName: string;
  slideCount: number;
  updatedAt: string;
  prompt?: string;
};

function metaPath(bookId: string): string {
  return path.join(META_DIR, `${bookId}.json`);
}

export async function setLatestPptExport(
  bookId: string,
  meta: Omit<PptExportMeta, "updatedAt">,
): Promise<void> {
  const record: PptExportMeta = { ...meta, updatedAt: new Date().toISOString() };

  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { error } = await admin
        .from("books")
        .update({
          ppt_export_path: record.storagePath,
          ppt_export_name: record.fileName,
        })
        .eq("id", bookId);
      if (error) throw new Error(error.message);
    }
  }

  await fs.mkdir(META_DIR, { recursive: true });
  await fs.writeFile(metaPath(bookId), JSON.stringify(record, null, 2), "utf-8");
}

export async function getLatestPptExport(bookId: string): Promise<PptExportMeta | null> {
  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("books")
        .select("ppt_export_path, ppt_export_name")
        .eq("id", bookId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data?.ppt_export_path) {
        return {
          storagePath: String(data.ppt_export_path),
          fileName: String(data.ppt_export_name ?? "presentation.pptx"),
          slideCount: 0,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  try {
    const raw = await fs.readFile(metaPath(bookId), "utf-8");
    return JSON.parse(raw) as PptExportMeta;
  } catch {
    return null;
  }
}
