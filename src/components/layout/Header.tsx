import Link from "next/link";
import { Plus } from "lucide-react";
import { LoBookLogo } from "@/components/brand/LoBookLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LoBookLogo size={36} showName nameClassName="text-lg" />
        </Link>
        <Link href="/books/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="size-4" />
          새 전자책
        </Link>
      </div>
    </header>
  );
}
