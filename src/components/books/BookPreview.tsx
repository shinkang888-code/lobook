"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Book } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookPreviewProps = {
  book: Book;
};

export function BookPreview({ book }: BookPreviewProps) {
  const html = book.content_html || `<p>${book.content_md.replace(/\n/g, "<br/>")}</p>`;

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/export`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "EPUB 내보내기 실패");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${book.title || "book"}.epub`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("EPUB 파일을 다운로드했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "EPUB 내보내기 실패");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/books/${book.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft />
          편집으로 돌아가기
        </Link>
        <Button variant="outline" onClick={handleExport}>
          <Download />
          EPUB 내보내기
        </Button>
      </div>

      <article className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
        <header className="mb-8 border-b pb-6">
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{book.title}</h1>
        </header>
        <div className="book-content" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
