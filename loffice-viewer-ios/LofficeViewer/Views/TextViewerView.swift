import SwiftUI

struct TextViewerView: View {
    let url: URL
    @State private var text = ""

    var body: some View {
        ScrollView {
            Text(text)
                .font(.system(.body, design: .monospaced))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
        }
        .background(Color.white)
        .task { load() }
    }

    private func load() {
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }
        if let data = try? Data(contentsOf: url) {
            text = String(data: data, encoding: .utf8) ?? "(UTF-8 디코딩 실패)"
        }
    }
}
