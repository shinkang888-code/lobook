"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useEditorToolbarOptional } from "@/components/editor/shell/EditorToolbarContext";

export type WordEditorPanelHandle = {
  getHtml: () => string;
  setHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  onChange?: () => void;
};

export const WordEditorPanel = forwardRef<WordEditorPanelHandle, Props>(function WordEditorPanel(
  { initialHtml, onChange },
  ref,
) {
  const toolbar = useEditorToolbarOptional();

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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Word 스타일 편집…" }),
    ],
    content: initialHtml || "<p></p>",
    onUpdate: () => onChange?.(),
    editorProps: {
      attributes: {
        class: "polaris-doc-body prose prose-gray max-w-none min-h-[60vh] focus:outline-none",
      },
    },
  });

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
    if (!editor || !toolbar) return;

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
  }, [editor, toolbar]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Word 편집기 로딩…
      </div>
    );
  }

  return (
    <div className="polaris-doc-editor h-full overflow-auto">
      <EditorContent editor={editor} />
    </div>
  );
});
