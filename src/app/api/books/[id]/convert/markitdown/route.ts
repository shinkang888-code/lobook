import { NextResponse } from "next/server";
import { applyMarkitdownToBook } from "@/lib/convert/markitdownApply";
import { convertFileToMarkdown, getMarkitdownStatus } from "@/lib/convert/markitdownService";
import { readImportBufferAsArrayBuffer } from "@/lib/import/importBuffer";
import { getLatestDocxImport, getLatestPdfImport } from "@/lib/import/importMeta";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const status = await getMarkitdownStatus();
    if (!status.available) {
      return NextResponse.json(
        {
          error:
            status.error ??
            "MarkItDown 변환기를 사용할 수 없습니다. Python 설치 또는 MARKITDOWN_SERVICE_URL을 설정하세요.",
          status,
        },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const source = String(form.get("source") ?? "upload");
    const mode = String(form.get("mode") ?? "replace");
    const chapterId = form.get("chapterId") ? String(form.get("chapterId")) : undefined;

    let buffer: ArrayBuffer;
    let fileName: string;

    if (source === "docx") {
      const meta = await getLatestDocxImport(id);
      if (!meta) {
        return NextResponse.json({ error: "저장된 DOCX가 없습니다. Word 가져오기를 먼저 하세요." }, { status: 404 });
      }
      buffer = await readImportBufferAsArrayBuffer(meta.storagePath);
      fileName = meta.fileName;
    } else if (source === "pdf") {
      const meta = await getLatestPdfImport(id);
      if (!meta) {
        return NextResponse.json({ error: "저장된 PDF가 없습니다. PDF 가져오기를 먼저 하세요." }, { status: 404 });
      }
      buffer = await readImportBufferAsArrayBuffer(meta.storagePath);
      fileName = meta.fileName;
    } else if (file instanceof File) {
      buffer = await file.arrayBuffer();
      fileName = file.name;
    } else {
      return NextResponse.json({ error: "file 또는 source(docx|pdf)가 필요합니다." }, { status: 400 });
    }

    if (mode !== "replace" && mode !== "append" && mode !== "chapter") {
      return NextResponse.json({ error: "mode는 replace | append | chapter 중 하나여야 합니다." }, { status: 400 });
    }

    const markdown = await convertFileToMarkdown(buffer, fileName);
    if (!markdown.trim()) {
      return NextResponse.json({ error: "변환 결과가 비어 있습니다." }, { status: 422 });
    }

    const structure = await applyMarkitdownToBook(id, markdown, fileName, mode, chapterId);
    return NextResponse.json({
      structure,
      markdownLength: markdown.length,
      fileName,
      mode: status.mode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "MarkItDown 변환 실패" },
      { status: 500 },
    );
  }
}
