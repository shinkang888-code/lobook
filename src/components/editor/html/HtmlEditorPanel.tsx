"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";

export type HtmlEditorPanelHandle = {
  getHtml: () => string;
  setHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  onChange?: () => void;
};

export const HtmlEditorPanel = forwardRef<HtmlEditorPanelHandle, Props>(function HtmlEditorPanel(
  { initialHtml, onChange },
  ref,
) {
  const [value, setValue] = useState(initialHtml);

  useEffect(() => {
    setValue(initialHtml);
  }, [initialHtml]);

  useImperativeHandle(ref, () => ({
    getHtml: () => value,
    setHtml: (v: string) => setValue(v),
  }));

  return (
    <div className="grid h-full min-h-[400px] grid-cols-2 gap-0">
      <CodeMirror
        value={value}
        height="100%"
        theme={oneDark}
        extensions={[html()]}
        onChange={(v) => {
          setValue(v);
          onChange?.();
        }}
        className="h-full overflow-auto border-r border-gray-200 text-xs"
      />
      <div
        className="book-content h-full overflow-auto bg-white p-4"
        dangerouslySetInnerHTML={{ __html: value || "<p class='text-gray-400'>미리보기</p>" }}
      />
    </div>
  );
});
