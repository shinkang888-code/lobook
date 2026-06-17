import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseClient";

const META_DIR = path.join(process.cwd(), ".data", "book-import-meta");

export type ImportFileMeta = {
  storagePath: string;
  fileName: string;
  updatedAt: string;
};

type BookImportMetaStore = {
  hwp?: ImportFileMeta;
  docx?: ImportFileMeta;
  pdf?: ImportFileMeta;
};

function metaPath(bookId: string): string {
  return path.join(META_DIR, `${bookId}.json`);
}

async function readStore(bookId: string): Promise<BookImportMetaStore> {
  try {
    const raw = await fs.readFile(metaPath(bookId), "utf-8");
    return JSON.parse(raw) as BookImportMetaStore;
  } catch {
    return {};
  }
}

async function writeStore(bookId: string, store: BookImportMetaStore): Promise<void> {
  await fs.mkdir(META_DIR, { recursive: true });
  await fs.writeFile(metaPath(bookId), JSON.stringify(store, null, 2), "utf-8");
}

async function updateBookColumns(
  bookId: string,
  columns: Record<string, string | null>,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const { error } = await admin.from("books").update(columns).eq("id", bookId);
  if (error) throw new Error(error.message);
}

export async function setLatestImport(
  bookId: string,
  kind: "hwp" | "docx" | "pdf",
  storagePath: string,
  fileName: string,
): Promise<void> {
  const meta: ImportFileMeta = {
    storagePath,
    fileName,
    updatedAt: new Date().toISOString(),
  };

  const columnMap = {
    hwp: { hwp_import_path: storagePath, hwp_import_name: fileName },
    docx: { docx_import_path: storagePath, docx_import_name: fileName },
    pdf: { pdf_import_path: storagePath, pdf_import_name: fileName },
  } as const;

  await updateBookColumns(bookId, columnMap[kind]);

  const store = await readStore(bookId);
  store[kind] = meta;
  await writeStore(bookId, store);
}

export async function getLatestImport(
  bookId: string,
  kind: "hwp" | "docx" | "pdf",
): Promise<ImportFileMeta | null> {
  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const selectMap = {
        hwp: "hwp_import_path, hwp_import_name",
        docx: "docx_import_path, docx_import_name",
        pdf: "pdf_import_path, pdf_import_name",
      } as const;
      const pathKey = {
        hwp: "hwp_import_path",
        docx: "docx_import_path",
        pdf: "pdf_import_path",
      } as const;
      const nameKey = {
        hwp: "hwp_import_name",
        docx: "docx_import_name",
        pdf: "pdf_import_name",
      } as const;

      const { data, error } = await admin
        .from("books")
        .select(selectMap[kind])
        .eq("id", bookId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const row = data as Record<string, string | null> | null;
      if (row?.[pathKey[kind]]) {
        return {
          storagePath: String(row[pathKey[kind]]),
          fileName: String(row[nameKey[kind]] ?? `document.${kind}`),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  const store = await readStore(bookId);
  return store[kind] ?? null;
}

/** @deprecated */
export const setLatestHwpImport = (
  bookId: string,
  storagePath: string,
  fileName: string,
) => setLatestImport(bookId, "hwp", storagePath, fileName);

/** @deprecated */
export const getLatestHwpImport = (bookId: string) => getLatestImport(bookId, "hwp");

export const setLatestDocxImport = (
  bookId: string,
  storagePath: string,
  fileName: string,
) => setLatestImport(bookId, "docx", storagePath, fileName);

export const getLatestDocxImport = (bookId: string) => getLatestImport(bookId, "docx");

export const setLatestPdfImport = (
  bookId: string,
  storagePath: string,
  fileName: string,
) => setLatestImport(bookId, "pdf", storagePath, fileName);

export const getLatestPdfImport = (bookId: string) => getLatestImport(bookId, "pdf");
