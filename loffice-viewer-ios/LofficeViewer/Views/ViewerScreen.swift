import SwiftUI

struct ViewerScreen: View {
    let document: ViewerDocument
    let onBack: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                    Text("뒤로")
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(document.displayName)
                        .font(.subheadline.bold())
                        .lineLimit(1)
                    Text(document.format.label)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.85))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(LofficeTheme.teal)
            .foregroundStyle(.white)

            DocumentViewerRouter(document: document)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            Text("LoBooK 엔진 · 광고 없음")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .padding(.vertical, 8)
        }
        .navigationBarHidden(true)
    }
}

struct DocumentViewerRouter: View {
    let document: ViewerDocument
    @State private var error: String?

    var body: some View {
        Group {
            switch document.format {
            case .pdf:
                PdfViewerView(url: document.url)
            case .txt:
                TextViewerView(url: document.url)
            case .hwp:
                HwpWebViewerView(url: document.url, fileName: document.displayName)
            case .hwpx, .docx, .pptx, .xlsx:
                HtmlPreviewView(url: document.url, format: document.format, fileName: document.displayName)
            case .unknown:
                ContentUnavailableView("지원하지 않는 형식", systemImage: "doc.questionmark", description: Text(document.displayName))
            }
        }
    }
}

struct HtmlPreviewView: View {
    let url: URL
    let format: DocumentFormat
    let fileName: String
    @State private var html: String?
    @State private var loading = true

    var body: some View {
        Group {
            if loading {
                ProgressView("문서 불러오는 중…")
            } else if let html {
                WebHtmlView(html: html)
            } else {
                ContentUnavailableView("열기 실패", systemImage: "exclamationmark.triangle")
            }
        }
        .task { await load() }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url) else { return }
        switch format {
        case .hwpx:
            html = HwpxExtractor.extract(data: data).html
        case .docx:
            html = OfficeOpenXmlExtractor.extractDocx(data: data, fileName: fileName)
        case .pptx:
            html = OfficeOpenXmlExtractor.extractPptx(data: data, fileName: fileName)
        case .xlsx:
            html = OfficeOpenXmlExtractor.extractXlsx(data: data, fileName: fileName)
        default:
            break
        }
    }
}
