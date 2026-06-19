package com.lofficeviewer.app.viewer

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun HwpWebViewerScreen(
    context: Context,
    uri: Uri,
    fileName: String,
    modifier: Modifier = Modifier,
    onPageCount: (Int) -> Unit = {},
) {
    var loading by remember { mutableStateOf(true) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var base64 by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uri) {
        loading = true
        base64 = withContext(Dispatchers.IO) {
            context.contentResolver.openInputStream(uri)?.use { input ->
                val buffer = ByteArrayOutputStream()
                input.copyTo(buffer)
                Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP)
            }
        }
        loading = false
    }

    LaunchedEffect(base64, webViewRef) {
        val data = base64 ?: return@LaunchedEffect
        val wv = webViewRef ?: return@LaunchedEffect
        val escapedName = fileName.replace("'", "\\'")
        wv.evaluateJavascript("window.renderHwpBase64('$data', '$escapedName');", null)
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    settings.javaScriptEnabled = true
                    settings.allowFileAccess = true
                    settings.allowFileAccessFromFileURLs = true
                    settings.domStorageEnabled = true
                    settings.builtInZoomControls = true
                    settings.displayZoomControls = false
                    settings.useWideViewPort = true
                    settings.loadWithOverviewMode = true
                    addJavascriptInterface(object {
                        @JavascriptInterface fun onRenderComplete(count: Int) { onPageCount(count.coerceAtLeast(1)) }
                        @JavascriptInterface fun onRenderError(msg: String) { onPageCount(1) }
                    }, "AndroidBridge")
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            webViewRef = view
                        }
                    }
                    loadUrl("file:///android_asset/viewers/hwp/index.html")
                }
            },
            update = { webViewRef = it },
        )
        if (loading) {
            CircularProgressIndicator(Modifier.align(Alignment.Center))
        }
    }
}
