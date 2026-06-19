package com.lofficeviewer.app.viewer

import android.content.Context
import android.net.Uri
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.lofficeviewer.app.data.DocumentFormat
import com.lofficeviewer.app.extract.HwpxExtractor
import com.lofficeviewer.app.extract.OfficeOpenXmlExtractor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun DocumentViewerRouter(
    context: Context,
    uri: Uri,
    displayName: String,
    format: DocumentFormat,
    modifier: Modifier = Modifier,
    onPageCount: (Int) -> Unit = {},
) {
    when (format) {
        DocumentFormat.PDF -> PdfViewerScreen(context, uri, modifier, onPageCount)
        DocumentFormat.TXT -> TextViewerScreen(context, uri, modifier, onPageCount)
        DocumentFormat.HWP -> HwpWebViewerScreen(context, uri, displayName, modifier, onPageCount)
        DocumentFormat.HWPX -> HtmlExtractViewer(context, uri, format, modifier, onPageCount)
        DocumentFormat.DOCX -> HtmlExtractViewer(context, uri, format, modifier, onPageCount)
        DocumentFormat.PPTX -> HtmlExtractViewer(context, uri, format, modifier, onPageCount)
        DocumentFormat.XLSX -> HtmlExtractViewer(context, uri, format, modifier, onPageCount)
        DocumentFormat.UNKNOWN -> UnsupportedViewer(displayName, modifier)
    }
}

@Composable
private fun HtmlExtractViewer(
    context: Context,
    uri: Uri,
    format: DocumentFormat,
    modifier: Modifier = Modifier,
    onPageCount: (Int) -> Unit = {},
) {
    var html by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val displayName = remember(uri) {
        uri.lastPathSegment ?: "document"
    }

    LaunchedEffect(uri, format) {
        loading = true
        withContext(Dispatchers.IO) {
            runCatching {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    val bytes = stream.readBytes()
                    val result = when (format) {
                        DocumentFormat.HWPX -> HwpxExtractor.extract(bytes).html
                        DocumentFormat.DOCX -> OfficeOpenXmlExtractor.extractDocx(bytes, displayName).html
                        DocumentFormat.PPTX -> OfficeOpenXmlExtractor.extractPptx(bytes, displayName).html
                        DocumentFormat.XLSX -> OfficeOpenXmlExtractor.extractXlsx(bytes, displayName).html
                        else -> error("지원하지 않는 형식")
                    }
                    html = result
                    onPageCount(1)
                } ?: error("파일을 읽을 수 없습니다.")
            }.onFailure {
                error = it.message
            }
            loading = false
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        when {
            loading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
            error != null -> Text(error!!, Modifier.align(Alignment.Center))
            html != null -> WebHtmlViewerScreen(html!!)
        }
    }
}

@Composable
private fun UnsupportedViewer(fileName: String, modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text = "지원하지 않는 형식입니다.\n$fileName",
            color = MaterialTheme.colorScheme.error,
        )
    }
}
