import JSZip from "jszip";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapChapterHtml(title: string, bodyHtml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head>
  <title>${escapeXml(title)}</title>
  <meta charset="utf-8"/>
  <style>
    body { font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif; line-height: 1.7; padding: 1.5rem; }
    h1, h2, h3 { line-height: 1.3; }
    img { max-width: 100%; height: auto; }
    pre, code { font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function buildNav(title: string, chapterId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko">
<head>
  <title>목차</title>
  <meta charset="utf-8"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(title)}</h1>
    <ol>
      <li><a href="${chapterId}.xhtml">${escapeXml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`;
}

export async function buildEpubBuffer(options: {
  title: string;
  author: string;
  html: string;
}): Promise<Buffer> {
  const zip = new JSZip();
  const bookId = crypto.randomUUID();
  const chapterId = "chapter1";
  const modified = new Date().toISOString().slice(0, 19) + "Z";

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.folder("META-INF")?.file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("EPUB packaging failed");

  oebps.file(`${chapterId}.xhtml`, wrapChapterHtml(options.title, options.html));
  oebps.file("nav.xhtml", buildNav(options.title, chapterId));
  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${bookId}</dc:identifier>
    <dc:title>${escapeXml(options.title)}</dc:title>
    <dc:creator>${escapeXml(options.author)}</dc:creator>
    <dc:language>ko</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="${chapterId}" href="${chapterId}.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="${chapterId}"/>
  </spine>
</package>`,
  );

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
