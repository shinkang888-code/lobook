"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageCanvas, ZoomControls } from "@/components/editor/canvas/PageCanvas";
import { PageSpecPanel } from "@/components/editor/canvas/PageSpecPanel";
import {
  MarkdownEditorPanel,
  type MarkdownEditorPanelHandle,
} from "@/components/editor/markdown/MarkdownEditorPanel";
import { ChapterList } from "@/components/editor/navigation/ChapterList";
import { PageThumbnailStrip } from "@/components/editor/navigation/PageThumbnailStrip";
import { TocNavigator } from "@/components/editor/navigation/TocNavigator";
import { ConvertToMarkdownDialog } from "@/components/editor/modals/ConvertToMarkdownDialog";
import { ImportDialog, type ImportKind } from "@/components/editor/modals/ImportDialog";
import { EditorTabBar } from "@/components/editor/shell/EditorTabBar";
import { EditorToolbarProvider, useEditorToolbar } from "@/components/editor/shell/EditorToolbarContext";
import { LibreOfficeRibbon } from "@/components/editor/libreoffice/LibreOfficeRibbon";
import { LibreOfficeHub, type LibreOfficePanelId } from "@/components/editor/libreoffice/LibreOfficeHub";
import { LibreOfficeSidebar } from "@/components/editor/libreoffice/LibreOfficeSidebar";
import { StudioHub } from "@/components/editor/studio/StudioHub";
import { StatusBar } from "@/components/editor/shell/StatusBar";
import type { WordEditorPanelHandle } from "@/components/editor/word/WordEditorPanel";
import type { HtmlEditorPanelHandle } from "@/components/editor/html/HtmlEditorPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddChapter, useBookStructure, useSaveBookStructure } from "@/hooks/useBookStructure";
import { useQueryClient } from "@tanstack/react-query";
import { loadPageSpec, savePageSpec } from "@/lib/editor/pageSpec";
import { buildTocFromMarkdown, splitMarkdownToPages } from "@/lib/editor/tocBuilder";
import type { EditorMode, PageSpec } from "@/lib/editor/types";
import { normalizeEditorMode } from "@/lib/editor/types";
import type { Book, BookStatus, SaveStructureInput } from "@/lib/types";

type BookEditorShellProps = {
  book: Book;
};

