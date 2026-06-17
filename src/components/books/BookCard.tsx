"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteBook } from "@/hooks/useBooks";
import type { Book } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  const deleteBook = useDeleteBook();

  const handleDelete = async () => {
    if (!confirm(`"${book.title}"을(를) 삭제할까요?`)) return;
    try {
      await deleteBook.mutateAsync(book.id);
      toast.success("삭제되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제 실패");
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">{book.title}</CardTitle>
          <Badge variant={book.status === "published" ? "default" : "secondary"}>
            {book.status === "published" ? "발행" : "초안"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{book.author}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {book.content_md || "아직 내용이 없습니다."}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(book.updated_at), { addSuffix: true, locale: ko })}
        </span>
        <div className="flex gap-1">
          <Link
            href={`/books/${book.id}/preview`}
            className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }))}
          >
            <Eye className="size-4" />
          </Link>
          <Link
            href={`/books/${book.id}`}
            className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }))}
          >
            <Pencil className="size-4" />
          </Link>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteBook.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
