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

export type ImportKind = "docx" | "epub" | "hwp";

type ImportDialogProps = {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ImportKind;
  onSuccess: () => void;
};

const KIND_LABELS: Record<ImportKind, { title: string; accept: string; ext: string }> = {
  docx: {
    title: "Word (DOCX) 가져오기",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "DOCX",
  },
  epub: { title: "EPUB 가져오기", accept: ".epub,application/epub+zip", ext: "EPUB" },
  hwp: { title: "HWP/HWPX 가져오기", accept: ".hwp,.hwpx", ext: "HWP/HWPX" },
};

export function ImportDialog({ bookId, open, onOpenChange, kind, onSuccess }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"replace" | "append">("replace");

  const meta = KIND_LABELS[kind];

  const handleImport = async (file: File) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (kind !== "hwp") form.append("mode", mode);

      const endpoint =
        kind === "docx"
          ? `/api/books/${bookId}/import/docx`
          : kind === "epub"
            ? `/api/books/${bookId}/import/epub`
            : `/api/books/${bookId}/import/hwp`;

      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "가져오기 실패");

      if (kind === "hwp") {
        toast.success("HWP 파일이 저장되었습니다. HWP 탭에서 미리보기하세요.");
      } else {
        toast.success(
          `${data.imported ?? 1}개 챕터를 가져왔습니다.${data.structure?.chapters?.length ? ` (총 ${data.structure.chapters.length}챕터)` : ""}`,
        );
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "가져오기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>
            {meta.ext} 파일을 선택하세요. 가져온 내용은 챕터로 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        {kind !== "hwp" && (
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

        <div className="rounded-lg border border-dashed p-8 text-center">
          <input
            ref={inputRef}
            type="file"
            accept={meta.accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
          <FileUp className="mx-auto mb-2 size-10 text-muted-foreground" />
          <Label className="text-muted-foreground">{meta.ext} 파일</Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={() => inputRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            파일 선택
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
