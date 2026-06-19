package com.lofficeviewer.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.lofficeviewer.app.data.DocumentFormat
import com.lofficeviewer.app.data.RecentDocumentRepository
import com.lofficeviewer.app.data.ViewerDocument
import com.lofficeviewer.app.ui.HomeScreen
import com.lofficeviewer.app.ui.ViewerScreen
import com.lofficeviewer.app.ui.rememberDocumentPicker
import com.lofficeviewer.app.ui.theme.LofficeViewerTheme

class MainActivity : ComponentActivity() {
    private lateinit var recentRepo: RecentDocumentRepository
    private var pendingUri: Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        recentRepo = RecentDocumentRepository(this)
        pendingUri = intent?.data

        setContent {
            LofficeViewerTheme {
                var currentDocument by remember { mutableStateOf<ViewerDocument?>(null) }
                val recentDocuments = remember { mutableStateListOf<ViewerDocument>() }

                fun refreshRecent() {
                    recentDocuments.clear()
                    recentDocuments.addAll(recentRepo.list())
                }

                fun openUri(uri: Uri) {
                    persistReadPermission(uri)
                    val name = RecentDocumentRepository.resolveDisplayName(this@MainActivity, uri)
                    val format = resolveFormat(uri, name)
                    val doc = ViewerDocument(uri.toString(), name, format)
                    recentRepo.add(doc)
                    refreshRecent()
                    currentDocument = doc
                }

                LaunchedEffect(Unit) { refreshRecent() }

                LaunchedEffect(pendingUri) {
                    pendingUri?.let { uri ->
                        openUri(uri)
                        pendingUri = null
                    }
                }

                val picker = rememberDocumentPicker { uri -> openUri(uri) }

                val doc = currentDocument
                if (doc != null) {
                    ViewerScreen(
                        uri = Uri.parse(doc.uriString),
                        displayName = doc.displayName,
                        format = doc.format,
                        onBack = { currentDocument = null },
                    )
                } else {
                    HomeScreen(
                        recentDocuments = recentDocuments,
                        onOpenPicker = {
                            picker.launch(
                                arrayOf(
                                    "application/pdf",
                                    "text/plain",
                                    "text/*",
                                    "application/msword",
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                    "application/x-hwp",
                                    "application/hwp+zip",
                                    "application/vnd.hancom.hwpx",
                                    "*/*",
                                ),
                            )
                        },
                        onOpenDocument = { item -> currentDocument = item },
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingUri = intent.data
        intent.data?.let { uri ->
            // Compose state will pick up via recreate if needed
            if (!isFinishing) recreate()
        }
    }

    private fun persistReadPermission(uri: Uri) {
        if (uri.scheme != "content") return
        runCatching {
            contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    private fun resolveFormat(uri: Uri, name: String): DocumentFormat =
        DocumentFormat.fromFileName(name).takeIf { it != DocumentFormat.UNKNOWN }
            ?: DocumentFormat.fromMimeType(contentResolver.getType(uri))
            ?: DocumentFormat.UNKNOWN
}
