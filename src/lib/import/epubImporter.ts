import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export type EpubImportChapter = {
  title: string;
  html: string;
  href: string;
};

export type EpubImportResult = {
  title: string;
  author: string;
  chapters: EpubImportChapter[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function textContent(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"];
    return Object.values(obj).map(textContent).join("");
  }
  return "";
}

async function readZipText(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path);
  if (!file) return null;
  return file.async("string");
}

function resolvePath(base: string, href: string): string {
  if (href.startsWith("/")) return href.slice(1);
  const baseDir = base.includes("/") ? base.replace(/\/[^/]+$/, "") : "";
  const parts = [...(baseDir ? baseDir.split("/") : []), ...href.split("/")];
  const stack: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  return stack.join("/");
}

export async function importEpub(buffer: ArrayBuffer): Promise<EpubImportResult> {
  const zip = await JSZip.loadAsync(buffer);

  const containerXml = await readZipText(zip, "META-INF/container.xml");
  if (!containerXml) throw new Error("유효한 EPUB이 아닙니다 (container.xml 없음).");

  const container = parser.parse(containerXml);
  const rootfile =
    container?.container?.rootfiles?.rootfile ??
    container?.container?.rootfiles?.["rootfile"];
  const opfPath = Array.isArray(rootfile) ? rootfile[0]["@_full-path"] : rootfile["@_full-path"];
  if (!opfPath) throw new Error("OPF 경로를 찾을 수 없습니다.");

  const opfXml = await readZipText(zip, opfPath);
  if (!opfXml) throw new Error("content.opf를 읽을 수 없습니다.");

  const opf = parser.parse(opfXml);
  const pkg = opf?.package ?? opf;
  const metadata = pkg?.metadata ?? {};
  const title =
    textContent(metadata["dc:title"]) ||
    textContent(metadata.title) ||
    "가져온 EPUB";
  const author =
    textContent(metadata["dc:creator"]) ||
    textContent(metadata.creator) ||
    "익명";

  const manifestItems = pkg?.manifest?.item ?? [];
  const manifestArr = Array.isArray(manifestItems) ? manifestItems : [manifestItems];
  const hrefById = new Map<string, string>();
  for (const item of manifestArr) {
    if (item?.["@_id"] && item?.["@_href"]) {
      hrefById.set(item["@_id"], item["@_href"]);
    }
  }

  const spineItems = pkg?.spine?.itemref ?? [];
  const spineArr = Array.isArray(spineItems) ? spineItems : [spineItems];

  const chapters: EpubImportChapter[] = [];

  for (const ref of spineArr) {
    const idref = ref?.["@_idref"];
    if (!idref) continue;
    const href = hrefById.get(idref);
    if (!href) continue;
    const mediaType = manifestArr.find((m) => m["@_id"] === idref)?.["@_media-type"] ?? "";
    if (!mediaType.includes("html") && !href.endsWith(".xhtml") && !href.endsWith(".html")) {
      continue;
    }

    const fullPath = resolvePath(opfPath, href);
    const xhtml = await readZipText(zip, fullPath);
    if (!xhtml) continue;

    const titleMatch = xhtml.match(/<title[^>]*>([^<]*)<\/title>/i);
    const h1Match = xhtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const chapterTitle =
      titleMatch?.[1]?.trim() ||
      h1Match?.[1]?.replace(/<[^>]+>/g, "").trim() ||
      `챕터 ${chapters.length + 1}`;

    chapters.push({
      title: chapterTitle,
      html: bodyMatch?.[1]?.trim() ?? xhtml,
      href,
    });
  }

  if (chapters.length === 0) {
    throw new Error("EPUB에서 읽을 수 있는 챕터가 없습니다.");
  }

  return { title, author, chapters };
}
