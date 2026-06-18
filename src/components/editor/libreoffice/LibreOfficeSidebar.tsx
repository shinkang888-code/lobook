"use client";

import { useEffect, useState } from "react";
import type { PageSpec } from "@/lib/editor/types";
import type { LibreOfficeDocKind } from "@/lib/libreoffice/libreOfficeCatalog";
import "./libreoffice-shell.css";

type LibreOfficeSidebarProps = {
  pageSpec: PageSpec;
  docKind: LibreOfficeDocKind | "writer-source";
  moduleLabel?: string;
  engineLabel?: string;
  onPageSpecChange?: (spec: PageSpec) => void;
};

type RuntimeInfo = {
  integratedCount: number;
  collaboraEnabled: boolean;
};

export function LibreOfficeSidebar({
  pageSpec,
  docKind,
  moduleLabel,
  engineLabel,
  onPageSpecChange,
}: LibreOfficeSidebarProps) {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);

  useEffect(() => {
    void fetch("/api/libreoffice/status")
      .then((r) => r.json())
      .then((d) =>
        setRuntime({
          integratedCount: d.integratedCount ?? 0,
          collaboraEnabled: d.collaboraEnabled ?? false,
        }),
      )
      .catch(() => setRuntime(null));
  }, []);

  return (
    <div className="lo-sidebar h-full">
      <div className="lo-sidebar-header">속성 · Lofice</div>

      <div className="lo-sidebar-section">
        <div className="lo-sidebar-label">문서 종류</div>
        <div className="text-xs font-medium text-gray-800">{moduleLabel ?? docKind}</div>
        {engineLabel && (
          <div className="mt-1 text-[10px] text-gray-500">엔진: {engineLabel}</div>
        )}
      </div>

      <div className="lo-sidebar-section">
        <div className="lo-sidebar-label">페이지 규격</div>
        <div className="text-xs text-gray-700">
          {pageSpec.width_mm} × {pageSpec.height_mm} mm
        </div>
        <div className="text-[10px] text-gray-500">{pageSpec.preset_id}</div>
        {onPageSpecChange && (
          <select
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-[11px]"
            value={pageSpec.preset_id}
            onChange={(e) => {
              const presets: Record<string, Partial<PageSpec>> = {
                a4: { preset_id: "a4", width_mm: 210, height_mm: 297 },
                a5: { preset_id: "a5", width_mm: 148, height_mm: 210 },
                us_trade_6x9: { preset_id: "us_trade_6x9", width_mm: 152, height_mm: 229 },
              };
              const patch = presets[e.target.value];
              if (patch) onPageSpecChange({ ...pageSpec, ...patch });
            }}
          >
            <option value="a4">A4</option>
            <option value="a5">A5</option>
            <option value="us_trade_6x9">6×9 inch</option>
          </select>
        )}
      </div>

      <div className="lo-sidebar-section">
        <div className="lo-sidebar-label">런타임</div>
        {runtime ? (
          <div className="flex flex-col gap-1">
            <span className="lo-status-pill lo-status-pill--ok">
              {runtime.integratedCount}개 엔진 연동
            </span>
            {runtime.collaboraEnabled ? (
              <span className="lo-status-pill lo-status-pill--ok">Lofice Online</span>
            ) : (
              <span className="lo-status-pill text-[10px]">로컬 엔진 모드</span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">상태 로딩…</span>
        )}
      </div>
    </div>
  );
}
