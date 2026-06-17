"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Download, Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import type { MarkdownEditorHandle } from "@/components/editor/MarkdownEditorInner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateBook } from "@/hooks/useBooks";
import type { Book, BookStatus } from "@/lib/types";

type BookEditorProps = {
  book: Book;
};

export function BookEditor({ book }: BookEditorProps) {
  const router = useRouter();
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const updateBook = useUpdateBook(book.id);

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [dirty, setDirty] = useState(false);

  const handleSave = async (nextStatus = status) => {
    try {
      const content_md = editorRef.current?.getMarkdown() ?? book.content_md;
      const content_html = editorRef.current?.getHTML() ?? book.content_html;
      await updateBook.mutateAsync({
        title,
        author,
        status: nextStatus,
        content_md,
        content_html,
      });
      setStatus(nextStatus);
      setDirty(false);
      toast.success(nextStatus === "published" ? "발행되었습니다." : "저장되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장 실패");
    }
  };

  const handleExport = async () => {
    try {
      if (dirty) await handleSave(status);
      const res = await fetch(`/api/books/${book.id}/export`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "EPUB 내보내기 실패");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title || "book"}.epub`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("EPUB 파일을 다운로드했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "EPUB 내보내기 실패");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">저자</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                setDirty(true);
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {status === "published" ? "발행됨" : "초안"}
          </Badge>
          <Tabs
            value={status}
            onValueChange={(value) => {
              setStatus(value as BookStatus);
              setDirty(true);
            }}
          >
            <TabsList>
              <TabsTrigger value="draft">초안</TabsTrigger>
              <TabsTrigger value="published">발행</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-background">
        <MarkdownEditor
          ref={editorRef}
          bookId={book.id}
          initialValue={book.content_md}
          onChange={() => setDirty(true)}
          onUploadError={(message) => toast.error(message)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleSave(status)} disabled={updateBook.isPending}>
          {updateBook.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          저장
        </Button>
        <Button variant="secondary" onClick={() => handleSave("published")} disabled={updateBook.isPending}>
          발행
        </Button>
        <Button variant="outline" onClick={() => router.push(`/books/${book.id}/preview`)}>
          <Eye />
          미리보기
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download />
          EPUB 내보내기
        </Button>
      </div>
    </div>
  );
}
