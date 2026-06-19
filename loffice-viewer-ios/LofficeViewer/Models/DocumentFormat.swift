import Foundation

enum DocumentFormat: String, Codable, CaseIterable {
    case pdf = "PDF"
    case txt = "텍스트"
    case docx = "Word"
    case pptx = "PowerPoint"
    case xlsx = "Excel"
    case hwp = "HWP"
    case hwpx = "HWPX"
    case unknown = "기타"

    var label: String { rawValue }

    static func from(fileName: String) -> DocumentFormat {
        let lower = fileName.lowercased()
        if lower.hasSuffix(".pdf") { return .pdf }
        if [".txt", ".md", ".markdown", ".csv", ".log", ".json", ".xml"].contains(where: { lower.hasSuffix($0) }) { return .txt }
        if lower.hasSuffix(".docx") || lower.hasSuffix(".doc") { return .docx }
        if lower.hasSuffix(".pptx") || lower.hasSuffix(".ppt") { return .pptx }
        if lower.hasSuffix(".xlsx") || lower.hasSuffix(".xls") { return .xlsx }
        if lower.hasSuffix(".hwpx") { return .hwpx }
        if lower.hasSuffix(".hwp") { return .hwp }
        return .unknown
    }
}

struct ViewerDocument: Identifiable, Codable, Equatable {
    var id: String { url.absoluteString }
    let url: URL
    let displayName: String
    let format: DocumentFormat

    enum CodingKeys: String, CodingKey {
        case url, displayName, format
    }
}

@MainActor
final class DocumentStore: ObservableObject {
    @Published private(set) var recent: [ViewerDocument] = []
    private let key = "loffice.recent"

    init() {
        load()
    }

    func addRecent(_ doc: ViewerDocument) {
        recent.removeAll { $0.url == doc.url }
        recent.insert(doc, at: 0)
        recent = Array(recent.prefix(20))
        save()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([ViewerDocument].self, from: data) else { return }
        recent = decoded
    }

    private func save() {
        if let data = try? JSONEncoder().encode(recent) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
