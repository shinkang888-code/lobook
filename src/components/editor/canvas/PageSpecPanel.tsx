"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { PagePresetId, PageSpec } from "@/lib/editor/types";
import { PAGE_PRESETS, applyPreset } from "@/lib/editor/pageSpec";

type PageSpecPanelProps = {
  pageSpec: PageSpec;
  onChange: (spec: PageSpec) => void;
  bookTitle: string;
  author: string;
  onMetaChange: (field: "title" | "author", value: string) => void;
};

export function PageSpecPanel({
  pageSpec,
  onChange,
  bookTitle,
  author,
  onMetaChange,
}: PageSpecPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white text-xs">
      <div className="border-b border-gray-200 px-3 py-2 font-semibold text-gray-700">속성</div>

      <section className="space-y-3 border-b border-gray-100 p-3">
        <h3 className="font-medium text-gray-800">페이지 규격</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(PAGE_PRESETS) as Exclude<PagePresetId, "custom">[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(applyPreset(id, pageSpec))}
              className={`rounded border px-2 py-1.5 text-left transition-colors ${
                pageSpec.preset_id === id
                  ? "border-[#2b579a] bg-[#2b579a]/10 text-[#2b579a]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">{PAGE_PRESETS[id].label}</div>
              <div className="text-[10px] text-gray-500">
                {PAGE_PRESETS[id].width_mm}×{PAGE_PRESETS[id].height_mm}mm
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">가로 (mm)</Label>
            <Input
              type="number"
              value={pageSpec.width_mm}
              onChange={(e) =>
                onChange({ ...pageSpec, preset_id: "custom", width_mm: Number(e.target.value) })
              }
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px]">세로 (mm)</Label>
            <Input
              type="number"
              value={pageSpec.height_mm}
              onChange={(e) =>
                onChange({ ...pageSpec, preset_id: "custom", height_mm: Number(e.target.value) })
              }
              className="h-7 text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}>
              <Label className="text-[10px]">{side[0].toUpperCase()}</Label>
              <Input
                type="number"
                value={pageSpec.margins[side]}
                onChange={(e) =>
                  onChange({
                    ...pageSpec,
                    margins: { ...pageSpec.margins, [side]: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 p-3">
        <h3 className="font-medium text-gray-800">책 정보</h3>
        <div>
          <Label className="text-[10px]">제목</Label>
          <Input
            value={bookTitle}
            onChange={(e) => onMetaChange("title", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">저자</Label>
          <Input
            value={author}
            onChange={(e) => onMetaChange("author", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </section>
    </div>
  );
}
