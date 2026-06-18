import { BookList } from "@/components/books/BookList";
import { APP_NAME } from "@/lib/branding";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">내 전자책</h1>
        <p className="mt-2 text-muted-foreground">
          {APP_NAME} 멀티 편집기로 작성하고 EPUB·DOCX 파일로보낼 수 있습니다.
        </p>
      </div>
      <BookList />
    </section>
  );
}
