import SwiftUI
import WebKit

struct WebHtmlView: UIViewRepresentable {
    let html: String

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.isOpaque = false
        webView.backgroundColor = .white
        webView.loadHTMLString(html, baseURL: nil)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        uiView.loadHTMLString(html, baseURL: nil)
    }
}

struct HwpWebViewerView: View {
    let url: URL
    let fileName: String
    @State private var loading = true

    var body: some View {
        ZStack {
            HwpWebRepresentable(url: url, fileName: fileName) {
                loading = false
            }
            if loading {
                ProgressView("HWP Canvas 렌더링 중…")
            }
        }
    }
}

struct HwpWebRepresentable: UIViewRepresentable {
    let url: URL
    let fileName: String
    let onLoaded: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onLoaded: onLoaded) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .white
        if let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "hwp") {
            webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        }
        context.coordinator.webView = webView
        context.coordinator.pendingURL = url
        context.coordinator.pendingName = fileName
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        var webView: WKWebView?
        var pendingURL: URL?
        var pendingName: String?
        let onLoaded: () -> Void

        init(onLoaded: @escaping () -> Void) { self.onLoaded = onLoaded }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            guard let fileURL = pendingURL, let name = pendingName else { return }
            let accessed = fileURL.startAccessingSecurityScopedResource()
            defer { if accessed { fileURL.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: fileURL) else { return }
            let b64 = data.base64EncodedString()
            let escaped = name.replacingOccurrences(of: "'", with: "\\'")
            webView.evaluateJavaScript("window.renderHwpBase64('\(b64)', '\(escaped)');") { _, _ in
                self.onLoaded()
            }
        }
    }
}
