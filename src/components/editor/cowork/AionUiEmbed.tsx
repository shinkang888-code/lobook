"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MonitorPlay,
  Power,
  ClipboardCopy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildAionUiEmbedUrl } from "@/lib/aionui/aionuiConstants";

type AionStatus = {
  installed: boolean;
  running: boolean;
  webUrl: string | null;
  localUrl: string | null;
  rendererBuilt: boolean;
  error?: string;
};

type AionUiEmbedProps = {
  bookId: string;
};

export function AionUiEmbed({ bookId }: AionUiEmbedProps) {
  const [status, setStatus] = useState<AionStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [contextPreview, setContextPreview] = useState<string>("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/aionui/status");
    const data = (await res.json()) as { aion: AionStatus };
    setStatus(data.aion);
    if (data.aion.webUrl) {
      setEmbedUrl(buildAionUiEmbedUrl(data.aion.webUrl, bookId));
    } else {
      setEmbedUrl(null);
    }
  }, [bookId]);

  useEffect(() => {
    void refresh();
    const ctx = fetch(`/api/books/${bookId}/cowork/context`)
      .then((r) => r.json())
      .then((d) => setContextPreview(d.summary ?? ""))
      .catch(() => undefined);
    void ctx;
  }, [bookId, refresh]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/aionui/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "시작 실패");
      toast.success("AionUi WebUI가 시작되었습니다.");
      await refresh();
      if (data.url) window.open(data.url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AionUi 시작 실패");
    } finally {
      setStarting(false);
    }
  };

  const copyContext = async () => {
    try {
      const res = await fetch(`/api/books/${bookId}/cowork/context`);
      const data = await res.json();
      const text = `【LoBooK】 ${data.title}\n저자: ${data.author}\n\n${data.markdown?.slice(0, 20000) ?? ""}`;
      await navigator.clipboard.writeText(text);
      toast.success("책 컨텍스트가 클립보드에 복사되었습니다. AionUi 채팅에 붙여넣으세요.");
    } catch {
      toast.error("복사 실패");
    }
  };

  if (!status) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        <Loader2 className="mr-2 size-4 animate-spin" /> AionUi 연결 확인 중…
      </div>
    );
  }

  if (!status.installed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <MonitorPlay className="size-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">AionUi 미설치</p>
        <p className="max-w-md text-xs text-slate-500">
          터미널에서 <code className="rounded bg-white px-1">npm run setup:aionui</code> 를 실행하면
          [shinkang888-code/AionUi](https://github.com/shinkang888-code/AionUi) 가 클론·설치됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">AionUi Cowork WebUI</p>
          <p className="text-xs text-slate-500">
            {status.running ? (
              <span className="text-emerald-600">● 연결됨</span>
            ) : (
              <span className="text-amber-600">○ 오프라인</span>
            )}
            {!status.rendererBuilt && " · renderer 빌드 필요"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="mr-1 size-3.5" /> 새로고침
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyContext()}>
            <ClipboardCopy className="mr-1 size-3.5" /> 컨텍스트 복사
          </Button>
          {!status.running && (
            <Button
              type="button"
              size="sm"
              className="bg-[#2b579a] hover:bg-[#1e3f6f]"
              disabled={starting || !status.rendererBuilt}
              onClick={() => void handleStart()}
            >
              {starting ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : (
                <Power className="mr-1 size-3.5" />
              )}
              Cowork 시작
            </Button>
          )}
          {embedUrl && (
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <ExternalLink className="size-3.5" /> 새 창
            </a>
          )}
        </div>
      </div>

      {contextPreview && (
        <p className="truncate rounded-lg bg-[#2b579a]/5 px-3 py-2 text-xs text-[#2b579a]">
          {contextPreview}
        </p>
      )}

      {embedUrl ? (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
          <iframe
            title="AionUi Cowork"
            src={embedUrl}
            className="h-full w-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          <p>{status.error ?? "Cowork WebUI를 시작하거나 AIONUI_WEB_URL을 설정하세요."}</p>
          <p className="text-xs">
            로컬: <code>npm run start:aionui</code> · 원격: <code>AIONUI_WEB_URL</code>
          </p>
        </div>
      )}
    </div>
  );
}
