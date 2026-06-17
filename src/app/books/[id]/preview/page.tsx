"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { BookPreview } from "@/components/books/BookPreview";
import { useBook } from "@/hooks/useBooks";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function PreviewBookPage({ params }: PageProps) {
  const { id } = React.use(params);
  const { data: book, isLoading, error } = useBook(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        미리보기 준비 중...
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

  return <BookPreview book={book} />;
}
