/** Gemini SSE/JSON 응답에서 텍스트 델타 추출 */

export function extractGeminiTextDelta(payload: unknown): string {
  if (!payload) return "";
  if (Array.isArray(payload)) {
    return payload.map(extractGeminiTextDelta).join("");
  }
  if (typeof payload !== "object") return "";

  const obj = payload as Record<string, unknown>;
  const candidates = obj.candidates as
    | Array<{ content?: { parts?: Array<{ text?: string }> } }>
    | undefined;

  if (!candidates?.length) return "";

  return candidates
    .flatMap((c) => c.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
}

/** SSE 버퍼에서 Gemini data 라인 파싱 */
export function parseGeminiSseChunk(buffer: string): { text: string; rest: string } {
  const lines = buffer.split(/\r?\n/);
  const rest = lines.pop() ?? "";
  let text = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":")) continue;

    let data = trimmed;
    if (trimmed.startsWith("data:")) {
      data = trimmed.slice(5).trim();
    }
    if (!data || data === "[DONE]") continue;

    try {
      text += extractGeminiTextDelta(JSON.parse(data));
    } catch {
      /* 불완전 JSON — 다음 청크에서 이어짐 */
    }
  }

  return { text, rest };
}
