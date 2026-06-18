import figma from "@figma/code-connect/react";
import { BookCard } from "./BookCard";

/**
 * LoBooK — BookCard
 * Figma: https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3/Book-Studio-Design-System?node-id=1-2
 */
figma.connect(BookCard, "https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3?node-id=1-2", {
  props: {
    title: figma.string("Title"),
    author: figma.string("Author"),
    status: figma.enum("Status", {
      Draft: "draft",
      Published: "published",
    }),
  },
  example: ({ title, author, status }) => (
    <BookCard
      book={{
        id: "example-id",
        title,
        author,
        status,
        content_md: "본문 미리보기",
        content_html: "<p>본문 미리보기</p>",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }}
    />
  ),
});
