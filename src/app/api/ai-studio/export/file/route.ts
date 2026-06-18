import { readPptxBuffer } from "@/lib/ppt/pptExportService";

export async function GET(request: Request) {
  try {
    const path = new URL(request.url).searchParams.get("path");
    if (!path) {
      return new Response("path가 필요합니다.", { status: 400 });
    }

    const buffer = await readPptxBuffer(path);
    const fileName = path.split("/").pop() ?? "presentation.pptx";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "다운로드 실패", { status: 500 });
  }
}
