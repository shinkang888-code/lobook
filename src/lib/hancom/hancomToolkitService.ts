import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { HancomPackage } from "./hancomToolkitConstants";
import { HANCOM_TOOLKIT_PACKAGES } from "./hancomToolkitConstants";
import { isHwpxFileName, previewHwpx } from "@/lib/hwpx/hwpxService";
import { initRhwpServer } from "@/lib/rhwp/setup";

export type HancomDocumentFormat = "hwp" | "hwpx" | "unknown";

export type HancomDocumentAnalysis = {
  format: HancomDocumentFormat;
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

function detectFormat(buffer: ArrayBuffer, fileName: string): HancomDocumentFormat {
  if (isHwpxFileName(fileName)) return "hwpx";
  if (/\.hwp$/i.test(fileName)) return "hwp";
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "hwpx";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) return "hwp";
  return "unknown";
}

export function sha256Buffer(buffer: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

export async function analyzeHancomDocument(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<HancomDocumentAnalysis> {
  const format = detectFormat(buffer, fileName);
  const base: HancomDocumentAnalysis = {
    format,
    fileName,
    sizeBytes: buffer.byteLength,
    sha256: sha256Buffer(buffer),
  };

  if (format === "hwpx") {
    const preview = await previewHwpx(buffer);
    return {
      ...base,
      sectionCount: preview.sectionCount,
      imageCount: preview.imageCount,
      charCount: preview.charCount,
      keywords: preview.keywords,
      plainTextPreview: preview.plainText.slice(0, 500),
    };
  }

  if (format === "hwp") {
    try {
      const rhwp = await initRhwpServer();
      const doc = new rhwp.HwpDocument(new Uint8Array(buffer));
      try {
        const pageCount = doc.pageCount();
        return { ...base, pageCount };
      } finally {
        doc.free();
      }
    } catch {
      return base;
    }
  }

  return base;
}

export async function loadToolkitManifestFromVendor(): Promise<HancomPackage[] | null> {
  const candidates = [
    path.join(process.cwd(), "vendor", "hancom-toolkit", "hancom-toolkit.json"),
    path.join(process.cwd(), "vendor", "hancom-toolkit", "manifest.json"),
  ];
  for (const file of candidates) {
    try {
      const raw = await fs.readFile(file, "utf-8");
      const json = JSON.parse(raw) as { packages?: unknown[] };
      if (!Array.isArray(json.packages)) continue;
      return json.packages.map((p) => mapLegacyPackage(p as Record<string, unknown>));
    } catch {
      /* try next */
    }
  }
  return null;
}

function mapLegacyPackage(raw: Record<string, unknown>): HancomPackage {
  const name = raw.name as HancomLocalized | undefined;
  const installMessage = raw["install-message"] as HancomLocalized | undefined;
  const fileName = (raw["file-name"] as string) || undefined;
  const baseUrl = (raw.url as string) || "";
  const downloadUrl = fileName && baseUrl ? `${baseUrl.replace(/\/$/, "")}/${fileName}` : baseUrl;

  return {
    package: String(raw.package ?? "unknown"),
    version: String(raw.version ?? ""),
    category: raw.package === "ahnlab-v3lite" ? "security" : "viewer",
    platform: ["linux"],
    name: name ?? { ko: String(raw.package), en: String(raw.package) },
    url: downloadUrl,
    referer: raw.referer as string | undefined,
    fileName,
    md5: raw.MD5 as string | undefined,
    sha256: raw.SHA256 as string | undefined,
    installMessage,
    imageResource: raw["image-resource"] as string | undefined,
    openInNewTab: true,
  };
}

type HancomLocalized = { ko: string; en: string };

export async function getHancomToolkitCatalog(): Promise<{
  packages: HancomPackage[];
  source: "vendor" | "embedded";
}> {
  const vendor = await loadToolkitManifestFromVendor();
  if (vendor?.length) {
    const merged = mergeCatalog(vendor, HANCOM_TOOLKIT_PACKAGES);
    return { packages: merged, source: "vendor" };
  }
  return { packages: HANCOM_TOOLKIT_PACKAGES, source: "embedded" };
}

function mergeCatalog(vendor: HancomPackage[], embedded: HancomPackage[]): HancomPackage[] {
  const byId = new Map<string, HancomPackage>();
  for (const p of embedded) byId.set(p.package, p);
  for (const p of vendor) byId.set(p.package, { ...byId.get(p.package), ...p });
  return [...byId.values()];
}

export function verifySha256Hex(buffer: ArrayBuffer, expected: string): boolean {
  return sha256Buffer(buffer).toLowerCase() === expected.toLowerCase();
}
