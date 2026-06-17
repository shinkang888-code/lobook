"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageCanvas, ZoomControls } from "@/components/editor/canvas/PageCanvas";
import { PageSpecPanel } from "@/components/editor/canvas/PageSpecPanel";
import { HwpEditorPanel } from "@/components/editor/hwp/HwpEditorPanel";
import { HtmlEditorPanel, type HtmlEditorPanelHandle } from "@/components/editor/html/HtmlEditorPanel";
import {
  MarkdownEditorPanel,
  type MarkdownEditorPanelHandle,
} from "@/components/editor/markdown/MarkdownEditorPanel";
import { PageThumbnailStrip } from "@/components/editor/navigation/PageThumbnailStrip";
import { TocNavigator } from "@/components/editor/navigation/TocNavigator";
import { EditorTabBar } from "@/components/editor/shell/EditorTabBar";
import { EditorToolbarProvider, useEditorToolbar } from "@/components/editor/shell/EditorToolbarContext";
import { PolarisRibbon } from "@/components/editor/shell/PolarisRibbon";
import { StatusBar } from "@/components/editor/shell/StatusBar";
import { WordEditorPanel, type WordEditorPanelHandle } from "@/components/editor/word/WordEditorPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadPageSpec, savePageSpec } from "@/lib/editor/pageSpec";
import { buildTocFromMarkdown, splitMarkdownToPages } from "@/lib/editor/tocBuilder";
import type { EditorMode, PageSpec } from "@/lib/editor/types";
import type { Book, BookStatus } from "@/lib/types";

type BookEditorShellProps = {
  book: Book;
  title: string;
  author: string;
  status: BookStatus;
  saving?: boolean;
  dirty?: boolean;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onDirty: () => void;
  onSave: (
    content: { content_md: string; content_html: string },
    nextStatus?: BookStatus,
  ) => Promise<void>;
  onExport: (getContent: () => { content_md: string; content_html: string }) => Promise<void>;
  onPreview: () => void;
};

