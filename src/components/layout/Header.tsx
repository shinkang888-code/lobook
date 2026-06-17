import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </span>
          Book Studio
        </Link>
        <Link href="/books/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="size-4" />
          새 전자책
        </Link>
      </div>
    </header>
  );
}
