import { getDdddOcrUrl } from "./ddddocr-config";

let healthCache: { ok: boolean; at: number } | null = null;
const HEALTH_TTL_MS = 30_000;

function requireBase(): string {
  const base = getDdddOcrUrl();
  if (!base) throw new Error("ddddocr 서버 URL이 설정되지 않았습니다. NEXT_PUBLIC_DDDDOCR_URL을 확인하세요.");
  return base;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseOcrText(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.result === "string") return obj.result.trim();
    if (typeof obj.text === "string") return obj.text.trim();
    if (obj.success === true && obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      if (typeof data.text === "string") return data.text.trim();
    }
  }
  return "";
}

async function ddddocrFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${requireBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let json: unknown;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(raw || `ddddocr API 오류 (${res.status})`);
  }
  if (!res.ok) {
    const detail =
      typeof json === "object" && json !== null && "detail" in json
        ? String((json as { detail: unknown }).detail)
        : raw;
    throw new Error(detail || `ddddocr API 오류 (${res.status})`);
  }
  return json as T;
}

export async function checkDdddOcrHealth(force = false): Promise<boolean> {
  const base = getDdddOcrUrl();
  if (!base) return false;
  if (!force && healthCache && Date.now() - healthCache.at < HEALTH_TTL_MS) {
    return healthCache.ok;
  }
  try {
    const res = await fetch(`${base}/health`, { method: "GET" });
    if (!res.ok) {
      healthCache = { ok: false, at: Date.now() };
      return false;
    }
    const json = (await res.json()) as { status?: string };
    const ok = json.status === "ok" || json.status === "healthy";
    healthCache = { ok, at: Date.now() };
    return ok;
  } catch {
    healthCache = { ok: false, at: Date.now() };
    return false;
  }
}

export async function ddddocrClassifyBuffer(buffer: ArrayBuffer): Promise<string> {
  const image = arrayBufferToBase64(buffer);
  const modern = await ddddocrFetch<unknown>("/ocr", { image, probability: false, png_fix: false });
  const text = parseOcrText(modern);
  if (!text) throw new Error("ddddocr OCR 결과가 비어 있습니다.");
  return text;
}

export async function ddddocrClassifyBlob(blob: Blob): Promise<string> {
  return ddddocrClassifyBuffer(await blob.arrayBuffer());
}
