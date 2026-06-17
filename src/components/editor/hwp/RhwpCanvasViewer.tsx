"use client";

import { useEffect, useRef, useState } from "react";
import type { HwpDocument } from "@rhwp/core";
import { Loader2 } from "lucide-react";
import { initRhwp, type RhwpPageInfo } from "@/lib/rhwp/setup";
import type { PageSpec } from "@/lib/editor/types";
import { contentAreaPx } from "@/lib/editor/pageSpec";
import { RhwpPageCanvas } from "./RhwpPageCanvas";

type RhwpCanvasViewerProps = {
  buffer: ArrayBuffer;
  fileName: string;
  pageSpec: PageSpec;
  zoom: number;
  activePage: number;
  singlePage?: boolean;
  onPageCountChange?: (count: number) => void;
  onError?: (message: string) => void;
};

function fitScale(pageWidth: number, containerWidth: number): number {
  if (pageWidth <= 0 || containerWidth <= 0) return 1;
  return Math.min(2, Math.max(0.25, containerWidth / pageWidth));
}

export function RhwpCanvasViewer({
  buffer,
  fileName,
  pageSpec,
  zoom,
  activePage,
  singlePage = true,
  onPageCountChange,
  onError,
}: RhwpCanvasViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HwpDocument | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<RhwpPageInfo[]>([]);
  const [scale, setScale] = useState(1);

  const contentArea = contentAreaPx(pageSpec, zoom);
  const pageCount = pages.length;

  useEffect(() => {
    let cancelled = false;
    let doc: HwpDocument | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        const rhwp = await initRhwp();
        doc = new rhwp.HwpDocument(new Uint8Array(buffer));
        docRef.current = doc;

        const count = doc.pageCount();
        const infos: RhwpPageInfo[] = [];
        for (let i = 0; i < count; i++) {
          infos.push(JSON.parse(doc.getPageInfo(i)) as RhwpPageInfo);
        }

        if (cancelled) {
          doc.free();
          return;
        }

        const fitted =
          infos.length > 0 ? fitScale(infos[0].width, contentArea.width) : 1;
        setPages(infos);
        setScale(fitted);
        onPageCountChange?.(infos.length);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "HWP 렌더링 실패";
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      doc?.free();
      docRef.current = null;
    };
  }, [buffer, contentArea.width, onError, onPageCountChange]);

  useEffect(() => {
    if (!singlePage || !scrollRef.current || pageCount === 0) return;
    const el = scrollRef.current.querySelector(`[data-page="${activePage}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activePage, singlePage, pageCount]);

  useEffect(() => {
    if (pages.length === 0) return;
    const fitted = fitScale(pages[0].width, contentArea.width);
    setScale(fitted);
  }, [contentArea.width, pages, zoom, pageSpec]);

  const doc = docRef.current;

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#e8e8e8]">
        <Loader2 className="size-6 animate-spin text-[#2b579a]" />
        <p className="text-xs text-gray-600">HWP Canvas 렌더링 중…</p>
      </div>
    );
  }

  if (error || !doc || pages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center bg-[#e8e8e8]">
        <p className="text-sm font-medium text-red-600">HWP 뷰어 오류</p>
        <p className="text-xs text-gray-500">{error ?? "페이지 없음"}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <p className="shrink-0 border-b border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
        {fileName} · {singlePage ? `${activePage}/${pageCount}` : `${pageCount}페이지`} ·{" "}
        {pageSpec.preset_id.toUpperCase()} · scale {Math.round(scale * 100)}%
      </p>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#c8c8c8] px-2 py-4">
        <div className="mx-auto" style={{ width: "fit-content" }}>
          {pages.map((info, i) => (
            <RhwpPageCanvas
              key={i}
              doc={doc}
              pageIndex={i}
              scale={scale}
              width={info.width}
              height={info.height}
              priority={i === 0}
              visible={!singlePage || activePage === i + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
