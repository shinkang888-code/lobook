"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DocxPreviewPanel } from "@/components/editor/modals/DocxPreviewPanel";
import { HwpxPreviewPanel } from "@/components/editor/modals/HwpxPreviewPanel";

export type ImportKind = "docx" | "epub" | "hwp" | "pdf";

type ImportDialogProps = {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ImportKind;
  onSuccess: (opts?: { switchMode?: "word" | "hwp" | "pdf" }) => void;
};

const KIND_LABELS: Record<ImportKind, { title: string; accept: string; ext: string }> = {
  docx: {
    title: "Word (DOCX) 가져오기",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "DOCX",
  },
  epub: { title: "EPUB 가져오기", accept: ".epub,application/epub+zip", ext: "EPUB" },
  hwp: { title: "HWP/HWPX 가져오기", accept: ".hwp,.hwpx", ext: "HWP/HWPX" },
  pdf: { title: "PDF 가져오기", accept: ".pdf,application/pdf", ext: "PDF" },
};

export function ImportDialog({ bookId, open, onOpenChange, kind, onSuccess }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [hwpMode, setHwpMode] = useState<"convert" | "store">("convert");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null);

  const meta = KIND_LABELS[kind];

  const resetPending = () => {
    setPendingFile(null);
    setPreviewBuffer(null);
  };

  const handleFileSelected = async (file: File) => {
    if (kind === "docx") {
      const buf = await file.arrayBuffer();
      setPendingFile(file);
      setPreviewBuffer(buf);
      return;
    }
    if (kind === "hwp" && file.name.match(/\.hwpx$/i)) {
      const buf = await file.arrayBuffer();
      setPendingFile(file);
      setPreviewBuffer(buf);
      return;
    }
    void handleImport(file);
  };

  const handleImport = async (file: File) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (kind !== "hwp" && kind !== "pdf") {
        form.append("mode", mode);
      } else if (kind === "hwp") {
        form.append("mode", mode);
        form.append("hwpMode", hwpMode);
      }

      const endpoint =
        kind === "docx"
          ? `/api/books/${bookId}/import/docx`
          : kind === "epub"
            ? `/api/books/${bookId}/import/epub`
            : kind === "hwp"
              ? `/api/books/${bookId}/import/hwp`
              : `/api/books/${bookId}/import/pdf`;

      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "가져오기 실패");

      if (kind === "pdf") {
        toast.success("PDF 파일이 저장되었습니다. PDF 탭에서 미리보기하세요.");
        onSuccess({ switchMode: "pdf" });
      } else if (kind === "hwp") {
        if (hwpMode === "store") {
          toast.success("HWP 파일이 저장되었습니다. HWP 탭에서 Canvas 미리보기하세요.");
          onSuccess({ switchMode: "hwp" });
        } else {
          const unit = pendingFile?.name.match(/\.hwpx$/i) ? "섹션" : "페이지";
          toast.success(
            `${data.imported ?? 0}개 ${unit}을 HTML로 변환했습니다. Word 탭에서 편집하세요.`,
          );
          onSuccess({ switchMode: "word" });
        }
      } else {
        toast.success(
          `${data.imported ?? 1}개 챕터를 가져왔습니다.${data.structure?.chapters?.length ? ` (총 ${data.structure.chapters.length}챕터)` : ""}`,
        );
        onSuccess(kind === "docx" ? { switchMode: "word" } : undefined);
      }
      resetPending();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "가져오기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetPending();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className={
          kind === "docx" && previewBuffer
            ? "sm:max-w-2xl"
            : kind === "hwp" && previewBuffer
              ? "sm:max-w-2xl"
              : "sm:max-w-md"
        }
      >
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>
            {kind === "hwp"
              ? "HWP는 Canvas 뷰어, HWPX는 한컴 추출기 기반 HTML 미리보기 후 가져올 수 있습니다."
              : `${meta.ext} 파일을 선택하세요. DOCX는 microscope-js로 미리보기 후 가져올 수 있습니다.`}
          </DialogDescription>
        </DialogHeader>

        {kind !== "hwp" && kind !== "pdf" && (
          <div className="flex gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              기존 내용 교체
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "append"}
                onChange={() => setMode("append")}
              />
              챕터 추가
            </label>
          </div>
        )}

        {kind === "hwp" && (
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hwpMode"
                checked={hwpMode === "convert"}
                onChange={() => setHwpMode("convert")}
              />
              HTML로 변환하여 편집 (Word 탭)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hwpMode"
                checked={hwpMode === "store"}
                onChange={() => setHwpMode("store")}
              />
              원본만 저장 (HWP Canvas 뷰어)
            </label>
            <div className="flex gap-2 pt-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />
                교체
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "append"}
                  onChange={() => setMode("append")}
                />
                추가
              </label>
            </div>
          </div>
        )}

        {kind === "docx" && previewBuffer && pendingFile && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">microscope-js 미리보기 — {pendingFile.name}</Label>
            <DocxPreviewPanel buffer={previewBuffer} fileName={pendingFile.name} />
          </div>
        )}

        {kind === "hwp" && previewBuffer && pendingFile && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">HWPX 추출 미리보기 — {pendingFile.name}</Label>
            <HwpxPreviewPanel buffer={previewBuffer} fileName={pendingFile.name} />
          </div>
        )}

        {!previewBuffer && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <input
              ref={inputRef}
              type="file"
              accept={meta.accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelected(file);
              }}
            />
            <FileUp className="mx-auto mb-2 size-10 text-muted-foreground" />
            <Label className="text-muted-foreground">{meta.ext} 파일</Label>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetPending();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            취소
          </Button>
          {previewBuffer && pendingFile ? (
            <Button onClick={() => void handleImport(pendingFile)} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              가져오기
            </Button>
          ) : (
            <Button onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              파일 선택
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
