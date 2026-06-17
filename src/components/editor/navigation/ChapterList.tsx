"use client";

import { Plus } from "lucide-react";
import type { Chapter } from "@/lib/types";

type ChapterListProps = {
  chapters: Chapter[];
  activeChapterId: string;
  onSelect: (chapterId: string) => void;
  onAdd?: () => void;
  adding?: boolean;
};

export function ChapterList({
  chapters,
  activeChapterId,
  onSelect,
  onAdd,
  adding,
}: ChapterListProps) {
  return (
    <div className="border-b border-gray-200 px-2 py-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">챕터</span>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
            title="챕터 추가"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {chapters.map((ch, i) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => onSelect(ch.id)}
            className={`w-full truncate rounded px-2 py-1.5 text-left text-xs ${
              activeChapterId === ch.id
                ? "bg-[#2b579a]/15 font-medium text-[#2b579a]"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {i + 1}. {ch.title}
          </button>
        ))}
      </div>
    </div>
  );
}
