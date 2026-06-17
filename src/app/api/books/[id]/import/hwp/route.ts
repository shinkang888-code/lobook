import { NextResponse } from "next/server";
import { importHwpToBook } from "@/lib/import/importService";
import type { ImportMode } from "@/lib/engines/registry";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    const mode = (form.get("mode") as string) === "append" ? "append" : "replace";
    const hwpModeRaw = form.get("hwpMode");
    const hwpMode = hwpModeRaw === "store" ? "store" : "convert";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 필드가 필요합니다." }, { status: 400 });
    }
    if (!file.name.match(/\.(hwp|hwpx)$/i)) {
      return NextResponse.json({ error: "HWP/HWPX 파일만 지원합니다." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const result = await importHwpToBook(
      id,
      buffer,
      file.name,
      mode as ImportMode,
      hwpMode,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "HWP 가져오기 실패" },
      { status: 500 },
    );
  }
}
