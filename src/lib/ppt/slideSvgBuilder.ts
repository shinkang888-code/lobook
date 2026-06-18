import type { PptThemeTokens } from "./pptFigmaTheme";

export type PptSlidePlan = {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  layout: "cover" | "content" | "closing";
};

export type PptGenerationPlan = {
  deckTitle: string;
  theme: string;
  slides: PptSlidePlan[];
};

export type PptAiRequest = {
  prompt: string;
  bookTitle: string;
  author?: string;
  sourceMarkdown: string;
  maxSlides?: number;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxLen = 42): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLen && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function buildSlideSvg(
  slide: PptSlidePlan,
  index: number,
  total: number,
  viewBox = "0 0 1280 720",
  theme?: PptThemeTokens,
): string {
  const [w, h] = viewBox.replace("0 0 ", "").split(" ").map(Number);
  const accent = theme?.accent ?? "#2b579a";
  const bg = theme?.bg ?? "#f8fafc";
  const text = theme?.text ?? "#0f172a";
  const muted = theme?.muted ?? "#64748b";
  const gradientStart = theme?.gradientStart ?? "#1e3f6f";
  const gradientEnd = theme?.gradientEnd ?? accent;
  const coverSubtitle = theme?.coverSubtitle ?? "#dbeafe";
  const coverFooter = theme?.coverFooter ?? "#bfdbfe";
  const fontFamily = theme?.fontFamily ?? "Malgun Gothic, Apple SD Gothic Neo, sans-serif";
  const brandLabel = theme?.id === "lobook" || !theme ? "PPT Master · LoBooK" : `PPT Master · ${theme.label}`;

  if (slide.layout === "cover") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${gradientStart}"/>
      <stop offset="100%" stop-color="${gradientEnd}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="0" y="${h - 12}" width="${w}" height="12" fill="#ffffff" opacity="0.12"/>
  <text x="80" y="280" font-family="${fontFamily}" font-size="56" font-weight="700" fill="#ffffff">${escapeXml(slide.title)}</text>
  <text x="80" y="360" font-family="${fontFamily}" font-size="28" fill="${coverSubtitle}">${escapeXml(slide.subtitle ?? "LoBooK AI Presentation")}</text>
  <text x="80" y="${h - 56}" font-family="${fontFamily}" font-size="18" fill="${coverFooter}">${escapeXml(brandLabel)}</text>
</svg>`;
  }

  if (slide.layout === "closing") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect width="${w}" height="8" fill="${accent}"/>
  <text x="80" y="300" font-family="${fontFamily}" font-size="48" font-weight="700" fill="${text}">${escapeXml(slide.title)}</text>
  <text x="80" y="380" font-family="${fontFamily}" font-size="24" fill="${muted}">${escapeXml(slide.subtitle ?? "감사합니다")}</text>
</svg>`;
  }

  const bulletY = 200;
  const bulletLines = slide.bullets.flatMap((b) => wrapLines(b, 36)).slice(0, 8);
  const bulletSvg = bulletLines
    .map((line, i) => {
      const y = bulletY + i * 52;
      return `<circle cx="92" cy="${y - 10}" r="6" fill="${accent}"/><text x="120" y="${y}" font-family="${fontFamily}" font-size="26" fill="${text}">${escapeXml(line)}</text>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect width="${w}" height="8" fill="${accent}"/>
  <text x="80" y="96" font-family="${fontFamily}" font-size="40" font-weight="700" fill="${text}">${escapeXml(slide.title)}</text>
  <line x1="80" y1="120" x2="360" y2="120" stroke="${accent}" stroke-width="4"/>
  ${bulletSvg}
  <text x="${w - 80}" y="${h - 40}" text-anchor="end" font-family="${fontFamily}" font-size="16" fill="${muted}">${index + 1} / ${total}</text>
</svg>`;
}

export function planFromMarkdown(
  bookTitle: string,
  author: string | undefined,
  markdown: string,
  prompt: string,
  maxSlides = 12,
): PptGenerationPlan {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections: { title: string; bullets: string[] }[] = [];
  let current: { title: string; bullets: string[] } | null = null;

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1], bullets: [] };
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
    if (bullet && current) {
      current.bullets.push(bullet[1]);
    } else if (current && line.length > 8 && current.bullets.length < 6) {
      current.bullets.push(line.replace(/^#+\s*/, ""));
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    const chunks = markdown.split(/\n{2,}/).filter((p) => p.trim()).slice(0, maxSlides - 2);
    sections.push(
      ...chunks.map((chunk, i) => ({
        title: `슬라이드 ${i + 1}`,
        bullets: chunk.split("\n").filter(Boolean).slice(0, 5),
      })),
    );
  }

  const limited = sections.slice(0, Math.max(1, maxSlides - 2));
  const slides: PptSlidePlan[] = [
    {
      id: "01_cover",
      title: bookTitle || "발표 자료",
      subtitle: prompt.slice(0, 120) || author || "LoBooK",
      bullets: [],
      layout: "cover",
    },
    ...limited.map((sec, i) => ({
      id: `${String(i + 2).padStart(2, "0")}_${sec.title.slice(0, 24).replace(/\s+/g, "_")}`,
      title: sec.title,
      bullets: sec.bullets.length ? sec.bullets : ["핵심 내용을 정리했습니다."],
      layout: "content" as const,
    })),
    {
      id: `${String(limited.length + 2).padStart(2, "0")}_closing`,
      title: "감사합니다",
      subtitle: bookTitle,
      bullets: [],
      layout: "closing",
    },
  ];

  return { deckTitle: bookTitle, theme: "lobook", slides };
}
