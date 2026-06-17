"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BookEditorShell } from "@/components/editor/shell/BookEditorShell";
import { useUpdateBook } from "@/hooks/useBooks";
import type { Book, BookStatus } from "@/lib/types";

type BookEditorProps = {
  book: Book;
};

export function BookEditor({ book }: BookEditorProps) {
  const router = useRouter();
  const updateBook = useUpdateBook(book.id);

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [dirty, setDirty] = useState(false);

  const handleSave = async (
    content: { content_md: string; content_html: string },
    nextStatus = status,
  ) => {
    try {
      await updateBook.mutateAsync({
        title,
        author,
        status: nextStatus,
        content_md: content.content_md,
        content_html: content.content_html,
      });
      setStatus(nextStatus);
      setDirty(false);
      toast.success(nextStatus === "published" ? "발행되었습니다." : "저장되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장 실패");
      throw error;
    }
  };

  const handleExport = async (
    getContent: () => { content_md: string; content_html: string },
  ) => {
    try {
      if (dirty) await handleSave(getContent(), status);
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
    <BookEditorShell
      book={book}
      title={title}
      author={author}
      status={status}
      saving={updateBook.isPending}
      dirty={dirty}
      onTitleChange={setTitle}
      onAuthorChange={setAuthor}
      onDirty={() => setDirty(true)}
      onSave={handleSave}
      onExport={handleExport}
      onPreview={() => router.push(`/books/${book.id}/preview`)}
    />
  );
}
