"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";

export type MarkdownEditorHandle = {
  getMarkdown: () => string;
  getHTML: () => string;
  setMarkdown: (value: string) => void;
};

type MarkdownEditorProps = {
  initialValue?: string;
  height?: string;
  onChange?: () => void;
};

const MarkdownEditorInner = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditorInner({ initialValue = "", height = "560px", onChange }, ref) {
    const editorRef = useRef<Editor>(null);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getInstance().getMarkdown() ?? "",
      getHTML: () => editorRef.current?.getInstance().getHTML() ?? "",
      setMarkdown: (value: string) => editorRef.current?.getInstance().setMarkdown(value),
    }));

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
        onChange={onChange}
      />
    );
  },
);

export default MarkdownEditorInner;