function BookEditorShellInner({
  book,
  title,
  author,
  saving,
  dirty,
  onTitleChange,
  onAuthorChange,
  onDirty,
  onSave,
  onExport,
  onPreview,
}: BookEditorShellProps) {
  const mdRef = useRef<MarkdownEditorPanelHandle>(null);
  const htmlRef = useRef<HtmlEditorPanelHandle>(null);
  const wordRef = useRef<WordEditorPanelHandle>(null);
  const toolbar = useEditorToolbar();

  const [activeMode, setActiveMode] = useState<EditorMode>("markdown");
  const [pageSpec, setPageSpec] = useState<PageSpec>(() => loadPageSpec(book.id));
  const [zoom, setZoom] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [leftTab, setLeftTab] = useState<"toc" | "thumb">("toc");
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [contentMd, setContentMd] = useState(book.content_md);

  const pages = useMemo(() => splitMarkdownToPages(contentMd), [contentMd]);
  const toc = useMemo(() => buildTocFromMarkdown(contentMd), [contentMd]);
  const pageTotal = pages.length;

  useEffect(() => {
    savePageSpec(book.id, pageSpec);
  }, [book.id, pageSpec]);

  useEffect(() => {
    toolbar.register({
      zoomIn: () => setZoom((z) => Math.min(2, z + 0.1)),
      zoomOut: () => setZoom((z) => Math.max(0.5, z - 0.1)),
      zoomFit: () => setZoom(0.75),
      zoomReset: () => setZoom(1),
      prevPage: () => setActivePage((p) => Math.max(1, p - 1)),
      nextPage: () => setActivePage((p) => Math.min(pageTotal, p + 1)),
    });
  }, [toolbar, pageTotal]);

  const handleMdChange = useCallback(() => {
    const md = mdRef.current?.getMarkdown() ?? "";
    setContentMd(md);
    onDirty();
  }, [onDirty]);

  const getContent = useCallback(() => {
    const content_md = mdRef.current?.getMarkdown() ?? book.content_md;
    let content_html = mdRef.current?.getHTML() ?? book.content_html;
    if (activeMode === "html") {
      content_html = htmlRef.current?.getHtml() ?? content_html;
    } else if (activeMode === "word") {
      content_html = wordRef.current?.getHtml() ?? content_html;
    }
    return { content_md, content_html };
  }, [activeMode, book.content_md, book.content_html]);

  const handleSave = useCallback(async () => {
    await onSave(getContent());
  }, [onSave, getContent]);

  const renderEditor = () => {
    switch (activeMode) {
      case "markdown":
        return (
          <MarkdownEditorPanel
            ref={mdRef}
            bookId={book.id}
            initialValue={book.content_md}
            onChange={handleMdChange}
            onUploadError={(msg) => toast.error(msg)}
          />
        );
      case "html":
        return (
          <HtmlEditorPanel
            ref={htmlRef}
            initialHtml={book.content_html || mdRef.current?.getHTML() || ""}
            onChange={onDirty}
          />
        );
      case "word":
        return (
          <WordEditorPanel
            ref={wordRef}
            initialHtml={book.content_html || mdRef.current?.getHTML() || ""}
            onChange={onDirty}
          />
        );
      case "hwp":
        return (
          <HwpEditorPanel
            onImport={() => toast.info("HWP import는 Phase 2에서 hwpreader와 연동됩니다.")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f3f3]">
      <PolarisRibbon
        bookTitle={title}
        saving={saving}
        dirty={dirty}
        onSave={() => void handleSave()}
        onExport={() => void onExport(getContent)}
        onPreview={onPreview}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => {
          setShowThumbnails((v) => !v);
          setLeftTab("thumb");
        }}
      />

      <EditorTabBar activeMode={activeMode} onModeChange={setActiveMode} />

      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <aside
          className="hidden shrink-0 flex-col border-r border-gray-300 bg-white lg:flex"
          style={{ width: "var(--editor-left-width, 260px)" }}
        >
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as "toc" | "thumb")} className="flex h-full flex-col">
            <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
              <TabsTrigger value="toc" className="text-xs">
                목차
              </TabsTrigger>
              <TabsTrigger value="thumb" className="text-xs">
                썸네일
              </TabsTrigger>
            </TabsList>
            <div className="min-h-0 flex-1">
              {leftTab === "toc" ? (
                <TocNavigator
                  nodes={toc}
                  activePage={activePage}
                  onPageSelect={setActivePage}
                />
              ) : (
                <PageThumbnailStrip pages={pages} activePage={activePage} onPageSelect={setActivePage} />
              )}
            </div>
          </Tabs>
        </aside>

        {/* Center */}
        <main className="flex min-w-0 flex-1 flex-col">
          <PageCanvas pageSpec={pageSpec} zoom={zoom}>
            {renderEditor()}
          </PageCanvas>
          <ZoomControls
            zoom={zoom}
            onZoomChange={setZoom}
            pageNumber={activePage}
            pageTotal={pageTotal}
            onPrevPage={() => setActivePage((p) => Math.max(1, p - 1))}
            onNextPage={() => setActivePage((p) => Math.min(pageTotal, p + 1))}
          />
        </main>

        {/* Right panel */}
        <aside
          className="hidden shrink-0 border-l border-gray-300 lg:block"
          style={{ width: "var(--editor-right-width, 300px)" }}
        >
          <PageSpecPanel
            pageSpec={pageSpec}
            onChange={setPageSpec}
            bookTitle={title}
            author={author}
            onMetaChange={(field, value) => {
              if (field === "title") onTitleChange(value);
              else onAuthorChange(value);
              onDirty();
            }}
          />
        </aside>
      </div>

      <StatusBar
        pageNumber={activePage}
        pageTotal={pageTotal}
        pageSpec={pageSpec}
        editorMode={activeMode}
        zoom={zoom}
        bookTitle={title}
      />
    </div>
  );
}

export function BookEditorShell(props: BookEditorShellProps) {
  return (
    <EditorToolbarProvider>
      <BookEditorShellInner {...props} />
    </EditorToolbarProvider>
  );
}
