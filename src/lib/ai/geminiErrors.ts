/** Gemini API 오류를 사용자용 한국어 메시지로 변환 */

type GeminiErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{ retryDelay?: string; "@type"?: string }>;
  };
};

export function parseGeminiApiError(raw: string, status: number): string {
  let parsed: GeminiErrorBody | null = null;
  try {
    parsed = JSON.parse(raw) as GeminiErrorBody;
  } catch {
    /* plain text */
  }

  const code = parsed?.error?.code ?? status;
  const statusName = parsed?.error?.status ?? "";
  const apiMessage = parsed?.error?.message ?? "";

  if (code === 429 || statusName === "RESOURCE_EXHAUSTED") {
    const retryDetail = parsed?.error?.details?.find((d) => d.retryDelay);
    const retrySec = retryDetail?.retryDelay
      ? Math.ceil(parseFloat(retryDetail.retryDelay.replace(/s$/, "")))
      : null;

    if (apiMessage.includes("free_tier")) {
      return retrySec
        ? `Gemini 무료 할당량을 초과했습니다. 약 ${retrySec}초 후 다시 시도하거나, .env의 GEMINI_MODEL을 gemini-2.0-flash-lite로 변경해 보세요.`
        : "Gemini 무료 할당량을 초과했습니다. 잠시 후 다시 시도하거나 GEMINI_MODEL을 gemini-2.0-flash-lite로 변경해 보세요.";
    }
    return retrySec
      ? `Gemini API 요청 한도 초과(429). 약 ${retrySec}초 후 다시 시도하세요.`
      : "Gemini API 요청 한도 초과(429). 잠시 후 다시 시도하세요.";
  }

  if (code === 401 || code === 403 || statusName === "UNAUTHENTICATED") {
    return "Gemini API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인하세요.";
  }

  if (code === 404 || statusName === "NOT_FOUND") {
    return "Gemini 모델을 찾을 수 없습니다. GEMINI_MODEL 이름을 확인하세요.";
  }

  if (apiMessage && apiMessage.length <= 280) {
    return apiMessage;
  }

  return `Gemini API 오류 (${code || status})`;
}

/** 무료 티어에서 할당량 여유가 큰 모델 우선 */
export const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
] as const;

export function geminiModelCandidates(preferred?: string): string[] {
  const primary = preferred?.trim() || "gemini-2.0-flash-lite";
  const rest = GEMINI_MODEL_FALLBACKS.filter((m) => m !== primary);
  return [primary, ...rest];
}
