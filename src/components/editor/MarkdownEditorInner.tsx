"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { uploadEditorImage } from "@/lib/uploadEditorImage";

export type MarkdownEditorHandle = {
  getMarkdown: () => string;
  getHTML: () => string;
  setMarkdown: (value: string) => void;
};

type MarkdownEditorProps = {
  bookId: string;
  initialValue?: string;
  height?: string;
  onChange?: () => void;
  onUploadError?: (message: string) => void;
};

const MarkdownEditorInner = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditorInner(
    { bookId, initialValue = "", height = "560px", onChange, onUploadError },
    ref,
  ) {
    const editorRef = useRef<Editor>(null);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getInstance().getMarkdown() ?? "",
      getHTML: () => editorRef.current?.getInstance().getHTML() ?? "",
      setMarkdown: (value: string) => editorRef.current?.getInstance().setMarkdown(value),
    }));

    const hooks = useMemo(
      () => ({
        addImageBlobHook: (blob: Blob | File, callback: (url: string, altText?: string) => void) => {
          void uploadEditorImage(blob, bookId)
            .then((url) => callback(url, blob instanceof File ? blob.name : "image"))
            .catch((error: unknown) => {
              onUploadError?.(
                error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
              );
            });
        },
      }),
      [bookId, onUploadError],
    );

    return (
      <Editor
        ref={editorRef}
        initialValue={initialValue}
        previewStyle="vertical"
        height={height}
        initialEditType="markdown"
        useCommandShortcut
        usageStatistics={false}
        hideModeSwitch={false}
        hooks={hooks}
        onChange={onChange}
      />
    );
  },
);

export default MarkdownEditorInner;
