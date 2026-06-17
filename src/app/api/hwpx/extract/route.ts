import { NextResponse } from "next/server";
import { previewHwpx } from "@/lib/hwpx/hwpxService";

export async function GET() {
  return NextResponse.json({
    engine: "hwpx-contents-extract (TypeScript port)",
    source: "https://github.com/shinkang888-code/hwpx-contents-extract",
    formats: [".hwpx"],
    features: ["section text extract", "image embed", "keyword rank"],
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 필드가 필요합니다." }, { status: 400 });
    }
    if (!file.name.match(/\.hwpx$/i)) {
      return NextResponse.json({ error: "HWPX 파일만 지원합니다." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const preview = await previewHwpx(buffer);
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "HWPX 추출 실패" },
      { status: 500 },
    );
  }
}
