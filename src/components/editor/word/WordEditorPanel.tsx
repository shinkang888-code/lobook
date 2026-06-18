"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEditorToolbarOptional } from "@/components/editor/shell/EditorToolbarContext";
import type { PageSpec } from "@/lib/editor/types";
import { mmToPx } from "@/lib/editor/pageSpec";
import { buildTocHtml, extractHeadings } from "@/lib/word/wordDocumentUtils";
import { EigenpalDocxEditor, type EigenpalDocxEditorHandle } from "./EigenpalDocxEditor";
import { WordM365Ribbon } from "./WordM365Ribbon";
import { WordM365SidePanel } from "./WordM365SidePanel";
import "@eigenpal/docx-editor-react/styles.css";
import "./word-m365.css";

export type WordEditorPanelHandle = {
  getHtml: () => string;
  setHtml: (html: string) => void;
};

type Props = {
  bookId: string;
  initialHtml: string;
  pageSpec: PageSpec;
  chapterTitle?: string;
  onChange?: () => void;
  /** BookEditorShell 내장 시 내부 사이드바 숨김 */
  embedded?: boolean;
};

type WordSubMode = "html" | "docx";

const WORD_TOOLBAR_KEYS = [
  "bold",
  "italic",
  "underline",
  "alignLeft",
  "alignCenter",
  "alignRight",
  "undo",
  "redo",
  "copy",
  "cut",
  "paste",
] as const;

