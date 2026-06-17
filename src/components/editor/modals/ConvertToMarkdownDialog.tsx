"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileCode2, Loader2, Upload } from "lucide-react";
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
import { MARKITDOWN_ACCEPT } from "@/lib/convert/markitdownConstants";

type ConvertMode = "replace" | "append" | "chapter";
type ConvertSource = "upload" | "docx" | "pdf";

type MarkitdownStatus = {
  available: boolean;
  mode: "http" | "local" | "none";
  error?: string;
};

type ConvertToMarkdownDialogProps = {
  bookId: string;
  chapterId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ConvertToMarkdownDialog({
  bookId,
  chapterId,
  open,
  onOpenChange,
  onSuccess,
}: ConvertToMarkdownDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ConvertMode>("replace");
  const [source, setSource] = useState<ConvertSource>("upload");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [status, setStatus] = useState<MarkitdownStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/convert/markitdown/status");
      const data = (await res.json()) as MarkitdownStatus;
      setStatus(data);
    } catch {
      setStatus({ available: false, mode: "none", error: "상태 확인 실패" });
    }
  }, []);

  useEffect(() => {
    if (open) void loadStatus();
  }, [open, loadStatus]);

  const reset = () => {
    setPendingFile(null);
    setSource("upload");
    setMode("replace");
  };

  const handleConvert = async () => {
    if (source === "upload" && !pendingFile) {
      toast.error("변환할 파일을 선택하세요.");
      return;
    }
    if (mode === "chapter" && !chapterId) {
      toast.error("현재 챕터가 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("source", source);
      form.append("mode", mode);
      if (mode === "chapter" && chapterId) form.append("chapterId", chapterId);
      if (source === "upload" && pendingFile) form.append("file", pendingFile);

      const res = await fetch(`/api/books/${bookId}/convert/markitdown`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "변환 실패");

      toast.success(
        `마크다운으로 변환했습니다. (${data.markdownLength?.toLocaleString() ?? 0}자) Markdown 탭에서 편집하세요.`,
      );
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MarkItDown 변환 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode2 className="size-5 text-[#2b579a]" />
            마크다운 문서로 변환
          </DialogTitle>
          <DialogDescription>
            Microsoft MarkItDown으로 PDF·Word·EPUB·PPT·Excel 등을 Markdown으로 변환합니다.
          </DialogDescription>
        </DialogHeader>

        {status && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              status.available
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {status.available ? (
              <span>
                변환기 준비됨 ({status.mode === "http" ? "원격 API" : "로컬 Python"})
              </span>
            ) : (
              <span>
                변환기 미설치 — <code className="text-[11px]">pip install -r requirements-markitdown.txt</code>
                {status.error ? ` · ${status.error}` : ""}
              </span>
            )}
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div>
            <Label className="mb-2 block text-xs font-medium text-muted-foreground">입력 소스</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mdSource"
                  checked={source === "upload"}
                  onChange={() => setSource("upload")}
                />
                파일 업로드 (PDF, DOCX, EPUB, PPT, Excel 등)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mdSource"
                  checked={source === "docx"}
                  onChange={() => setSource("docx")}
                />
                저장된 Word(DOCX) 사용
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mdSource"
                  checked={source === "pdf"}
                  onChange={() => setSource("pdf")}
                />
                저장된 PDF 사용
              </label>
            </div>
          </div>

          {source === "upload" && (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept={MARKITDOWN_ACCEPT}
                className="hidden"
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" />
                {pendingFile ? pendingFile.name : "파일 선택…"}
              </Button>
            </div>
          )}

          <div>
            <Label className="mb-2 block text-xs font-medium text-muted-foreground">적용 방식</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mdMode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />
                기존 챕터 교체
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mdMode"
                  checked={mode === "append"}
                  onChange={() => setMode("append")}
                />
                새 챕터로 추가
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mdMode"
                  checked={mode === "chapter"}
                  onChange={() => setMode("chapter")}
                  disabled={!chapterId}
                />
                현재 챕터에만 적용
                {!chapterId && <span className="text-muted-foreground">(챕터 없음)</span>}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button
            type="button"
            onClick={() => void handleConvert()}
            disabled={loading || !status?.available || (source === "upload" && !pendingFile)}
          >
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileCode2 className="mr-2 size-4" />}
            마크다운으로 변환
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
