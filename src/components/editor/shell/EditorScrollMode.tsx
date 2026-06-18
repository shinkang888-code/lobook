"use client";

import { useEffect } from "react";
import "./editor-page.css";

/** 편집기 페이지에서 사이트 헤더를 숨기고 브라우저 프레임 스크롤을 허용 */
export function EditorScrollMode() {
  useEffect(() => {
    document.documentElement.classList.add("editor-scroll-mode");
    return () => {
      document.documentElement.classList.remove("editor-scroll-mode");
    };
  }, []);

  return null;
}
