"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { EditorMarginTools } from "@/components/editor/shell/EditorMarginTools";
import {
  EditorMobileDock,
  type MobileDrawer,
} from "@/components/editor/shell/EditorMobileDock";
import "./editor-workspace.css";

type EditorWorkspaceLayoutProps = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  navPanel?: ReactNode;
  children: ReactNode;
  zoom: number;
  pageNumber: number;
  pageTotal: number;
  onZoomChange: (zoom: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  mobileDrawer: MobileDrawer;
  onMobileDrawerChange: (drawer: MobileDrawer) => void;
  showMarginTools?: boolean;
};

function MobileDrawerPanel({
  open,
  side,
  title,
  onClose,
  children,
}: {
  open: boolean;
  side: "left" | "right";
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <div className="editor-mobile-drawer-backdrop lg:hidden" onClick={onClose} aria-hidden />
      <aside
        className={`editor-mobile-drawer editor-mobile-drawer--${side} lg:hidden`}
        role="dialog"
        aria-label={title}
      >
        <div className="editor-mobile-drawer-header">
          <span>{title}</span>
          <button type="button" className="editor-margin-btn" onClick={onClose} aria-label="닫기">
            <X className="size-4" />
          </button>
        </div>
        <div className="editor-mobile-drawer-body">{children}</div>
      </aside>
    </>
  );
}

export function EditorWorkspaceLayout({
  leftPanel,
  rightPanel,
  navPanel,
  children,
  zoom,
  pageNumber,
  pageTotal,
  onZoomChange,
  onPrevPage,
  onNextPage,
  mobileDrawer,
  onMobileDrawerChange,
  showMarginTools = true,
}: EditorWorkspaceLayoutProps) {
  const closeDrawer = () => onMobileDrawerChange(null);

  return (
    <>
      <div className="editor-workspace">
        <aside className="editor-workspace-rail editor-workspace-rail--left">{leftPanel}</aside>

        <div className="editor-workspace-center">
          {showMarginTools && (
            <EditorMarginTools
              side="left"
              zoom={zoom}
              pageNumber={pageNumber}
              pageTotal={pageTotal}
              onZoomChange={onZoomChange}
              onPrevPage={onPrevPage}
              onNextPage={onNextPage}
            />
          )}

          <main className="editor-workspace-canvas">{children}</main>

          {showMarginTools && (
            <EditorMarginTools
              side="right"
              zoom={zoom}
              pageNumber={pageNumber}
              pageTotal={pageTotal}
              onZoomChange={onZoomChange}
              onPrevPage={onPrevPage}
              onNextPage={onNextPage}
            />
          )}
        </div>

        <aside className="editor-workspace-rail editor-workspace-rail--right">{rightPanel}</aside>
      </div>

      <EditorMobileDock
        activeDrawer={mobileDrawer}
        onToggleDrawer={onMobileDrawerChange}
        zoom={zoom}
        pageNumber={pageNumber}
        pageTotal={pageTotal}
        onZoomChange={onZoomChange}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />

      <MobileDrawerPanel
        open={mobileDrawer === "chapters"}
        side="left"
        title="챕터"
        onClose={closeDrawer}
      >
        {leftPanel}
      </MobileDrawerPanel>

      <MobileDrawerPanel
        open={mobileDrawer === "nav"}
        side="left"
        title="목차 · 썸네일"
        onClose={closeDrawer}
      >
        {navPanel ?? leftPanel}
      </MobileDrawerPanel>

      <MobileDrawerPanel
        open={mobileDrawer === "settings"}
        side="right"
        title="페이지 설정"
        onClose={closeDrawer}
      >
        {rightPanel}
      </MobileDrawerPanel>
    </>
  );
}
