package com.lofficeviewer.app.extract

import java.util.zip.ZipInputStream

/**
 * Office Open XML (DOCX/PPTX/XLSX) 경량 텍스트 추출 — Apache POI 없이 ZIP+XML 파싱
 * Microsoft Office Viewer / LoBooK MarkItDown 경로와 유사한 오프라인 프리뷰
 */
object OfficeOpenXmlExtractor {
    data class Result(val html: String, val title: String)

    fun extractDocx(bytes: ByteArray, fileName: String): Result {
        val xml = readZipEntry(bytes, "word/document.xml") ?: return emptyResult(fileName, "Word")
        val paragraphs = extractTaggedText(xml, "w:t")
        return Result(buildProseHtml("Word", fileName, paragraphs), fileName)
    }

    fun extractPptx(bytes: ByteArray, fileName: String): Result {
        val slides = mutableListOf<String>()
        ZipInputStream(bytes.inputStream()).use { zip ->
            var entry = zip.nextEntry
            val slideTexts = mutableMapOf<Int, MutableList<String>>()
            while (entry != null) {
                if (!entry.isDirectory && entry.name.matches(Regex("ppt/slides/slide\\d+\\.xml"))) {
                    val num = Regex("slide(\\d+)").find(entry.name)?.groupValues?.get(1)?.toIntOrNull() ?: 0
                    val xml = zip.readBytes().decodeToString()
                    slideTexts.getOrPut(num) { mutableListOf() }.addAll(extractTaggedText(xml, "a:t"))
                }
                entry = zip.nextEntry
            }
            slideTexts.toSortedMap().forEach { (num, texts) ->
                if (texts.isNotEmpty()) {
                    slides.add("<h3>슬라이드 $num</h3>" + texts.joinToString("") { "<p>${escape(it)}</p>" })
                }
            }
        }
        val body = if (slides.isEmpty()) "<p>슬라이드 텍스트를 추출하지 못했습니다.</p>" else slides.joinToString("")
        return Result(wrapHtml("PowerPoint", fileName, body), fileName)
    }

    fun extractXlsx(bytes: ByteArray, fileName: String): Result {
        val shared = readZipEntry(bytes, "xl/sharedStrings.xml")
        val strings = if (shared != null) extractTaggedText(shared, "t") else emptyList()
        val sheets = mutableListOf<String>()
        ZipInputStream(bytes.inputStream()).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                if (!entry.isDirectory && entry.name.matches(Regex("xl/worksheets/sheet\\d+\\.xml"))) {
                    val sheetName = entry.name.substringAfterLast('/').removeSuffix(".xml")
                    val xml = zip.readBytes().decodeToString()
                    val rows = extractSheetRows(xml, strings)
                    if (rows.isNotEmpty()) {
                        sheets.add(buildTable(sheetName, rows))
                    }
                }
                entry = zip.nextEntry
            }
        }
        val body = if (sheets.isEmpty()) "<p>시트 데이터를 추출하지 못했습니다.</p>" else sheets.joinToString("")
        return Result(wrapHtml("Excel", fileName, body), fileName)
    }

    private fun readZipEntry(bytes: ByteArray, targetPath: String): String? {
        ZipInputStream(bytes.inputStream()).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                if (!entry.isDirectory && entry.name.equals(targetPath, ignoreCase = true)) {
                    return zip.readBytes().decodeToString()
                }
                entry = zip.nextEntry
            }
        }
        return null
    }

    private fun extractTaggedText(xml: String, tag: String): List<String> {
        val regex = Regex("<(?:[\\w-]+:)?${Regex.escape(tag)}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${Regex.escape(tag)}>", RegexOption.IGNORE_CASE)
        return regex.findAll(xml).mapNotNull { m ->
            decodeXml(stripTags(m.groupValues[1])).takeIf { it.isNotBlank() }
        }.toList()
    }

    private fun extractSheetRows(xml: String, sharedStrings: List<String>): List<List<String>> {
        val rows = mutableListOf<List<String>>()
        val rowRegex = Regex("<(?:[\\w-]+:)?row\\b[^>]*>[\\s\\S]*?</(?:[\\w-]+:)?row>", RegexOption.IGNORE_CASE)
        rowRegex.findAll(xml).take(200).forEach { rowMatch ->
            val cells = mutableListOf<String>()
            val cellRegex = Regex("<(?:[\\w-]+:)?c\\b[^>]*>[\\s\\S]*?</(?:[\\w-]+:)?c>", RegexOption.IGNORE_CASE)
            cellRegex.findAll(rowMatch.value).take(20).forEach { cellMatch ->
                val cell = cellMatch.value
                val inline = extractTaggedText(cell, "t").joinToString("")
                if (inline.isNotBlank()) {
                    cells.add(inline)
                } else {
                    val ref = Regex("t=\"(\\d+)\"").find(cell)?.groupValues?.get(1)?.toIntOrNull()
                    if (ref != null && ref < sharedStrings.size) cells.add(sharedStrings[ref])
                }
            }
            if (cells.isNotEmpty()) rows.add(cells)
        }
        return rows
    }

    private fun buildTable(sheetName: String, rows: List<List<String>>): String {
        val sb = StringBuilder("<h3>${escape(sheetName)}</h3><table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;width:100%;font-size:13px;'>")
        rows.take(100).forEach { row ->
            sb.append("<tr>")
            row.forEach { cell -> sb.append("<td>").append(escape(cell)).append("</td>") }
            sb.append("</tr>")
        }
        sb.append("</table>")
        return sb.toString()
    }

    private fun buildProseHtml(kind: String, fileName: String, paragraphs: List<String>): String {
        val body = if (paragraphs.isEmpty()) {
            "<p>본문 텍스트를 추출하지 못했습니다.</p>"
        } else {
            paragraphs.joinToString("") { "<p>${escape(it)}</p>" }
        }
        return wrapHtml(kind, fileName, body)
    }

    private fun wrapHtml(kind: String, fileName: String, body: String): String = """
        <!DOCTYPE html><html><head><meta charset='utf-8'/>
        <meta name='viewport' content='width=device-width,initial-scale=1'/>
        <style>
        body{font-family:'Malgun Gothic','Noto Sans KR',sans-serif;line-height:1.75;color:#1e293b;padding:16px;background:#fff;}
        .meta{font-size:11px;color:#64748b;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;}
        table{margin:12px 0;} h3{margin:16px 0 8px;font-size:14px;color:#2b579a;}
        </style></head><body>
        <div class='meta'>$kind · ${escape(fileName)}</div>
        $body
        </body></html>
    """.trimIndent()

    private fun emptyResult(fileName: String, kind: String) =
        Result(wrapHtml(kind, fileName, "<p>파일 구조를 읽을 수 없습니다.</p>"), fileName)

    private fun stripTags(s: String) = s.replace(Regex("<[^>]+>"), "")

    private fun decodeXml(s: String) =
        s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"")

    private fun escape(text: String) =
        text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
}
