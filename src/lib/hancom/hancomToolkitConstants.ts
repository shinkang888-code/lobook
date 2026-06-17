/** hancom-toolkit 패키지 카탈로그 타입 (JSON manifest 포팅) */
export type HancomLocalized = { ko: string; en: string };

export type HancomPackage = {
  package: string;
  version: string;
  name: HancomLocalized;
  category: "viewer" | "security" | "builtin" | "pipeline";
  platform: ("linux" | "win32" | "darwin" | "web")[];
  url: string;
  referer?: string;
  fileName?: string;
  md5?: string;
  sha256?: string;
  installMessage?: HancomLocalized;
  imageResource?: string;
  openInNewTab?: boolean;
};

/** Book Studio + hancom-toolkit Linux 패키지 + 웹 워크플로 */
export const HANCOM_TOOLKIT_PACKAGES: HancomPackage[] = [
  {
    package: "hoffice-viewer",
    version: "11.20.0.1741",
    category: "viewer",
    platform: ["linux"],
    name: {
      ko: "한컴오피스 2020 Viewer Beta\n(한글/한셀/한쇼)",
      en: "HancomOffice 2020 Viewer Beta",
    },
    installMessage: {
      ko: "Gooroom/Hancom Linux용 .deb — 일부 글꼴 미설치 시 호환성이 떨어질 수 있습니다",
      en: "Gooroom/Hancom Linux .deb package",
    },
    url: "https://cdn.hancom.com/pds/hnc/DOWN/gooroom/hoffice_viewer_2020_amd64.deb",
    referer: "https://www.hancom.com/cs_center",
    fileName: "hoffice_viewer_2020_amd64.deb",
    md5: "5026a38a037fcd9e5a931058b17b6b98",
    sha256: "4bcb0e56f7952f050b099534f31abca09b7411dd4e79ecdcb359a7d18a0079b5",
    openInNewTab: true,
  },
  {
    package: "hancom-office-windows",
    version: "2024",
    category: "viewer",
    platform: ["win32"],
    name: { ko: "한컴오피스 (Windows)", en: "Hancom Office for Windows" },
    url: "https://www.hancom.com/product/hancom/hancomoffice",
    openInNewTab: true,
  },
  {
    package: "hancom-office-mac",
    version: "2024",
    category: "viewer",
    platform: ["darwin"],
    name: { ko: "한컴오피스 (macOS)", en: "Hancom Office for macOS" },
    url: "https://www.hancom.com/product/hancom/hancomoffice",
    openInNewTab: true,
  },
  {
    package: "book-studio-hwpx-extract",
    version: "1.0.0",
    category: "builtin",
    platform: ["web"],
    name: {
      ko: "Book Studio HWPX 추출기",
      en: "Book Studio HWPX Extractor",
    },
    installMessage: {
      ko: "hwpx-contents-extract 알고리즘 TypeScript 포팅 — 서버리스 동작",
      en: "Port of hwpx-contents-extract",
    },
    url: "https://github.com/shinkang888-code/hwpx-contents-extract",
    openInNewTab: true,
  },
  {
    package: "book-studio-hwp-pipeline",
    version: "1.0.0",
    category: "pipeline",
    platform: ["web"],
    name: {
      ko: "한글 → 전자책 파이프라인",
      en: "HWP → eBook Pipeline",
    },
    installMessage: {
      ko: "HWP Canvas / HWPX HTML 추출 → Word·HTML 편집 → EPUB",
      en: "HWP Canvas / HWPX extract → Word/HTML → EPUB",
    },
    url: "/",
    openInNewTab: false,
  },
];

export function detectClientPlatform(): "linux" | "win32" | "darwin" | "web" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "win32";
  if (ua.includes("mac")) return "darwin";
  if (ua.includes("linux")) return "linux";
  return "web";
}

export function filterPackagesForPlatform(
  packages: HancomPackage[],
  platform: HancomPackage["platform"][number],
): HancomPackage[] {
  return packages.filter((p) => p.platform.includes(platform) || p.platform.includes("web"));
}
