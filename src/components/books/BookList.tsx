"use client";

import Link from "next/link";
import { BookPlus, Loader2 } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { useBooks } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";

type BookListProps = {
  onNewBook?: () => void;
  onBookNavigate?: () => void;
};

export function BookList({ onNewBook, onBookNavigate }: BookListProps) {
  const { data: books, isLoading, error } = useBooks();

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        전자책 목록 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  if (!books?.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
        <BookPlus className="size-10 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">첫 전자책을 만들어 보세요</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Markdown/WYSIWYG 에디터로 작성하고 EPUB으로 내보낼 수 있습니다.
          </p>
        </div>
        {onNewBook ? (
          <Button onClick={onNewBook}>새 전자책 만들기</Button>
        ) : (
          <Link href="/books/new" className={cn(buttonVariants())}>
            새 전자책 만들기
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onNavigate={onBookNavigate} />
      ))}
    </div>
  );
}