function BookEditorShellInner({ book }: BookEditorShellProps) {
  const router = useRouter();
  const mdRef = useRef<MarkdownEditorPanelHandle>(null);
  const htmlRef = useRef<HtmlEditorPanelHandle>(null);
  const wordRef = useRef<WordEditorPanelHandle>(null);
  const toolbar = useEditorToolbar();

  const { data: structure, isLoading } = useBookStructure(book.id);
  const saveStructure = useSaveBookStructure(book.id);
  const addChapter = useAddChapter(book.id);

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [status] = useState<BookStatus>(book.status);
  const [dirty, setDirty] = useState(false);
  const [activeMode, setActiveMode] = useState<EditorMode>("libreoffice");
  const [loPanel, setLoPanel] = useState<LibreOfficePanelId>("writer");
  const [pageSpec, setPageSpec] = useState<PageSpec>(() => loadPageSpec(book.id));
  const [zoom, setZoom] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [leftTab, setLeftTab] = useState<"toc" | "thumb">("toc");
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [chapterDrafts, setChapterDrafts] = useState<Record<string, { md: string; html: string }>>({});
  const [importKind, setImportKind] = useState<ImportKind | null>(null);
  const [convertMarkdownOpen, setConvertMarkdownOpen] = useState(false);
  const [hwpPageCount, setHwpPageCount] = useState(0);
  const queryClient = useQueryClient();

  const chapters = structure?.chapters ?? [];
  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? chapters[0];

  useEffect(() => {
    if (structure?.book.page_spec) {
      setPageSpec(structure.book.page_spec);
    }
    if (chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(chapters[0].id);
    }
  }, [structure, chapters, activeChapterId]);

  useEffect(() => {
    if (!activeChapter) return;
    setChapterDrafts((prev) => {
      if (prev[activeChapter.id]) return prev;
      return {
        ...prev,
        [activeChapter.id]: {
          md: activeChapter.content_md,
          html: activeChapter.content_html,
        },
      };
    });
  }, [activeChapter]);

  const currentMd = activeChapter
    ? (chapterDrafts[activeChapter.id]?.md ?? activeChapter.content_md)
    : book.content_md;

  const currentHtml = activeChapter
    ? (chapterDrafts[activeChapter.id]?.html ?? activeChapter.content_html)
    : book.content_html;

  const pages = useMemo(() => splitMarkdownToPages(currentMd), [currentMd]);
  const toc = useMemo(() => buildTocFromMarkdown(currentMd), [currentMd]);
  const pageTotal =
    normalizeEditorMode(activeMode) === "libreoffice" && hwpPageCount > 0
      ? hwpPageCount
      : Math.max(1, pages.length);

  const primaryMode = normalizeEditorMode(activeMode);
  const isFullWidth = primaryMode === "libreoffice" || primaryMode === "studio";

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

  const updateDraft = useCallback(
    (field: "md" | "html", value: string) => {
      if (!activeChapter) return;
      setChapterDrafts((prev) => ({
        ...prev,
        [activeChapter.id]: {
          md: field === "md" ? value : (prev[activeChapter.id]?.md ?? activeChapter.content_md),
          html: field === "html" ? value : (prev[activeChapter.id]?.html ?? activeChapter.content_html),
        },
      }));
      setDirty(true);
    },
    [activeChapter],
  );

  const buildSavePayload = useCallback((): SaveStructureInput => {
    const updatedChapters = chapters.map((ch) => {
      const draft = chapterDrafts[ch.id];
      let content_md = draft?.md ?? ch.content_md;
      let content_html = draft?.html ?? ch.content_html;

      if (ch.id === activeChapter?.id) {
        const mode = normalizeEditorMode(activeMode);
        if (mode === "writer" && mdRef.current) {
          content_md = mdRef.current.getMarkdown();
          content_html = mdRef.current.getHTML();
        } else if (mode === "libreoffice") {
          if (htmlRef.current) {
            content_html = htmlRef.current.getHtml();
          } else if (wordRef.current) {
            content_html = wordRef.current.getHtml();
          }
        }
      }

      return {
        id: ch.id,
        title: ch.id === activeChapter?.id && draft ? ch.title : ch.title,
        sort_order: ch.sort_order,
        content_md,
        content_html,
        primary_source: ch.primary_source,
      };
    });

    return {
      title,
      author,
      status,
      page_spec: pageSpec,
      chapters: updatedChapters,
    };
  }, [chapters, chapterDrafts, activeChapter, activeMode, title, author, status, pageSpec]);

  const handleSave = async () => {
    try {
      await saveStructure.mutateAsync(buildSavePayload());
      setDirty(false);
      toast.success("저장되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장 실패");
    }
  };

  const downloadBlob = async (url: string, filename: string) => {
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "다운로드 실패");
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleExportEpub = async () => {
    try {
      if (dirty) await handleSave();
      await downloadBlob(`/api/books/${book.id}/export`, `${title || "book"}.epub`);
      toast.success("EPUB 파일을 다운로드했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "EPUB 내보내기 실패");
    }
  };

  const handleExportDocx = async () => {
    try {
      if (dirty) await handleSave();
      await downloadBlob(`/api/books/${book.id}/export/docx`, `${title || "book"}.docx`);
      toast.success("Word(DOCX) 파일을 다운로드했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "DOCX 내보내기 실패");
    }
  };

  const handleExportPdf = async () => {
    try {
      if (dirty) await handleSave();
      await downloadBlob(`/api/books/${book.id}/export/pdf`, `${title || "book"}-print.html`);
      toast.success("인쇄용 HTML을 다운로드했습니다. 브라우저에서 PDF로 저장하세요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF 내보내기 실패");
    }
  };

  const handleSnapshot = async () => {
    try {
      if (dirty) await handleSave();
      const res = await fetch(`/api/books/${book.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: `v ${new Date().toLocaleString("ko-KR")}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "버전 저장 실패");
      toast.success(
        data.version ? "버전 스냅샷이 저장되었습니다." : (data.message ?? "완료되었습니다."),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "버전 저장 실패");
    }
  };

  const importModeToPanel = (mode: "word" | "hwp" | "pdf"): LibreOfficePanelId => {
    if (mode === "hwp") return "hwp";
    if (mode === "pdf") return "pdf";
    return "writer";
  };

  const handleImportSuccess = (opts?: { switchMode?: "word" | "hwp" | "pdf" }) => {
    setChapterDrafts({});
    setDirty(false);
    if (opts?.switchMode) {
      setActiveMode("libreoffice");
      setLoPanel(importModeToPanel(opts.switchMode));
    }
    void queryClient.invalidateQueries({ queryKey: ["books", book.id, "structure"] });
  };

  const handleConvertMarkdownSuccess = () => {
    setChapterDrafts({});
    setDirty(false);
    setActiveMode("writer");
    void queryClient.invalidateQueries({ queryKey: ["books", book.id, "structure"] });
  };

  const handleAddChapter = async () => {
    try {
      const chapter = await addChapter.mutateAsync(`제${chapters.length + 1}장`);
      setActiveChapterId(chapter.id);
      toast.success("챕터가 추가되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "챕터 추가 실패");
    }
  };

  const renderEditor = () => {
    if (isLoading || !activeChapter) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          {isLoading ? "불러오는 중…" : "챕터가 없습니다."}
        </div>
      );
    }

    switch (primaryMode) {
      case "writer":
        return (
          <MarkdownEditorPanel
            key={activeChapter.id}
            ref={mdRef}
            bookId={book.id}
            initialValue={currentMd}
            onChange={() => {
              const md = mdRef.current?.getMarkdown() ?? "";
              updateDraft("md", md);
              updateDraft("html", mdRef.current?.getHTML() ?? "");
            }}
            onUploadError={(msg) => toast.error(msg)}
          />
        );
      case "libreoffice":
        return (
          <LibreOfficeHub
            bookId={book.id}
            bookTitle={title}
            chapterTitle={activeChapter.title}
            initialHtml={currentHtml}
            pageSpec={pageSpec}
            zoom={zoom}
            activePage={activePage}
            wordRef={wordRef}
            htmlRef={htmlRef}
            initialPanel={loPanel}
            onWordChange={() => updateDraft("html", wordRef.current?.getHtml() ?? "")}
            onHtmlChange={() => updateDraft("html", htmlRef.current?.getHtml() ?? "")}
            onPageCountChange={setHwpPageCount}
            onConvertedToWord={() => {
              setChapterDrafts({});
              setDirty(false);
              setLoPanel("writer");
              void queryClient.invalidateQueries({ queryKey: ["books", book.id, "structure"] });
            }}
            onApplyOcrText={(text) => {
              const html = text
                .split(/\n\n+/)
                .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
                .join("");
              updateDraft("md", text);
              updateDraft("html", html);
              setDirty(true);
              toast.success("OCR 텍스트가 현재 챕터에 적용되었습니다.");
            }}
          />
        );
      case "studio":
        return <StudioHub bookId={book.id} bookTitle={title} />;
      default:
        return null;
    }
  };

  return (
    <div className="hancom-editor-shell lo-shell fixed inset-0 z-50 flex flex-col hancom-workspace-bg">
      <LibreOfficeRibbon
        editorMode={activeMode}
        bookTitle={title}
        saving={saveStructure.isPending}
        dirty={dirty}
        onSave={() => void handleSave()}
        onExportEpub={() => void handleExportEpub()}
        onExportDocx={() => void handleExportDocx()}
        onExportPdf={() => void handleExportPdf()}
        onImportDocx={() => setImportKind("docx")}
        onImportEpub={() => setImportKind("epub")}
        onImportHwp={() => setImportKind("hwp")}
        onImportPdf={() => setImportKind("pdf")}
        onConvertMarkdown={() => setConvertMarkdownOpen(true)}
        onSnapshot={() => void handleSnapshot()}
        onPreview={() => router.push(`/books/${book.id}/preview`)}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => {
          setShowThumbnails((v) => !v);
          setLeftTab("thumb");
        }}
      />

      {importKind && (
        <ImportDialog
          bookId={book.id}
          open={Boolean(importKind)}
          onOpenChange={(open) => !open && setImportKind(null)}
          kind={importKind}
          onSuccess={handleImportSuccess}
        />
      )}

      <ConvertToMarkdownDialog
        bookId={book.id}
        chapterId={activeChapter?.id}
        open={convertMarkdownOpen}
        onOpenChange={setConvertMarkdownOpen}
        onSuccess={handleConvertMarkdownSuccess}
      />

      <EditorTabBar activeMode={activeMode} onModeChange={setActiveMode} />

      <div className="flex min-h-0 flex-1">
        <aside
          className="hidden shrink-0 flex-col border-r border-gray-300 bg-white lg:flex"
          style={{ width: "var(--editor-left-width, 260px)" }}
        >
          <ChapterList
            chapters={chapters}
            activeChapterId={activeChapter?.id ?? ""}
            onSelect={setActiveChapterId}
            onAdd={() => void handleAddChapter()}
            adding={addChapter.isPending}
          />
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as "toc" | "thumb")} className="flex min-h-0 flex-1 flex-col">
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
                <TocNavigator nodes={toc} activePage={activePage} onPageSelect={setActivePage} />
              ) : (
                <PageThumbnailStrip pages={pages} activePage={activePage} onPageSelect={setActivePage} />
              )}
            </div>
          </Tabs>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {isFullWidth ? (
            <div className="min-h-0 flex-1">{renderEditor()}</div>
          ) : (
            <>
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
            </>
          )}
        </main>

        <aside
          className={`hidden shrink-0 lg:block ${isFullWidth ? "" : ""}`}
          style={{ width: "var(--editor-right-width, 280px)" }}
        >
          {primaryMode === "libreoffice" ? (
            <LibreOfficeSidebar
              pageSpec={pageSpec}
              docKind={loPanel === "tools" ? "writer" : loPanel}
              moduleLabel={
                loPanel === "writer"
                  ? "Loffice Writer"
                  : loPanel === "hwp"
                    ? "HWP Filter"
                    : loPanel === "pdf"
                      ? "PDF Filter"
                      : loPanel === "html"
                        ? "HTML Source"
                        : "LoOffice Tools"
              }
              onPageSpecChange={(spec) => {
                setPageSpec(spec);
                setDirty(true);
              }}
            />
          ) : (
            <PageSpecPanel
              pageSpec={pageSpec}
              onChange={(spec) => {
                setPageSpec(spec);
                setDirty(true);
              }}
              bookTitle={title}
              author={author}
              onMetaChange={(field, value) => {
                if (field === "title") setTitle(value);
                else setAuthor(value);
                setDirty(true);
              }}
            />
          )}
        </aside>
      </div>

      <StatusBar
        pageNumber={activePage}
        pageTotal={pageTotal}
        pageSpec={pageSpec}
        editorMode={activeMode}
        zoom={zoom}
        bookTitle={`${title}${activeChapter ? ` · ${activeChapter.title}` : ""}`}
      />
    </div>
  );
}

export function BookEditorShell({ book }: BookEditorShellProps) {
  return (
    <EditorToolbarProvider>
      <BookEditorShellInner book={book} />
    </EditorToolbarProvider>
  );
}
