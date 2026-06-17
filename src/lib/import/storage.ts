import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseClient";

const LOCAL_IMPORT_DIR = path.join(process.cwd(), ".data", "imports");
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

const ALLOWED_IMPORT: Record<string, string[]> = {
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  epub: ["application/epub+zip"],
  hwp: ["application/x-hwp", "application/octet-stream", "application/haansofthwp"],
  hwpx: ["application/hwp+zip", "application/vnd.hancom.hwpx", "application/octet-stream"],
};

function extFromFilename(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "bin";
}

export async function saveImportFile(
  file: File,
  bookId: string,
  kind: "docx" | "epub" | "hwp" | "hwpx",
): Promise<{ storagePath: string; localUrl?: string }> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("파일은 50MB 이하만 업로드할 수 있습니다.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extFromFilename(file.name);
  const objectPath = `${bookId}/${kind}/${crypto.randomUUID()}.${ext}`;

  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Supabase 연결 실패");

    const { error } = await admin.storage.from("book-imports").upload(objectPath, buffer, {
      contentType: file.type || ALLOWED_IMPORT[kind][0],
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { storagePath: objectPath };
  }

  const localPath = path.join(LOCAL_IMPORT_DIR, objectPath);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);
  return { storagePath: objectPath, localUrl: `/api/uploads/imports/${objectPath.replace(/\\/g, "/")}` };
}

export async function readImportBuffer(storagePath: string): Promise<Buffer> {
  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Supabase 연결 실패");
    const { data, error } = await admin.storage.from("book-imports").download(storagePath);
    if (error || !data) throw new Error(error?.message ?? "파일을 읽을 수 없습니다.");
    return Buffer.from(await data.arrayBuffer());
  }
  const localPath = path.join(LOCAL_IMPORT_DIR, storagePath);
  return fs.readFile(localPath);
}
