"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { DocxEditorRef } from "@eigenpal/docx-editor-react";

const DocxEditor = dynamic(
  () => import("@eigenpal/docx-editor-react").then((m) => m.DocxEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Loader2 className="size-8 animate-spin text-[#2b579a]" />
        <p className="text-sm text-gray-500">Word(DOCX) 에디터 로딩…</p>
      </div>
    ),
  },
);

export type EigenpalDocxEditorHandle = {
  save: () => Promise<ArrayBuffer | null>;
};

type Props = {
  documentBuffer: ArrayBuffer;
  fileName: string;
  readOnly?: boolean;
};

export const EigenpalDocxEditor = forwardRef<EigenpalDocxEditorHandle, Props>(
  function EigenpalDocxEditor({ documentBuffer, fileName, readOnly = false }, ref) {
    const editorRef = useRef<DocxEditorRef>(null);

    useImperativeHandle(ref, () => ({
      save: async () => editorRef.current?.save() ?? null,
    }));

    return (
      <div className="eigenpal-editor h-full min-h-0">
        <DocxEditor
          ref={editorRef}
          documentBuffer={documentBuffer}
          documentName={fileName}
          mode={readOnly ? "viewing" : "editing"}
          showToolbar={!readOnly}
          showRuler
          showZoomControl
          initialZoom={1}
          className="h-full"
          style={{ height: "100%" }}
        />
      </div>
    );
  },
);