export const WordEditorPanel = forwardRef<WordEditorPanelHandle, Props>(function WordEditorPanel(
  { bookId, initialHtml, pageSpec, chapterTitle, onChange, embedded = false },
  ref,
) {
  const toolbar = useEditorToolbarOptional();
  const eigenpalRef = useRef<EigenpalDocxEditorHandle>(null);
  const [subMode, setSubMode] = useState<WordSubMode>("html");
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [docxFileName, setDocxFileName] = useState<string | null>(null);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [copilotBusy, setCopilotBusy] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Word 스타일 편집…" }),
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialHtml || "<p></p>",
    onUpdate: () => onChange?.(),
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  const insertToc = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const toc = buildTocHtml(extractHeadings(html));
    editor.chain().focus().insertContent(toc).run();
    onChange?.();
    toast.success("목차 블록을 삽입했습니다.");
  }, [editor, onChange]);

  const runCopilot = useCallback(
    async (prompt: string) => {
      if (!editor) return;
      setCopilotBusy(true);
      try {
        const html = editor.getHTML();
        const res = await fetch(`/api/books/${bookId}/cowork/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `${prompt}\n\n---\n현재 원고:\n${html.slice(0, 8000)}`,
            history: [],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "Copilot 실패");
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림 없음");
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
        if (text.trim()) {
          editor.chain().focus().insertContent(`<p>${text.replace(/\n/g, "</p><p>")}</p>`).run();
          onChange?.();
          toast.success("Copilot 결과를 문서에 삽입했습니다.");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Copilot 오류");
      } finally {
        setCopilotBusy(false);
      }
    },
    [bookId, editor, onChange],
  );

  const handleCopilotAction = useCallback(
    (prompt: string) => {
      if (prompt === "__insert_toc__") {
        insertToc();
        return;
      }
      void runCopilot(prompt);
    },
    [insertToc, runCopilot],
  );

  const loadDocx = useCallback(async () => {
    setLoadingDocx(true);
    try {
      const metaRes = await fetch(`/api/books/${bookId}/import/docx/latest`);
      if (metaRes.status === 404) return;
      if (!metaRes.ok) return;
      const meta = (await metaRes.json()) as { fileName?: string };
      const fileRes = await fetch(`/api/books/${bookId}/import/docx/file`);
      if (!fileRes.ok) return;
      const buf = await fileRes.arrayBuffer();
      setDocxBuffer(buf);
      setDocxFileName(meta.fileName ?? "document.docx");
    } finally {
      setLoadingDocx(false);
    }
  }, [bookId]);

  useEffect(() => {
    void loadDocx();
  }, [loadDocx]);

  useEffect(() => {
    if (editor && initialHtml) {
      editor.commands.setContent(initialHtml);
    }
  }, [editor, initialHtml]);

  useImperativeHandle(ref, () => ({
    getHtml: () => editor?.getHTML() ?? "",
    setHtml: (html: string) => editor?.commands.setContent(html),
  }));

  useEffect(() => {
    if (!editor || !toolbar || subMode !== "html") return;

    toolbar.register({
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      underline: () => editor.chain().focus().toggleUnderline().run(),
      alignLeft: () => editor.chain().focus().setTextAlign("left").run(),
      alignCenter: () => editor.chain().focus().setTextAlign("center").run(),
      alignRight: () => editor.chain().focus().setTextAlign("right").run(),
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      copy: () => document.execCommand("copy"),
      cut: () => document.execCommand("cut"),
      paste: async () => {
        try {
          const text = await navigator.clipboard.readText();
          editor.chain().focus().insertContent(text).run();
        } catch {
          document.execCommand("paste");
        }
      },
    });

    return () => toolbar.unregister([...WORD_TOOLBAR_KEYS]);
  }, [editor, toolbar, subMode]);

  if (!editor && subMode === "html") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Word 편집기 로딩…
      </div>
    );
  }

  const htmlContent = editor?.getHTML() ?? "";

  const pageWmm = pageSpec.orientation === "portrait" ? pageSpec.width_mm : pageSpec.height_mm;
  const pageHmm = pageSpec.orientation === "portrait" ? pageSpec.height_mm : pageSpec.width_mm;
  const paperStyle = embedded
    ? ({
        "--paper-width": `${mmToPx(pageWmm, 1)}px`,
        "--paper-min-height": `${mmToPx(pageHmm, 1)}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div className="word-m365-workspace h-full min-h-0">
      <WordM365Ribbon
        editor={subMode === "html" ? editor : null}
        pageSpec={pageSpec}
        reviewMode={reviewMode}
        onToggleReview={() => setReviewMode((v) => !v)}
        onCopilotAction={handleCopilotAction}
        disabled={subMode === "docx" || copilotBusy}
      />

      <div className="word-m365-mode-bar">
        <button
          type="button"
          onClick={() => setSubMode("html")}
          className={`word-m365-mode-btn ${subMode === "html" ? "word-m365-mode-btn--active" : ""}`}
        >
          HTML (TipTap)
        </button>
        <button
          type="button"
          onClick={() => setSubMode("docx")}
          disabled={!docxBuffer && !loadingDocx}
          className={`word-m365-mode-btn ${subMode === "docx" ? "word-m365-mode-btn--active" : ""} disabled:opacity-40`}
        >
          DOCX (eigenpal) {docxFileName ? `· ${docxFileName}` : ""}
        </button>
        {loadingDocx && <Loader2 className="size-3 animate-spin text-gray-400" />}
        {chapterTitle && <span className="ml-auto text-[10px] text-slate-500">{chapterTitle}</span>}
      </div>

      <div className={`word-m365-body ${embedded ? "word-m365-body--embedded" : ""}`}>
        <div className="word-m365-canvas">
          {subMode === "html" && editor && (
            <div
              className={`word-m365-page ${embedded ? "word-m365-page--centered" : ""}`}
              style={paperStyle}
            >
              <div
                className={`word-m365-paper ${embedded ? "word-m365-paper--centered" : ""} ${reviewMode ? "word-m365-paper--review" : ""}`}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          )}
          {subMode === "docx" && docxBuffer && docxFileName && (
            <div className="min-h-0 flex-1">
              <EigenpalDocxEditor
                ref={eigenpalRef}
                documentBuffer={docxBuffer}
                fileName={docxFileName}
              />
            </div>
          )}
          {subMode === "docx" && !docxBuffer && !loadingDocx && (
            <div className="flex h-full items-center justify-center text-xs text-gray-500">
              DOCX 파일을 가져오면 eigenpal 네이티브 편집기를 사용할 수 있습니다.
            </div>
          )}
        </div>

        {subMode === "html" && !embedded && (
          <WordM365SidePanel bookId={bookId} html={htmlContent} onInsertToc={insertToc} />
        )}
      </div>
    </div>
  );
});
