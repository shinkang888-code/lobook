"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, FileType, FileImage, Code, Wrench } from "lucide-react";
import { HwpEditorPanel } from "@/components/editor/hwp/HwpEditorPanel";
import { HtmlEditorPanel, type HtmlEditorPanelHandle } from "@/components/editor/html/HtmlEditorPanel";
import { LoOfficeHub } from "@/components/editor/looffice/LoOfficeHub";
import { PdfEditorPanel } from "@/components/editor/pdf/PdfEditorPanel";
import { WordEditorPanel, type WordEditorPanelHandle } from "@/components/editor/word/WordEditorPanel";
import type { PageSpec } from "@/lib/editor/types";
import {
  LIBREOFFICE_ENGINE_BINDINGS,
  type LibreOfficeDocKind,
  type LibreOfficeEngineBinding,
  resolveBindingByPanel,
} from "@/lib/libreoffice/libreOfficeCatalog";
import "./libreoffice-shell.css";

export type LibreOfficePanelId = "writer" | "hwp" | "pdf" | "html" | "tools";

function panelToLobookPanel(panel: LibreOfficePanelId): LibreOfficeEngineBinding["lobookPanel"] {
  if (panel === "writer") return "word";
  if (panel === "tools") return "office";
  return panel;
}

const PANEL_TABS: {
  id: LibreOfficePanelId;
  label: string;
  icon: typeof FileText;
  docKind: LibreOfficeDocKind;
}[] = [
  { id: "writer", label: "Writer", icon: FileText, docKind: "writer" },
  { id: "hwp", label: "HWP", icon: FileType, docKind: "hwp" },
  { id: "pdf", label: "PDF", icon: FileImage, docKind: "pdf" },
  { id: "html", label: "HTML", icon: Code, docKind: "html" },
  { id: "tools", label: "도구", icon: Wrench, docKind: "writer" },
];

type LibreOfficeHubProps = {
  bookId: string;
  bookTitle: string;
  chapterTitle?: string;
  initialHtml: string;
  pageSpec: PageSpec;
  zoom: number;
  activePage: number;
  wordRef: React.RefObject<WordEditorPanelHandle | null>;
  htmlRef: React.RefObject<HtmlEditorPanelHandle | null>;
  onWordChange: () => void;
  onHtmlChange: () => void;
  onPageCountChange: (n: number) => void;
  onConvertedToWord: () => void;
  onApplyOcrText: (text: string) => void;
  initialPanel?: LibreOfficePanelId;
};

export function LibreOfficeHub({
  bookId,
  bookTitle,
  chapterTitle,
  initialHtml,
  pageSpec,
  zoom,
  activePage,
  wordRef,
  htmlRef,
  onWordChange,
  onHtmlChange,
  onPageCountChange,
  onConvertedToWord,
  onApplyOcrText,
  initialPanel = "writer",
}: LibreOfficeHubProps) {
  const [panel, setPanel] = useState<LibreOfficePanelId>(initialPanel);

  useEffect(() => {
    setPanel(initialPanel);
  }, [initialPanel]);

  const binding = resolveBindingByPanel(panelToLobookPanel(panel));
  const moduleMeta = LIBREOFFICE_ENGINE_BINDINGS.find(
    (b) => b.lobookPanel === panelToLobookPanel(panel),
  );

  const renderPanel = useCallback(() => {
    switch (panel) {
      case "writer":
        return (
          <WordEditorPanel
            ref={wordRef}
            bookId={bookId}
            initialHtml={initialHtml}
            pageSpec={pageSpec}
            chapterTitle={chapterTitle}
            onChange={onWordChange}
            embedded
          />
        );
      case "hwp":
        return (
          <HwpEditorPanel
            bookId={bookId}
            pageSpec={pageSpec}
            zoom={zoom}
            activePage={activePage}
            onPageCountChange={onPageCountChange}
            onConvertedToWord={onConvertedToWord}
          />
        );
      case "pdf":
        return (
          <PdfEditorPanel
            bookId={bookId}
            pageSpec={pageSpec}
            activePage={activePage}
            onPageCountChange={onPageCountChange}
          />
        );
      case "html":
        return (
          <HtmlEditorPanel
            ref={htmlRef}
            initialHtml={initialHtml}
            pageSpec={pageSpec}
            zoom={zoom}
            onChange={onHtmlChange}
          />
        );
      case "tools":
        return (
          <LoOfficeHub
            bookId={bookId}
            bookTitle={bookTitle}
            onApplyOcrText={onApplyOcrText}
          />
        );
      default:
        return null;
    }
  }, [
    panel,
    bookId,
    bookTitle,
    chapterTitle,
    initialHtml,
    pageSpec,
    zoom,
    activePage,
    wordRef,
    htmlRef,
    onWordChange,
    onHtmlChange,
    onPageCountChange,
    onConvertedToWord,
    onApplyOcrText,
  ]);

  return (
    <div className="lo-hub flex h-full min-h-0 flex-col">
      <div className="lo-hub-toolbar">
        {PANEL_TABS.map((t) => {
          const Icon = t.icon;
          const b = LIBREOFFICE_ENGINE_BINDINGS.find((x) => x.docKind === t.docKind && x.lobookPanel !== "office");
          const status = t.id === "tools" ? "integrated" : b?.status ?? "integrated";
          return (
            <button
              key={t.id}
              type="button"
              className={`lo-hub-tab ${panel === t.id ? "lo-hub-tab--active" : ""}`}
              onClick={() => setPanel(t.id)}
              title={moduleMeta?.description}
            >
              <Icon className="mr-1 inline size-3.5" />
              {t.label}
              {status === "planned" && (
                <span className="ml-1 text-[9px] text-amber-600">예정</span>
              )}
            </button>
          );
        })}
        {binding && (
          <span className="ml-auto text-[10px] text-gray-500">
            Loffice/{binding.moduleId} → {binding.lobookEngine}
          </span>
        )}
      </div>
      <div className="lo-hub-body">{renderPanel()}</div>
    </div>
  );
}
