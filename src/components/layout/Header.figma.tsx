import figma from "@figma/code-connect/react";
import { Header } from "./Header";

/**
 * LoBooK — Header
 * Figma: https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3/Book-Studio-Design-System?node-id=1-2
 */
figma.connect(Header, "https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3?node-id=1-2", {
  example: () => <Header />,
});
