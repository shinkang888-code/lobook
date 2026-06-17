"use client";

import { useEffect, useRef, useState } from "react";
import type { HwpDocument } from "@rhwp/core";

type RhwpPageCanvasProps = {
  doc: HwpDocument;
  pageIndex: number;
  scale: number;
  width: number;
  height: number;
  priority?: boolean;
  visible?: boolean;
};

export function RhwpPageCanvas({
  doc,
  pageIndex,
  scale,
  width,
  height,
  priority,
  visible = true,
}: RhwpPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;

    let cancelled = false;

    function render() {
      const c = canvasRef.current;
      if (cancelled || !c) return;
      try {
        doc.renderPageToCanvas(pageIndex, c, scale);
        setRendered(true);
      } catch (e) {
        console.error(`[RhwpPageCanvas] page ${pageIndex}`, e);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        if (entries.some((e) => e.isIntersecting) || priority) render();
      },
      { rootMargin: "200px" },
    );
    observer.observe(canvas);
    if (priority) render();

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [doc, pageIndex, scale, priority, visible]);

  useEffect(() => {
    if (!visible) return;
    setRendered(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView || priority) {
      try {
        doc.renderPageToCanvas(pageIndex, canvas, scale);
        setRendered(true);
      } catch {
        /* retry on scroll */
      }
    }
  }, [doc, pageIndex, scale, priority, visible]);

  const displayW = Math.max(1, Math.floor(width * scale));
  const displayH = Math.max(1, Math.floor(height * scale));

  return (
    <div
      data-page={pageIndex + 1}
      className="mx-auto mb-4 bg-white shadow-md"
      style={{ width: displayW, minHeight: displayH, display: visible ? undefined : "none" }}
    >
      <canvas
        ref={canvasRef}
        width={displayW}
        height={displayH}
        className="block"
        style={{ width: displayW, height: displayH, opacity: rendered ? 1 : 0.3 }}
      />
    </div>
  );
}
