"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import type { MarkdownEditorHandle } from "@/components/editor/MarkdownEditorInner";

export type MarkdownEditorPanelHandle = MarkdownEditorHandle;

type Props = {
  bookId: string;
  initialValue: string;
  onChange?: () => void;
  onUploadError?: (message: string) => void;
};

export const MarkdownEditorPanel = forwardRef<MarkdownEditorPanelHandle, Props>(
  function MarkdownEditorPanel({ bookId, initialValue, onChange, onUploadError }, ref) {
    const innerRef = useRef<MarkdownEditorHandle>(null);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => innerRef.current?.getMarkdown() ?? "",
      getHTML: () => innerRef.current?.getHTML() ?? "",
      setMarkdown: (v: string) => innerRef.current?.setMarkdown(v),
    }));

    return (
      <div className="h-full min-h-[400px] [&_.toastui-editor-defaultUI]:border-0 [&_.toastui-editor-defaultUI]:shadow-none">
        <MarkdownEditor
          ref={innerRef}
          bookId={bookId}
          initialValue={initialValue}
          onChange={onChange}
          onUploadError={onUploadError}
        />
      </div>
    );
  },
);
