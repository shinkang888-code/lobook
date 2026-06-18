import figma from "@figma/code-connect/react";
import { Button } from "./button";

/**
 * LoBooK — Button (shadcn/ui)
 * Figma: https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3/Book-Studio-Design-System?node-id=1-2
 */
figma.connect(Button, "https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3?node-id=1-2", {
  props: {
    variant: figma.enum("Variant", {
      Default: "default",
      Outline: "outline",
      Secondary: "secondary",
      Ghost: "ghost",
    }),
    size: figma.enum("Size", {
      Default: "default",
      Small: "sm",
      Large: "lg",
    }),
    label: figma.string("Label"),
  },
  example: ({ variant, size, label }) => (
    <Button variant={variant} size={size}>
      {label}
    </Button>
  ),
});
