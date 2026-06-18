import { promises as fs } from "fs";
import path from "path";
import { probeNpxCli } from "./pptCliProbe";

export type PptThemeTokens = {
  id: string;
  label: string;
  accent: string;
  bg: string;
  text: string;
  muted: string;
  gradientStart: string;
  gradientEnd: string;
  coverSubtitle: string;
  coverFooter: string;
  fontFamily: string;
  source?: "builtin" | "figma" | "figma-api";
};

export type PptFigmaStatus = {
  cliAvailable: boolean;
  cliVersion?: string;
  apiEnabled: boolean;
  fileKey?: string;
  themeCount: number;
  error?: string;
};

const BUILTIN_THEMES: PptThemeTokens[] = [
  {
    id: "lobook",
    label: "LoBooK Classic",
    accent: "#335095",
    bg: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    gradientStart: "#1e3f6f",
    gradientEnd: "#335095",
    coverSubtitle: "#dbeafe",
    coverFooter: "#bfdbfe",
    fontFamily: "Malgun Gothic, Apple SD Gothic Neo, sans-serif",
    source: "builtin",
  },
  {
    id: "figma-light",
    label: "Figma Design System",
    accent: "#6182d6",
    bg: "#ffffff",
    text: "#1a1a1a",
    muted: "#6b7280",
    gradientStart: "#335095",
    gradientEnd: "#6182d6",
    coverSubtitle: "#e8eef8",
    coverFooter: "#c5d4f0",
    fontFamily: "Inter, Malgun Gothic, sans-serif",
    source: "figma",
  },
  {
    id: "figma-dark",
    label: "Figma Dark",
    accent: "#8b5cf6",
    bg: "#0f172a",
    text: "#f1f5f9",
    muted: "#94a3b8",
    gradientStart: "#1e1b4b",
    gradientEnd: "#4c1d95",
    coverSubtitle: "#ddd6fe",
    coverFooter: "#c4b5fd",
    fontFamily: "Inter, Malgun Gothic, sans-serif",
    source: "figma",
  },
  {
    id: "corporate",
    label: "Corporate Blue",
    accent: "#2b579a",
    bg: "#f4f6f8",
    text: "#1e293b",
    muted: "#64748b",
    gradientStart: "#1e3a5f",
    gradientEnd: "#2b579a",
    coverSubtitle: "#dbeafe",
    coverFooter: "#93c5fd",
    fontFamily: "Malgun Gothic, sans-serif",
    source: "builtin",
  },
];

const FIGMA_FILE_KEY =
  process.env.FIGMA_FILE_KEY || process.env.FIGMA_PPT_FILE_KEY || "3FVgUkf0MGa6QVQoRxnUE3";

function themesManifestPath(): string {
  return path.join(process.cwd(), "vendor", "ppt-studio", "figma-themes.json");
}

async function loadManifestThemes(): Promise<PptThemeTokens[]> {
  try {
    const raw = await fs.readFile(themesManifestPath(), "utf-8");
    const data = JSON.parse(raw) as { themes?: PptThemeTokens[] };
    return (data.themes ?? []).filter((t) => t.id && t.accent);
  } catch {
    return [];
  }
}

async function fetchFigmaApiThemes(): Promise<PptThemeTokens[]> {
  const token = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/variables/local`, {
      headers: { "X-Figma-Token": token },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      meta?: {
        variables?: Record<
          string,
          { name: string; resolvedValuesByMode?: Record<string, { color?: string }> }
        >;
      };
    };

    const vars = Object.values(data.meta?.variables ?? {});
    const accentVar = vars.find((v) => /accent|primary/i.test(v.name));
    const bgVar = vars.find((v) => /background|bg/i.test(v.name));
    const accentColor = accentVar
      ? Object.values(accentVar.resolvedValuesByMode ?? {})[0]?.color
      : undefined;
    const bgColor = bgVar
      ? Object.values(bgVar.resolvedValuesByMode ?? {})[0]?.color
      : undefined;

    if (!accentColor) return [];

    return [
      {
        id: "figma-live",
        label: "Figma Live Variables",
        accent: accentColor,
        bg: bgColor ?? "#f8fafc",
        text: "#0f172a",
        muted: "#64748b",
        gradientStart: accentColor,
        gradientEnd: accentColor,
        coverSubtitle: "#dbeafe",
        coverFooter: "#bfdbfe",
        fontFamily: "Inter, Malgun Gothic, sans-serif",
        source: "figma-api",
      },
    ];
  } catch {
    return [];
  }
}

let themeCache: PptThemeTokens[] | null = null;
let themeCacheAt = 0;

export async function listPptThemes(): Promise<PptThemeTokens[]> {
  const now = Date.now();
  if (themeCache && now - themeCacheAt < 120000) return themeCache;

  const manifest = await loadManifestThemes();
  const apiThemes = await fetchFigmaApiThemes();
  const merged = new Map<string, PptThemeTokens>();

  for (const theme of BUILTIN_THEMES) merged.set(theme.id, theme);
  for (const theme of manifest) merged.set(theme.id, theme);
  for (const theme of apiThemes) merged.set(theme.id, theme);

  themeCache = Array.from(merged.values());
  themeCacheAt = now;
  return themeCache;
}

export async function resolvePptTheme(themeId?: string): Promise<PptThemeTokens> {
  const themes = await listPptThemes();
  return themes.find((t) => t.id === themeId) ?? themes[0] ?? BUILTIN_THEMES[0];
}

let figmaCliCache: PptFigmaStatus | null = null;
let figmaCliCacheAt = 0;

export async function getPptFigmaStatus(): Promise<PptFigmaStatus> {
  const now = Date.now();
  if (figmaCliCache && now - figmaCliCacheAt < 60000) return figmaCliCache;

  const cli = await probeNpxCli("figma");
  const apiEnabled = Boolean(process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN);
  const themes = await listPptThemes();

  figmaCliCache = {
    cliAvailable: cli.available,
    cliVersion: cli.version,
    apiEnabled,
    fileKey: FIGMA_FILE_KEY,
    themeCount: themes.length,
    error:
      cli.available || apiEnabled
        ? undefined
        : "Figma CLI(@figma/code-connect) 또는 FIGMA_ACCESS_TOKEN 필요",
  };
  figmaCliCacheAt = now;
  return figmaCliCache;
}
