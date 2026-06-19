package com.lofficeviewer.app.extract

import java.io.ByteArrayOutputStream
import java.util.Base64
import java.util.zip.ZipInputStream

/**
 * LoBooK hwpxExtractor.ts 포팅 — HWPX ZIP/XML 본문 추출
 */
object HwpxExtractor {
    data class Result(
        val html: String,
        val sectionCount: Int,
        val charCount: Int,
    )

    fun extract(bytes: ByteArray): Result {
        val sections = mutableListOf<List<String>>()
        val images = mutableListOf<Pair<String, String>>()

        ZipInputStream(bytes.inputStream()).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                if (!entry.isDirectory) {
                    val name = entry.name
                    val content = zip.readBytes()
                    if (name.contains("section", ignoreCase = true) && name.endsWith(".xml", ignoreCase = true)) {
                        val paragraphs = extractParagraphsFromSectionXml(content.decodeToString())
                        if (paragraphs.isNotEmpty()) sections.add(paragraphs)
                    }
                    imageMime(name)?.let { mime ->
                        if (name.contains("image", ignoreCase = true) ||
                            name.contains("bindata", ignoreCase = true) ||
                            name.contains("picture", ignoreCase = true)
                        ) {
                            val b64 = Base64.getEncoder().encodeToString(content)
                            images.add(mime to b64)
                        }
                    }
                }
                entry = zip.nextEntry
            }
        }

        val html = buildHtml(sections, images)
        val charCount = sections.flatten().joinToString("\n").length
        return Result(html, sections.size.coerceAtLeast(1), charCount)
    }

    private fun buildHtml(sections: List<List<String>>, images: List<Pair<String, String>>): String {
        val sb = StringBuilder()
        sb.append("<!DOCTYPE html><html><head><meta charset='utf-8'/>")
        sb.append("<meta name='viewport' content='width=device-width,initial-scale=1'/>")
        sb.append("<style>")
        sb.append("body{font-family:'Malgun Gothic','Noto Sans KR',sans-serif;line-height:1.75;color:#1e293b;padding:16px;background:#fff;}")
        sb.append("p{margin:0 0 12px;} img{max-width:100%;height:auto;margin:12px 0;}")
        sb.append(".meta{font-size:11px;color:#64748b;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;}")
        sb.append("</style></head><body>")
        sb.append("<div class='meta'>HWPX · ${sections.size.coerceAtLeast(1)}섹션</div>")

        if (sections.isEmpty()) {
            sb.append("<p>추출된 본문이 없습니다.</p>")
        } else {
            sections.forEachIndexed { si, paras ->
                if (sections.size > 1) sb.append("<h3>섹션 ${si + 1}</h3>")
                paras.forEach { p ->
                    sb.append("<p>").append(escapeHtml(p)).append("</p>")
                }
            }
        }

        images.take(24).forEach { (mime, b64) ->
            sb.append("<img src='data:$mime;base64,$b64' alt=''/>")
        }
        sb.append("</body></html>")
        return sb.toString()
    }

    fun extractParagraphsFromSectionXml(xml: String): List<String> {
        val paragraphs = mutableListOf<String>()
        val paragraphRegex = Regex("<(?:[\\w-]+:)?p\\b[^>]*>[\\s\\S]*?</(?:[\\w-]+:)?p>", RegexOption.IGNORE_CASE)
        paragraphRegex.findAll(xml).forEach { match ->
            stripXmlTags(match.value).takeIf { it.isNotBlank() }?.let { paragraphs.add(it) }
        }
        if (paragraphs.isEmpty()) {
            val textRegex = Regex("<(?:[\\w-]+:)?t\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?t>", RegexOption.IGNORE_CASE)
            textRegex.findAll(xml).forEach { match ->
                stripXmlTags(match.groupValues[1]).takeIf { it.isNotBlank() }?.let { paragraphs.add(it) }
            }
        }
        return paragraphs
    }

    private fun stripXmlTags(fragment: String): String = decodeXmlEntities(fragment.replace(Regex("<[^>]+>"), "")).trim()

    private fun decodeXmlEntities(value: String): String =
        value
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace(Regex("&#x([0-9a-f]+);", RegexOption.IGNORE_CASE)) { m ->
                m.groupValues[1].toInt(16).toChar().toString()
            }
            .replace(Regex("&#(\\d+);")) { m ->
                m.groupValues[1].toInt().toChar().toString()
            }

    private fun imageMime(path: String): String? = when (path.substringAfterLast('.').lowercase()) {
        "jpg", "jpeg" -> "image/jpeg"
        "png" -> "image/png"
        "gif" -> "image/gif"
        "bmp" -> "image/bmp"
        "webp" -> "image/webp"
        else -> null
    }

    private fun escapeHtml(text: String): String =
        text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
}
