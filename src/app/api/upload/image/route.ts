import { NextResponse } from "next/server";
import { saveUploadedImage } from "@/lib/imageUpload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bookId = String(formData.get("bookId") ?? "common");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "업로드할 파일이 없습니다." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const url = await saveUploadedImage(file, bookId, origin);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "이미지 업로드 실패" },
      { status: 400 },
    );
  }
}
