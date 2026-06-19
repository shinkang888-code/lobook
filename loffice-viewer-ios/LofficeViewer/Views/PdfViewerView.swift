import SwiftUI
import PDFKit

struct PdfViewerView: View {
    let url: URL

    var body: some View {
        PDFKitRepresentable(url: url)
            .background(Color.white)
    }
}

struct PDFKitRepresentable: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.backgroundColor = .white
        let accessed = url.startAccessingSecurityScopedResource()
        if accessed {
            view.document = PDFDocument(url: url)
            url.stopAccessingSecurityScopedResource()
        } else {
            view.document = PDFDocument(url: url)
        }
        return view
    }

    func updateUIView(_ uiView: PDFView, context: Context) {}
}
