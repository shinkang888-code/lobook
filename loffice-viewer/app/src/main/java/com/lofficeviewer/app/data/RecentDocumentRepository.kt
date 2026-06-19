package com.lofficeviewer.app.data

import android.content.Context
import android.net.Uri

class RecentDocumentRepository(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun add(document: ViewerDocument) {
        val current = list().toMutableList()
        current.removeAll { it.uriString == document.uriString }
        current.add(0, document)
        val trimmed = current.take(MAX)
        prefs.edit()
            .putString(KEY, trimmed.joinToString(SEP) { "${it.uriString}|${it.displayName}|${it.format.name}" })
            .apply()
    }

    fun list(): List<ViewerDocument> {
        val raw = prefs.getString(KEY, null) ?: return emptyList()
        return raw.split(SEP).mapNotNull { entry ->
            val parts = entry.split("|", limit = 3)
            if (parts.size < 3) return@mapNotNull null
            val format = runCatching { DocumentFormat.valueOf(parts[2]) }.getOrDefault(DocumentFormat.UNKNOWN)
            ViewerDocument(parts[0], parts[1], format)
        }
    }

    companion object {
        private const val PREFS = "loffice_viewer_recent"
        private const val KEY = "recent"
        private const val SEP = "\u001E"
        private const val MAX = 20

        fun resolveDisplayName(context: Context, uri: Uri): String {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (idx >= 0 && cursor.moveToFirst()) {
                    return cursor.getString(idx) ?: uri.lastPathSegment ?: "document"
                }
            }
            return uri.lastPathSegment?.substringAfterLast('/') ?: "document"
        }
    }
}
