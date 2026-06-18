"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { BookList } from "@/components/books/BookList";
import { NewBookForm } from "@/components/books/NewBookForm";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/branding";

type BookDashboardProps = {
  onClose?: () => void;
};

export function BookDashboard({ onClose }: BookDashboardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"list" | "new">("list");

  const handleCreated = (bookId: string) => {
    onClose?.();
    router.push(`/books/${bookId}`);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">내 전자책</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {APP_NAME} 멀티 편집기로 작성하고 EPUB·DOCX 파일로보낼 수 있습니다.
          </p>
        </div>
        {mode === "list" && (
          <Button size="sm" onClick={() => setMode("new")}>
            <Plus className="size-4" />
            새 전자책
          </Button>
        )}
      </div>

      {mode === "list" ? (
        <BookList onNewBook={() => setMode("new")} onBookNavigate={onClose} />
      ) : (
        <NewBookForm
          embedded
          onCreated={handleCreated}
          onCancel={() => setMode("list")}
        />
      )}
    </section>
  );
}
