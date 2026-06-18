export function getDdddOcrUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_DDDDOCR_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, "");
}

export function isDdddOcrServerAvailable(): boolean {
  return Boolean(getDdddOcrUrl());
}
