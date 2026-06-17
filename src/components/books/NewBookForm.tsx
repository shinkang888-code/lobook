"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBook } from "@/hooks/useBooks";

export function NewBookForm() {
  const router = useRouter();
  const createBook = useCreateBook();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const book = await createBook.mutateAsync({
        title: title.trim() || "제목 없음",
        author: author.trim() || "익명",
      });
      toast.success("새 전자책이 생성되었습니다.");
      router.push(`/books/${book.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "생성 실패");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 rounded-2xl border bg-card p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">새 전자책</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          제목과 저자를 입력한 뒤 에디터에서 본문을 작성하세요.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-title">제목</Label>
        <Input
          id="new-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="나의 첫 전자책"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-author">저자</Label>
        <Input
          id="new-author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="홍길동"
        />
      </div>
      <Button type="submit" disabled={createBook.isPending} className="w-full">
        {createBook.isPending && <Loader2 className="animate-spin" />}
        만들기
      </Button>
    </form>
  );
}
