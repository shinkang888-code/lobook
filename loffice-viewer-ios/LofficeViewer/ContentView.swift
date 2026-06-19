import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var showPicker = false
    @State private var selectedDoc: ViewerDocument?

    var body: some View {
        NavigationStack {
            Group {
                if let doc = selectedDoc {
                    ViewerScreen(document: doc) {
                        selectedDoc = nil
                    }
                } else {
                    HomeScreen(recent: store.recent) { doc in
                        selectedDoc = doc
                    } onOpenPicker: {
                        showPicker = true
                    }
                }
            }
        }
        .fileImporter(
            isPresented: $showPicker,
            allowedContentTypes: [.pdf, .plainText, .data, .item],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                openURL(url)
            case .failure:
                break
            }
        }
        .onOpenURL { url in
            openURL(url)
        }
    }

    private func openURL(_ url: URL) {
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        let name = url.lastPathComponent
        let format = DocumentFormat.from(fileName: name)
        let doc = ViewerDocument(url: url, displayName: name, format: format)
        store.addRecent(doc)
        selectedDoc = doc
    }
}
