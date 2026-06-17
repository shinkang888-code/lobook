"use client";

import type { PageSlice } from "@/lib/editor/types";

type PageThumbnailStripProps = {
  pages: PageSlice[];
  activePage: number;
  onPageSelect: (page: number) => void;
};

export function PageThumbnailStrip({ pages, activePage, onPageSelect }: PageThumbnailStripProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">썸네일</div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => onPageSelect(page.pageNumber)}
            className={`w-full rounded border p-1 transition-colors ${
              activePage === page.pageNumber
                ? "border-[#2b579a] bg-[#2b579a]/10"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="aspect-[176/250] w-full rounded bg-white shadow-sm">
              <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                p.{page.pageNumber}
              </div>
            </div>
            {page.title && (
              <p className="mt-1 truncate text-[10px] text-gray-600">{page.title}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
