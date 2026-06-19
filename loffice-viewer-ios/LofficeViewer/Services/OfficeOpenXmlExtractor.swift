import Foundation

enum OfficeOpenXmlExtractor {
    static func extractDocx(data: Data, fileName: String) -> String {
        guard let xmlData = ZipReader.readEntries(from: data)?.first(where: { $0.name == "word/document.xml" })?.data,
              let xml = String(data: xmlData, encoding: .utf8) else {
            return wrapHtml(kind: "Word", fileName: fileName, body: "<p>문서를 읽을 수 없습니다.</p>")
        }
        let texts = extractTaggedText(xml: xml, tag: "w:t")
        let body = texts.isEmpty ? "<p>본문 없음</p>" : texts.map { "<p>\(escape($0))</p>" }.joined()
        return wrapHtml(kind: "Word", fileName: fileName, body: body)
    }

    static func extractPptx(data: Data, fileName: String) -> String {
        guard let entries = ZipReader.readEntries(from: data) else {
            return wrapHtml(kind: "PowerPoint", fileName: fileName, body: "<p>파일 오류</p>")
        }
        var slides: [String] = []
        let slideEntries = entries.filter { $0.name.hasPrefix("ppt/slides/slide") && $0.name.hasSuffix(".xml") }.sorted { $0.name < $1.name }
        for (idx, entry) in slideEntries.enumerated() {
            guard let xml = String(data: entry.data, encoding: .utf8) else { continue }
            let texts = extractTaggedText(xml: xml, tag: "a:t")
            if !texts.isEmpty {
                slides.append("<h3>슬라이드 \(idx + 1)</h3>" + texts.map { "<p>\(escape($0))</p>" }.joined())
            }
        }
        let body = slides.isEmpty ? "<p>슬라이드 텍스트 없음</p>" : slides.joined()
        return wrapHtml(kind: "PowerPoint", fileName: fileName, body: body)
    }

    static func extractXlsx(data: Data, fileName: String) -> String {
        guard let entries = ZipReader.readEntries(from: data) else {
            return wrapHtml(kind: "Excel", fileName: fileName, body: "<p>파일 오류</p>")
        }
        var shared: [String] = []
        if let sharedData = entries.first(where: { $0.name == "xl/sharedStrings.xml" })?.data,
           let xml = String(data: sharedData, encoding: .utf8) {
            shared = extractTaggedText(xml: xml, tag: "t")
        }
        var sheets: [String] = []
        for entry in entries where entry.name.hasPrefix("xl/worksheets/sheet") && entry.name.hasSuffix(".xml") {
            guard let xml = String(data: entry.data, encoding: .utf8) else { continue }
            let rows = extractSheetRows(xml: xml, shared: shared)
            if !rows.isEmpty {
                let name = (entry.name as NSString).lastPathComponent.replacingOccurrences(of: ".xml", with: "")
                sheets.append(buildTable(name: name, rows: rows))
            }
        }
        let body = sheets.isEmpty ? "<p>시트 데이터 없음</p>" : sheets.joined()
        return wrapHtml(kind: "Excel", fileName: fileName, body: body)
    }

    private static func extractTaggedText(xml: String, tag: String) -> [String] {
        let pattern = #"<(?:[\w-]+:)?\#(tag)\b[^>]*>([\s\S]*?)</(?:[\w-]+:)?\#(tag)>"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return [] }
        var results: [String] = []
        let range = NSRange(xml.startIndex..., in: xml)
        regex.enumerateMatches(in: xml, range: range) { match, _, _ in
            guard let m = match, m.numberOfRanges > 1, let r = Range(m.range(at: 1), in: xml) else { return }
            let t = String(xml[r]).replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
            if !t.isEmpty { results.append(t) }
        }
        return results
    }

    private static func extractSheetRows(xml: String, shared: [String]) -> [[String]] {
        var rows: [[String]] = []
        let rowPattern = #"<(?:[\w-]+:)?row\b[^>]*>[\s\S]*?</(?:[\w-]+:)?row>"#
        guard let rowRegex = try? NSRegularExpression(pattern: rowPattern, options: [.caseInsensitive]) else { return [] }
        rowRegex.enumerateMatches(in: xml, range: NSRange(xml.startIndex..., in: xml)) { match, _, _ in
            guard let m = match, let rowRange = Range(m.range, in: xml) else { return }
            let rowXml = String(xml[rowRange])
            var cells: [String] = []
            let cellPattern = #"<(?:[\w-]+:)?c\b[^>]*>[\s\S]*?</(?:[\w-]+:)?c>"#
            if let cellRegex = try? NSRegularExpression(pattern: cellPattern, options: [.caseInsensitive]) {
                cellRegex.enumerateMatches(in: rowXml, range: NSRange(rowXml.startIndex..., in: rowXml)) { cm, _, _ in
                    guard let cm, let cr = Range(cm.range, in: rowXml) else { return }
                    let cell = String(rowXml[cr])
                    let inline = extractTaggedText(xml: cell, tag: "t").joined()
                    if !inline.isEmpty {
                        cells.append(inline)
                    } else if let tMatch = cell.range(of: #"t="(\d+)""#, options: .regularExpression),
                              let idx = Int(cell[tMatch].filter(\.isNumber)),
                              idx < shared.count {
                        cells.append(shared[idx])
                    }
                }
            }
            if !cells.isEmpty { rows.append(cells) }
        }
        return Array(rows.prefix(100))
    }

    private static func buildTable(name: String, rows: [[String]]) -> String {
        var html = "<h3>\(escape(name))</h3><table border='1' cellpadding='6' style='border-collapse:collapse;width:100%;font-size:13px;'>"
        for row in rows.prefix(100) {
            html += "<tr>" + row.map { "<td>\(escape($0))</td>" }.joined() + "</tr>"
        }
        return html + "</table>"
    }

    private static func wrapHtml(kind: String, fileName: String, body: String) -> String {
        """
        <!DOCTYPE html><html><head><meta charset='utf-8'/>
        <meta name='viewport' content='width=device-width,initial-scale=1'/>
        <style>
        body{font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;line-height:1.75;padding:16px;}
        .meta{font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;margin-bottom:12px;padding-bottom:8px;}
        h3{color:#2b579a;font-size:14px;} table{margin:12px 0;}
        </style></head><body>
        <div class='meta'>\(kind) · \(escape(fileName))</div>\(body)</body></html>
        """
    }

    private static func escape(_ t: String) -> String {
        t.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
    }
}
