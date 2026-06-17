import { BookList } from "@/components/books/BookList";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">내 전자책</h1>
        <p className="mt-2 text-muted-foreground">
          naverb(Toast UI Editor) 기반 에디터로 작성하고 EPUB3 파일로 내보낼 수 있습니다.
        </p>
      </div>
      <BookList />
    </section>
  );
}
