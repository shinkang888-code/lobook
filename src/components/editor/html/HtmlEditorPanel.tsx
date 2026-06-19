"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { defaultKeymap, undo, redo } from "@codemirror/commands";
import { lineNumbers } from "@codemirror/view";
import { RefreshCw } from "lucide-react";
import type { PageSpec } from "@/lib/editor/types";
import { pageSpecToCss } from "@/lib/editor/pageSpec";
import { useEditorToolbarOptional } from "@/components/editor/shell/EditorToolbarContext";
import "./html-editor.css";

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

const SNIPPETS = [
  { label: "p", snippet: "<p></p>" },
  { label: "h1", snippet: "<h1></h1>" },
  { label: "h2", snippet: "<h2></h2>" },
  { label: "img", snippet: '<img src="" alt="" />' },
  { label: "table", snippet: "<table><tr><td></td></tr></table>" },
  { label: "hr", snippet: "<hr />" },
] as const;

export const HtmlEditorPanel = forwardRef<HtmlEditorPanelHandle, Props>(function HtmlEditorPanel(
  { initialHtml, pageSpec, zoom = 1, onChange },
  ref,
) {
  const [draft, setDraft] = useState(initialHtml);
  const [preview, setPreview] = useState(initialHtml);
  const viewRef = useRef<EditorView | null>(null);
  const toolbar = useEditorToolbarOptional();

  useEffect(() => {
    setDraft(initialHtml);
    setPreview(initialHtml);
  }, [initialHtml]);

  useImperativeHandle(ref, () => ({
    getHtml: () => draft,
    setHtml: (v: string) => {
      setDraft(v);
      setPreview(v);
    },
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
  }, [toolbar, draft]);

  const previewStyle = pageSpecToCss(pageSpec, zoom);
  const { width: _w, height: _h, padding, boxShadow, ...typography } = previewStyle;

  const insertSnippet = (snippet: string) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(view.state.replaceSelection(snippet));
    onChange?.();
  };

  const refreshPreview = useCallback(() => {
    setPreview(draft);
  }, [draft]);

  return (
    <div className="lo-panel html-editor">
      <div className="html-editor-toolbar">
        {SNIPPETS.map(({ label, snippet }) => (
          <button
            key={label}
            type="button"
            className="html-editor-snippet"
            onClick={() => insertSnippet(snippet)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="html-editor-refresh"
          onClick={refreshPreview}
          title="우측 미리보기 갱신"
        >
          <RefreshCw className="size-3.5" />
          미리보기 갱신
        </button>
      </div>

      <div className="html-editor-split">
        <div className="html-editor-code">
          <CodeMirror
            value={draft}
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
            onChange={setDraft}
            className="text-xs"
          />
        </div>

        <div className="html-editor-preview-wrap">
          <div className="html-editor-preview-label">미리보기</div>
          <div
            className="book-content html-editor-preview"
            style={{ ...typography, padding }}
            dangerouslySetInnerHTML={{
              __html: preview || "<p class='text-gray-400'>미리보기 갱신 버튼을 눌러 확인하세요.</p>",
            }}
          />
        </div>
      </div>
    </div>
  );
});
