"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type HwpEditorPanelProps = {
  onImport?: () => void;
};

export function HwpEditorPanel({ onImport }: HwpEditorPanelProps) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
        <Upload className="mx-auto mb-4 size-12 text-gray-400" />
        <h3 className="mb-2 text-sm font-semibold text-gray-700">HWP 편집기</h3>
        <p className="mb-4 max-w-sm text-xs text-gray-500">
          한글(HWP) 원고를 업로드하면 @rhwp/core WASM 뷰어로 페이지 미리보기를 제공합니다.
          <br />
          Phase 2: hwpreader + hwpx-skill 연동
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onImport}>
          HWP 파일 가져오기
        </Button>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-left text-[10px] text-gray-400">
        <div className="rounded border border-gray-200 p-2">
          <strong className="text-gray-600">원본 뷰</strong>
          <br />
          hwpreader SVG 페이지
        </div>
        <div className="rounded border border-gray-200 p-2">
          <strong className="text-gray-600">변환 편집</strong>
          <br />
          HTML 탭 연동
        </div>
      </div>
    </div>
  );
}
