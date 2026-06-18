"use client";

import {
  BookOpen,
  ListTree,
  PanelRight,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type MobileDrawer = "chapters" | "nav" | "settings" | null;

type EditorMobileDockProps = {
  activeDrawer: MobileDrawer;
  onToggleDrawer: (drawer: MobileDrawer) => void;
  zoom: number;
  pageNumber: number;
  pageTotal: number;
  onZoomChange: (zoom: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function EditorMobileDock({
  activeDrawer,
  onToggleDrawer,
  zoom,
  pageNumber,
  pageTotal,
  onZoomChange,
  onPrevPage,
  onNextPage,
}: EditorMobileDockProps) {
  const toggle = (drawer: MobileDrawer) => {
    onToggleDrawer(activeDrawer === drawer ? null : drawer);
  };

  return (
    <nav className="editor-mobile-dock" aria-label="편집기 빠른 메뉴">
      <button
        type="button"
        className={`editor-dock-btn ${activeDrawer === "chapters" ? "editor-dock-btn--active" : ""}`}
        onClick={() => toggle("chapters")}
      >
        <BookOpen />
        챕터
      </button>
      <button
        type="button"
        className={`editor-dock-btn ${activeDrawer === "nav" ? "editor-dock-btn--active" : ""}`}
        onClick={() => toggle("nav")}
      >
        <ListTree />
        목차
      </button>
      <button
        type="button"
        className="editor-dock-btn"
        onClick={onPrevPage}
        disabled={pageNumber <= 1}
      >
        <ChevronLeft />
        이전
      </button>
      <span className="flex flex-col items-center justify-center px-1 text-[10px] text-slate-500">
        <span>
          {pageNumber}/{pageTotal}
        </span>
        <span>{Math.round(zoom * 100)}%</span>
      </span>
      <button
        type="button"
        className="editor-dock-btn"
        onClick={onNextPage}
        disabled={pageNumber >= pageTotal}
      >
        <ChevronRight />
        다음
      </button>
      <button type="button" className="editor-dock-btn" onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}>
        <Plus />
        확대
      </button>
      <button type="button" className="editor-dock-btn" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}>
        <Minus />
        축소
      </button>
      <button
        type="button"
        className={`editor-dock-btn ${activeDrawer === "settings" ? "editor-dock-btn--active" : ""}`}
        onClick={() => toggle("settings")}
      >
        <PanelRight />
        설정
      </button>
    </nav>
  );
}
