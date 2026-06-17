"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { BookEditor } from "@/components/books/BookEditor";
import { useBook } from "@/hooks/useBooks";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditBookPage({ params }: PageProps) {
  const { id } = React.use(params);
  const { data: book, isLoading, error } = useBook(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error?.message ?? "책을 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">편집</h1>
        <p className="text-sm text-muted-foreground">Markdown · WYSIWYG · EPUB 내보내기</p>
      </div>
      <BookEditor book={book} />
    </section>
  );
}
