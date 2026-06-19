package com.lofficeviewer.app.data

enum class DocumentFormat(
    val label: String,
    val extensions: List<String>,
) {
    PDF("PDF", listOf(".pdf")),
    TXT("텍스트", listOf(".txt", ".md", ".markdown", ".csv", ".log", ".json", ".xml")),
    DOCX("Word", listOf(".docx", ".doc")),
    PPTX("PowerPoint", listOf(".pptx", ".ppt")),
    XLSX("Excel", listOf(".xlsx", ".xls")),
    HWP("HWP", listOf(".hwp")),
    HWPX("HWPX", listOf(".hwpx")),
    UNKNOWN("기타", emptyList());

    companion object {
        fun fromFileName(fileName: String): DocumentFormat {
            val lower = fileName.lowercase()
            return entries.firstOrNull { fmt ->
                fmt.extensions.any { lower.endsWith(it) }
            } ?: UNKNOWN
        }

        fun fromMimeType(mime: String?): DocumentFormat? {
            if (mime.isNullOrBlank()) return null
            return when {
                mime.contains("pdf") -> PDF
                mime.contains("plain") -> TXT
                mime.contains("wordprocessingml") || mime == "application/msword" -> DOCX
                mime.contains("presentationml") || mime.contains("powerpoint") -> PPTX
                mime.contains("spreadsheetml") || mime.contains("excel") -> XLSX
                mime.contains("hwp") || mime.contains("hancom") -> if (mime.contains("hwpx") || mime.contains("hwp+zip")) HWPX else HWP
                else -> null
            }
        }
    }
}

data class ViewerDocument(
    val uriString: String,
    val displayName: String,
    val format: DocumentFormat,
)
