import Foundation
import Compression

enum HwpxExtractor {
    struct Result {
        let html: String
        let sectionCount: Int
        let charCount: Int
    }

    static func extract(data: Data) -> Result {
        var sections: [[String]] = []
        var images: [(mime: String, base64: String)] = []

        guard let entries = ZipReader.readEntries(from: data) else {
            return Result(html: wrapHtml(kind: "HWPX", body: "<p>ZIP을 읽을 수 없습니다.</p>"), sectionCount: 1, charCount: 0)
        }

        for entry in entries {
            let name = entry.name
            if name.localizedCaseInsensitiveContains("section"), name.lowercased().hasSuffix(".xml") {
                let xml = String(data: entry.data, encoding: .utf8) ?? ""
                let paras = extractParagraphs(from: xml)
                if !paras.isEmpty { sections.append(paras) }
            }
            if let mime = imageMime(path: name),
               name.localizedCaseInsensitiveContains("image") || name.localizedCaseInsensitiveContains("bindata") || name.localizedCaseInsensitiveContains("picture") {
                images.append((mime, entry.data.base64EncodedString()))
            }
        }

        let html = buildHtml(sections: sections, images: images)
        let charCount = sections.flatMap { $0 }.joined(separator: "\n").count
        return Result(html: html, sectionCount: max(sections.count, 1), charCount: charCount)
    }

    private static func buildHtml(sections: [[String]], images: [(mime: String, base64: String)]) -> String {
        var body = "<div class='meta'>HWPX · \(max(sections.count, 1))섹션</div>"
        if sections.isEmpty {
            body += "<p>추출된 본문이 없습니다.</p>"
        } else {
            for (i, paras) in sections.enumerated() {
                if sections.count > 1 { body += "<h3>섹션 \(i + 1)</h3>" }
                for p in paras { body += "<p>\(escape(p))</p>" }
            }
        }
        for img in images.prefix(24) {
            body += "<img src='data:\(img.mime);base64,\(img.base64)' alt=''/>"
        }
        return wrapHtml(kind: "HWPX", body: body)
    }

    static func extractParagraphs(from xml: String) -> [String] {
        var paragraphs: [String] = []
        let pPattern = #"<(?:[\w-]+:)?p\b[^>]*>[\s\S]*?</(?:[\w-]+:)?p>"#
        if let regex = try? NSRegularExpression(pattern: pPattern, options: [.caseInsensitive]) {
            let range = NSRange(xml.startIndex..., in: xml)
            regex.enumerateMatches(in: xml, range: range) { match, _, _ in
                guard let m = match, let r = Range(m.range, in: xml) else { return }
                let text = stripTags(String(xml[r]))
                if !text.isEmpty { paragraphs.append(text) }
            }
        }
        if paragraphs.isEmpty {
            let tPattern = #"<(?:[\w-]+:)?t\b[^>]*>([\s\S]*?)</(?:[\w-]+:)?t>"#
            if let regex = try? NSRegularExpression(pattern: tPattern, options: [.caseInsensitive]) {
                let range = NSRange(xml.startIndex..., in: xml)
                regex.enumerateMatches(in: xml, range: range) { match, _, _ in
                    guard let m = match, m.numberOfRanges > 1, let r = Range(m.range(at: 1), in: xml) else { return }
                    let text = stripTags(String(xml[r]))
                    if !text.isEmpty { paragraphs.append(text) }
                }
            }
        }
        return paragraphs
    }

    private static func imageMime(path: String) -> String? {
        switch (path as NSString).pathExtension.lowercased() {
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "gif": return "image/gif"
        case "webp": return "image/webp"
        default: return nil
        }
    }

    private static func stripTags(_ s: String) -> String {
        decodeXml(s.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func decodeXml(_ s: String) -> String {
        s.replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&quot;", with: "\"")
    }

    private static func escape(_ t: String) -> String {
        t.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
    }

    private static func wrapHtml(kind: String, body: String) -> String {
        """
        <!DOCTYPE html><html><head><meta charset='utf-8'/>
        <meta name='viewport' content='width=device-width,initial-scale=1'/>
        <style>
        body{font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;line-height:1.75;color:#1e293b;padding:16px;background:#fff;}
        .meta{font-size:11px;color:#64748b;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;}
        p{margin:0 0 12px;} img{max-width:100%;height:auto;}
        </style></head><body><div class='meta'>\(kind)</div>\(body)</body></html>
        """
    }
}

/// Minimal ZIP reader for HWPX / OOXML
enum ZipReader {
    struct Entry { let name: String; let data: Data }

    static func readEntries(from data: Data) -> [Entry]? {
        var entries: [Entry] = []
        var offset = 0
        while offset + 30 < data.count {
            guard data[offset] == 0x50, data[offset + 1] == 0x4b,
                  data[offset + 2] == 0x03, data[offset + 3] == 0x04 else { break }
            let compSize = Int(data.readUInt32(at: offset + 18))
            let uncompSize = Int(data.readUInt32(at: offset + 22))
            let nameLen = Int(data.readUInt16(at: offset + 26))
            let extraLen = Int(data.readUInt16(at: offset + 28))
            let nameStart = offset + 30
            guard nameStart + nameLen <= data.count else { break }
            let nameData = data.subdata(in: nameStart ..< nameStart + nameLen)
            let name = String(data: nameData, encoding: .utf8) ?? ""
            let dataStart = nameStart + nameLen + extraLen
            let dataEnd = dataStart + compSize
            guard dataEnd <= data.count else { break }
            let compressed = data.subdata(in: dataStart ..< dataEnd)
            let uncompressed: Data
            if compSize == uncompSize {
                uncompressed = compressed
            } else if let d = decompress(compressed, expectedSize: uncompSize) {
                uncompressed = d
            } else {
                offset = dataEnd
                continue
            }
            if !name.hasSuffix("/") { entries.append(Entry(name: name, data: uncompressed)) }
            offset = dataEnd
        }
        return entries.isEmpty ? nil : entries
    }

    private static func decompress(_ src: Data, expectedSize: Int) -> Data? {
        let dstCap = max(expectedSize, src.count * 4)
        var dst = Data(count: dstCap)
        let result = dst.withUnsafeMutableBytes { dstPtr in
            src.withUnsafeBytes { srcPtr in
                compression_decode_buffer(
                    dstPtr.bindMemory(to: UInt8.self).baseAddress!, dstCap,
                    srcPtr.bindMemory(to: UInt8.self).baseAddress!, src.count,
                    nil, COMPRESSION_ZLIB
                )
            }
        }
        guard result > 0 else { return nil }
        return dst.prefix(result)
    }
}

private extension Data {
    func readUInt16(at i: Int) -> UInt16 {
        UInt16(self[i]) | (UInt16(self[i + 1]) << 8)
    }
    func readUInt32(at i: Int) -> UInt32 {
        UInt32(self[i]) | (UInt32(self[i + 1]) << 8) | (UInt32(self[i + 2]) << 16) | (UInt32(self[i + 3]) << 24)
    }
}
