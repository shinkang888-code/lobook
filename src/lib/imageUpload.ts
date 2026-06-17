import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabaseClient";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);

function sanitizeExt(filename: string, mime: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "jpg";
}

export async function saveUploadedImage(
  file: File,
  bookId: string,
  requestOrigin: string,
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("JPEG, PNG, GIF, WebP, SVG 이미지만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("이미지는 5MB 이하만 업로드할 수 있습니다.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sanitizeExt(file.name, file.type);
  const objectPath = `${bookId}/${crypto.randomUUID()}.${ext}`;

  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Supabase 연결에 실패했습니다.");

    const { error } = await admin.storage.from("book-images").upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const { data } = admin.storage.from("book-images").getPublicUrl(objectPath);
    return data.publicUrl;
  }

  const localPath = path.join(LOCAL_UPLOAD_DIR, objectPath);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);
  return `${requestOrigin}/api/uploads/${objectPath.replace(/\\/g, "/")}`;
}
