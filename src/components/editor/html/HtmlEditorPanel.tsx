"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

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
  const [html, setHtml] = useState(initialHtml);

  useEffect(() => {
    setHtml(initialHtml);
  }, [initialHtml]);

  useImperativeHandle(ref, () => ({
    getHtml: () => html,
    setHtml: (v: string) => setHtml(v),
  }));

  return (
    <div className="grid h-full min-h-[400px] grid-cols-2 gap-0">
      <textarea
        value={html}
        onChange={(e) => {
          setHtml(e.target.value);
          onChange?.();
        }}
        className="h-full w-full resize-none border-r border-gray-200 bg-[#1e1e1e] p-3 font-mono text-xs leading-relaxed text-gray-100 focus:outline-none"
        spellCheck={false}
        placeholder="EPUB XHTML 소스…"
      />
      <div
        className="book-content h-full overflow-auto bg-white p-4"
        dangerouslySetInnerHTML={{ __html: html || "<p class='text-gray-400'>미리보기</p>" }}
      />
    </div>
  );
});
