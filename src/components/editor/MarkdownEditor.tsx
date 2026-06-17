"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { MarkdownEditorHandle } from "./MarkdownEditorInner";

const MarkdownEditorInner = dynamic(() => import("./MarkdownEditorInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground">
      에디터 로딩 중...
    </div>
  ),
});

type MarkdownEditorProps = {
  bookId: string;
  initialValue?: string;
  height?: string;
  onChange?: () => void;
  onUploadError?: (message: string) => void;
};

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor(props, ref) {
    return <MarkdownEditorInner ref={ref} {...props} />;
  },
);

export default MarkdownEditor;
