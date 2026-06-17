/**
 * hancom-toolkit 연동 검증
 * 실행: npm run verify:hancom
 */
import JSZip from "jszip";
import { listBooks } from "../src/lib/bookService";
import {
  analyzeHancomDocument,
  getHancomToolkitCatalog,
  sha256Buffer,
  verifySha256Hex,
} from "../src/lib/hancom/hancomToolkitService";
import { HANCOM_TOOLKIT_PACKAGES } from "../src/lib/hancom/hancomToolkitConstants";

async function createSampleHwpx(text: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    "Contents/section0.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p><hp:run><hp:t>${text}</hp:t></hp:run></hp:p>
</hs:sec>`,
  );
  return zip.generateAsync({ type: "arraybuffer" });
}

async function main() {
  const errors: string[] = [];
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);

  console.log("\n=== hancom-toolkit 연동 검증 ===\n");

  if (HANCOM_TOOLKIT_PACKAGES.length < 4) errors.push("embedded catalog");
  else ok(`내장 카탈로그 ${HANCOM_TOOLKIT_PACKAGES.length}개`);

  const catalog = await getHancomToolkitCatalog();
  if (catalog.packages.length < 4) errors.push("catalog empty");
  else ok(`툴킷 카탈로그 ${catalog.packages.length}개 (${catalog.source})`);

  const viewer = catalog.packages.find((p) => p.package === "hoffice-viewer");
  if (!viewer?.sha256) errors.push("hoffice-viewer sha256");
  else ok("한컴오피스 Viewer 패키지 메타");

  const buf = await createSampleHwpx("hancom toolkit test");
  const hash = sha256Buffer(buf);
  if (!verifySha256Hex(buf, hash)) errors.push("sha256 self-check");
  else ok("SHA256 검증 로직");

  const analysis = await analyzeHancomDocument(buf, "test.hwpx");
  if (analysis.format !== "hwpx" || !analysis.charCount) errors.push("hwpx analysis");
  else ok(`HWPX 분석 — ${analysis.charCount}자, 키워드 ${analysis.keywords?.length ?? 0}개`);

  const books = await listBooks();
  if (!books[0]) errors.push("책 없음");
  else ok(`책 ${books.length}권`);

  console.log("\n=== 결과 ===");
  if (errors.length === 0) {
    console.log("✅ hancom-toolkit 연동 검증 통과\n");
    process.exit(0);
  }
  console.log("❌ 검증 실패:");
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
