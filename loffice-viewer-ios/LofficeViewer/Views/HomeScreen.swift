import SwiftUI

struct HomeScreen: View {
    let recent: [ViewerDocument]
    let onSelect: (ViewerDocument) -> Void
    let onOpenPicker: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let logo = UIImage(named: "looffice_logo") {
                    Image(uiImage: logo)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 36)
                } else {
                    Text("LOFFICE")
                        .font(.title2.bold())
                        .foregroundStyle(LofficeTheme.teal)
                }

                Text("광고 없는 무료 오피스 문서 뷰어")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("HWP · HWPX · PDF · Word · PPT · Excel · TXT")
                    .font(.caption)
                    .foregroundStyle(LofficeTheme.blue)

                Button(action: onOpenPicker) {
                    Label("파일 열기", systemImage: "folder")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(LofficeTheme.teal)

                Text("최근 문서")
                    .font(.headline)

                if recent.isEmpty {
                    Text("최근 연 문서가 없습니다.\n파일 앱에서 문서를 공유하거나 「파일 열기」를 사용하세요.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    ForEach(recent) { doc in
                        Button {
                            onSelect(doc)
                        } label: {
                            HStack {
                                Image(systemName: "doc.text")
                                    .foregroundStyle(LofficeTheme.teal)
                                VStack(alignment: .leading) {
                                    Text(doc.displayName).lineLimit(1)
                                    Text(doc.format.label).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                            }
                            .padding(12)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(20)
        }
        .navigationTitle("로피스뷰어")
        .navigationBarTitleDisplayMode(.inline)
    }
}

enum LofficeTheme {
    static let teal = Color(red: 0.05, green: 0.45, blue: 0.47)
    static let blue = Color(red: 0.17, green: 0.34, blue: 0.60)
}
