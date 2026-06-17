import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseClient";

const META_DIR = path.join(process.cwd(), ".data", "book-import-meta");

export type HwpImportMeta = {
  storagePath: string;
  fileName: string;
  updatedAt: string;
};

function metaPath(bookId: string): string {
  return path.join(META_DIR, `${bookId}.json`);
}

export async function setLatestHwpImport(
  bookId: string,
  storagePath: string,
  fileName: string,
): Promise<void> {
  const meta: HwpImportMeta = {
    storagePath,
    fileName,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { error } = await admin
        .from("books")
        .update({ hwp_import_path: storagePath, hwp_import_name: fileName })
        .eq("id", bookId);
      if (error) throw new Error(error.message);
    }
  }

  await fs.mkdir(META_DIR, { recursive: true });
  await fs.writeFile(metaPath(bookId), JSON.stringify(meta, null, 2), "utf-8");
}

export async function getLatestHwpImport(bookId: string): Promise<HwpImportMeta | null> {
  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("books")
        .select("hwp_import_path, hwp_import_name")
        .eq("id", bookId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data?.hwp_import_path) {
        return {
          storagePath: String(data.hwp_import_path),
          fileName: String(data.hwp_import_name ?? "document.hwp"),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  try {
    const raw = await fs.readFile(metaPath(bookId), "utf-8");
    return JSON.parse(raw) as HwpImportMeta;
  } catch {
    return null;
  }
}
