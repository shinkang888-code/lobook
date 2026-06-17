"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  FileSearch,
  Loader2,
  Monitor,
  RefreshCw,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  detectClientPlatform,
  filterPackagesForPlatform,
  type HancomPackage,
} from "@/lib/hancom/hancomToolkitConstants";

type HancomAnalysis = {
  format: "hwp" | "hwpx" | "unknown";
  fileName: string;
  sizeBytes: number;
  sha256: string;
  sectionCount?: number;
  imageCount?: number;
  charCount?: number;
  pageCount?: number;
  keywords?: { word: string; count: number }[];
  plainTextPreview?: string;
};

type HancomToolkitHubProps = {
  bookId: string;
  fileName: string | null;
  onConvertHtml?: () => void;
};

const CATEGORY_ICON = {
  viewer: Monitor,
  security: Shield,
  builtin: Sparkles,
  pipeline: Wrench,
} as const;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function PackageCard({ pkg }: { pkg: HancomPackage }) {
  const Icon = CATEGORY_ICON[pkg.category] ?? Monitor;
  const href = pkg.url.startsWith("http") ? pkg.url : undefined;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#2b579a]/40 hover:shadow-md">
      <div className="flex items-start gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#2b579a]/10 text-[#2b579a]">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line text-xs font-semibold text-slate-800">{pkg.name.ko}</p>
          <p className="text-[10px] text-slate-400">v{pkg.version}</p>
        </div>
      </div>
      {pkg.installMessage && (
        <p className="text-[10px] leading-snug text-amber-700">{pkg.installMessage.ko}</p>
      )}
      {pkg.sha256 && (
        <p className="truncate font-mono text-[9px] text-slate-400" title={pkg.sha256}>
          SHA256 {pkg.sha256.slice(0, 16)}…
        </p>
      )}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center justify-center gap-1 rounded-md bg-[#2b579a] px-2 text-[10px] font-medium text-white hover:bg-[#1e3f6f]"
        >
          <ExternalLink className="size-3" />
          {pkg.platform.includes("linux") ? "다운로드" : "한컴 사이트"}
        </a>
      ) : (
        <span className="inline-flex h-7 items-center justify-center rounded-md bg-slate-100 px-2 text-[10px] text-slate-500">
          Book Studio 내장
        </span>
      )}
    </div>
  );
}

export function HancomToolkitHub({ bookId, fileName, onConvertHtml }: HancomToolkitHubProps) {
  const [packages, setPackages] = useState<HancomPackage[]>([]);
  const [analysis, setAnalysis] = useState<HancomAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [catalogSource, setCatalogSource] = useState<string>("");

  const platform = detectClientPlatform();
  const visiblePackages = filterPackagesForPlatform(packages, platform);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, analyzeRes] = await Promise.all([
        fetch("/api/hancom/toolkit"),
        fileName
          ? fetch(`/api/books/${bookId}/hancom/analyze`, { method: "POST" })
          : Promise.resolve(null),
      ]);

      const catalog = (await catalogRes.json()) as {
        packages: HancomPackage[];
        source: string;
      };
      setPackages(catalog.packages);
      setCatalogSource(catalog.source);

      if (analyzeRes) {
        if (!analyzeRes.ok) {
          const err = await analyzeRes.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "분석 실패");
        }
        setAnalysis((await analyzeRes.json()) as HancomAnalysis);
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "한컴 툴킷 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [bookId, fileName]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDownloadOriginal = async () => {
    try {
      const res = await fetch(`/api/books/${bookId}/import/hwp/file`);
      if (!res.ok) throw new Error("파일 다운로드 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ?? "document.hwp";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("원본 파일을 다운로드했습니다. 한컴오피스에서 열 수 있습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "다운로드 실패");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">한컴 툴킷</h3>
          <p className="text-[10px] text-slate-500">
            hancom-toolkit 패턴 · 뷰어·추출·전자책 파이프라인 ({catalogSource || "…"})
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          <span className="ml-1">새로고침</span>
        </Button>
      </div>

      {analysis ? (
        <div className="rounded-xl border border-[#2b579a]/20 bg-gradient-to-br from-[#2b579a]/5 to-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileSearch className="size-4 text-[#2b579a]" />
            <span className="text-xs font-semibold text-slate-800">문서 분석</span>
            <span className="rounded-full bg-[#2b579a] px-2 py-0.5 text-[9px] font-medium uppercase text-white">
              {analysis.format}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 sm:grid-cols-4">
            <div>
              <span className="text-slate-400">파일</span>
              <p className="truncate font-medium">{analysis.fileName}</p>
            </div>
            <div>
              <span className="text-slate-400">크기</span>
              <p className="font-medium">{formatBytes(analysis.sizeBytes)}</p>
            </div>
            {analysis.format === "hwpx" && (
              <>
                <div>
                  <span className="text-slate-400">섹션</span>
                  <p className="font-medium">{analysis.sectionCount ?? 0}</p>
                </div>
                <div>
                  <span className="text-slate-400">본문</span>
                  <p className="font-medium">{(analysis.charCount ?? 0).toLocaleString()}자</p>
                </div>
              </>
            )}
            {analysis.format === "hwp" && analysis.pageCount != null && (
              <div>
                <span className="text-slate-400">페이지</span>
                <p className="font-medium">{analysis.pageCount}</p>
              </div>
            )}
          </div>
          <p className="mt-2 truncate font-mono text-[9px] text-slate-400" title={analysis.sha256}>
            SHA256 {analysis.sha256}
          </p>
          {analysis.plainTextPreview && (
            <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-600">
              {analysis.plainTextPreview}
            </p>
          )}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {analysis.keywords.slice(0, 6).map((kw) => (
                <span
                  key={kw.word}
                  className="rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-500 shadow-sm"
                >
                  {kw.word}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
          HWP/HWPX 파일을 열면 SHA256·섹션·키워드 분석이 표시됩니다.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {fileName && (
          <Button type="button" size="sm" variant="outline" onClick={() => void handleDownloadOriginal()}>
            <Download className="mr-1 size-3.5" />
            원본 다운로드
          </Button>
        )}
        {onConvertHtml && (
          <Button
            type="button"
            size="sm"
            className="bg-[#2b579a] hover:bg-[#1e3f6f]"
            onClick={onConvertHtml}
          >
            HTML로 변환 (Word 탭)
          </Button>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-700">
          추천 도구 · {platform === "win32" ? "Windows" : platform === "darwin" ? "macOS" : platform === "linux" ? "Linux" : "Web"}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePackages.map((pkg) => (
            <PackageCard key={pkg.package} pkg={pkg} />
          ))}
        </div>
      </div>
    </div>
  );
}
