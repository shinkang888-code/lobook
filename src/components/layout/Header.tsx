"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LofficeBookLogo } from "@/components/brand/LofficeBookLogo";
import { BookDashboardDialog } from "@/components/books/BookDashboardDialog";
import { Button } from "@/components/ui/button";
import { LOOFFICE_HOME_URL } from "@/lib/branding";

export function Header() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <a
            href={LOOFFICE_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg px-1 py-0.5 transition hover:bg-[#e8f5e6]/80"
            title="Loffice 메인 포털 열기"
          >
            <LofficeBookLogo size={36} showName nameClassName="text-lg" />
          </a>
          <Button size="sm" onClick={() => setDashboardOpen(true)}>
            <Plus className="size-4" />
            새 전자책
          </Button>
        </div>
      </header>
      <BookDashboardDialog open={dashboardOpen} onOpenChange={setDashboardOpen} />
    </>
  );
}
