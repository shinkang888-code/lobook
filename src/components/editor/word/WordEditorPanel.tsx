"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Loader2 } from "lucide-react";
import { useEditorToolbarOptional } from "@/components/editor/shell/EditorToolbarContext";
import { EigenpalDocxEditor, type EigenpalDocxEditorHandle } from "./EigenpalDocxEditor";
import "@eigenpal/docx-editor-react/styles.css";

export type WordEditorPanelHandle = {
  getHtml: () => string;
  setHtml: (html: string) => void;
};

type Props = {
  bookId: string;
  initialHtml: string;
  onChange?: () => void;
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
  { bookId, initialHtml, onChange },
  ref,
) {
  const toolbar = useEditorToolbarOptional();
  const eigenpalRef = useRef<EigenpalDocxEditorHandle>(null);
  const [subMode, setSubMode] = useState<WordSubMode>("html");
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [docxFileName, setDocxFileName] = useState<string | null>(null);
  const [loadingDocx, setLoadingDocx] = useState(false);

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
        class: "polaris-doc-body prose prose-gray max-w-none min-h-[60vh] focus:outline-none",
      },
    },
  });

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <button
          type="button"
          onClick={() => setSubMode("html")}
          className={`rounded px-2 py-0.5 text-[10px] ${subMode === "html" ? "bg-[#2b579a] text-white" : "text-gray-600"}`}
        >
          HTML (TipTap)
        </button>
        <button
          type="button"
          onClick={() => setSubMode("docx")}
          disabled={!docxBuffer && !loadingDocx}
          className={`rounded px-2 py-0.5 text-[10px] ${subMode === "docx" ? "bg-[#2b579a] text-white" : "text-gray-600"} disabled:opacity-40`}
        >
          DOCX (eigenpal) {docxFileName ? `· ${docxFileName}` : ""}
        </button>
        {loadingDocx && <Loader2 className="size-3 animate-spin text-gray-400" />}
      </div>

      <div className="min-h-0 flex-1">
        {subMode === "html" && editor && (
          <div className="polaris-doc-editor h-full overflow-auto">
            <EditorContent editor={editor} />
          </div>
        )}
        {subMode === "docx" && docxBuffer && docxFileName && (
          <EigenpalDocxEditor
            ref={eigenpalRef}
            documentBuffer={docxBuffer}
            fileName={docxFileName}
          />
        )}
        {subMode === "docx" && !docxBuffer && !loadingDocx && (
          <div className="flex h-full items-center justify-center text-xs text-gray-500">
            DOCX 파일을 가져오면 eigenpal 네이티브 편집기를 사용할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
});
