"use client";

import { ChevronDown, ChevronRight, FileText, Plus } from "lucide-react";
import { useState } from "react";
import type { TocNode } from "@/lib/editor/types";

type TocNavigatorProps = {
  nodes: TocNode[];
  activePage: number;
  onPageSelect: (page: number) => void;
  onHeadingClick?: (id: string) => void;
};

export function TocNavigator({ nodes, activePage, onPageSelect, onHeadingClick }: TocNavigatorProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-xs font-semibold text-gray-700">목차</span>
        <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100" title="페이지 추가">
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {nodes.length === 0 ? (
          <p className="px-2 py-4 text-center text-gray-400">
            Markdown 제목(#)을 추가하면
            <br />
            목차가 자동 생성됩니다.
          </p>
        ) : (
          nodes.map((node) => (
            <TocItem
              key={node.id}
              node={node}
              activePage={activePage}
              onPageSelect={onPageSelect}
              onHeadingClick={onHeadingClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TocItem({
  node,
  activePage,
  onPageSelect,
  onHeadingClick,
  depth = 0,
}: {
  node: TocNode;
  activePage: number;
  onPageSelect: (page: number) => void;
  onHeadingClick?: (id: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onPageSelect(node.pageIndex + 1);
          onHeadingClick?.(node.id);
        }}
        className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left hover:bg-[#2b579a]/10 ${
          activePage === node.pageIndex + 1 ? "bg-[#2b579a]/15 text-[#2b579a]" : "text-gray-700"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren ? (
          <span
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="shrink-0"
          >
            {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </span>
        ) : (
          <FileText className="size-3 shrink-0 opacity-50" />
        )}
        <span className="truncate">{node.title}</span>
      </button>
      {open &&
        node.children.map((child) => (
          <TocItem
            key={child.id}
            node={child}
            activePage={activePage}
            onPageSelect={onPageSelect}
            onHeadingClick={onHeadingClick}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
