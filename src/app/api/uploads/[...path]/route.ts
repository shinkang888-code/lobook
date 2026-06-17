import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Params = { params: Promise<{ path: string[] }> };

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");

export async function GET(_request: Request, { params }: Params) {
  const { path: segments } = await params;
  const relativePath = segments.join("/");
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);

  if (!absolutePath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).slice(1).toLowerCase();
    const typeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };

    return new NextResponse(data, {
      headers: {
        "Content-Type": typeMap[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
