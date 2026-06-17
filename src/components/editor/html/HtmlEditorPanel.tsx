"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { defaultKeymap, undo, redo } from "@codemirror/commands";
import { lineNumbers } from "@codemirror/view";
import type { PageSpec } from "@/lib/editor/types";
import { pageSpecToCss } from "@/lib/editor/pageSpec";
import { useEditorToolbarOptional } from "@/components/editor/shell/EditorToolbarContext";

export type HtmlEditorPanelHandle = {
  getHtml: () => string;
  setHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  pageSpec: PageSpec;
  zoom?: number;
  onChange?: () => void;
};

const HTML_TOOLBAR_KEYS = ["undo", "redo", "copy", "cut", "paste"] as const;

export const HtmlEditorPanel = forwardRef<HtmlEditorPanelHandle, Props>(function HtmlEditorPanel(
  { initialHtml, pageSpec, zoom = 1, onChange },
  ref,
) {
  const [value, setValue] = useState(initialHtml);
  const viewRef = useRef<EditorView | null>(null);
  const toolbar = useEditorToolbarOptional();

  useEffect(() => {
    setValue(initialHtml);
  }, [initialHtml]);

  useImperativeHandle(ref, () => ({
    getHtml: () => value,
    setHtml: (v: string) => setValue(v),
  }));

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !toolbar) return;

    toolbar.register({
      undo: () => undo(view),
      redo: () => redo(view),
      copy: () => document.execCommand("copy"),
      cut: () => document.execCommand("cut"),
      paste: async () => {
        try {
          const text = await navigator.clipboard.readText();
          view.dispatch(view.state.replaceSelection(text));
        } catch {
          document.execCommand("paste");
        }
      },
    });

    return () => toolbar.unregister([...HTML_TOOLBAR_KEYS]);
  }, [toolbar, value]);

  const previewStyle = pageSpecToCss(pageSpec, zoom);
  const { width: _w, height: _h, padding, boxShadow, ...typography } = previewStyle;

  const insertSnippet = (snippet: string) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(view.state.replaceSelection(snippet));
    onChange?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
        {[
          { label: "p", snippet: "<p></p>" },
          { label: "h1", snippet: "<h1></h1>" },
          { label: "h2", snippet: "<h2></h2>" },
          { label: "img", snippet: '<img src="" alt="" />' },
          { label: "table", snippet: "<table><tr><td></td></tr></table>" },
          { label: "hr", snippet: "<hr />" },
        ].map(({ label, snippet }) => (
          <button
            key={label}
            type="button"
            className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
            onClick={() => insertSnippet(snippet)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-0">
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[
            html(),
            lineNumbers(),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) onChange?.();
            }),
          ]}
          onCreateEditor={(view) => {
            viewRef.current = view;
          }}
          onChange={(v) => setValue(v)}
          className="h-full overflow-auto border-r border-gray-200 text-xs"
        />
        <div
          className="book-content h-full overflow-auto bg-white"
          style={{ ...typography, padding }}
          dangerouslySetInnerHTML={{ __html: value || "<p class='text-gray-400'>미리보기</p>" }}
        />
      </div>
    </div>
  );
});
