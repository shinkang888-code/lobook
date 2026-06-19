# 로피스뷰어 iOS — App Store 출시 패키지

## 포함 내용

| 항목 | 설명 |
|------|------|
| `LofficeViewer/` | SwiftUI 소스 (뷰어·추출기) |
| `Resources/` | RHWP WASM, 앱 아이콘, Loffice 로고 |
| `project.yml` | XcodeGen 프로젝트 정의 |
| `docs/` | App Store 등록 문구·체크리스트 |
| `README.md` | Mac 빌드 방법 |

## Mac에서 IPA 빌드 (3단계)

```bash
brew install xcodegen
cd loffice-viewer-ios
xcodegen generate
open LofficeViewer.xcodeproj
```

Xcode → Signing Team 선택 → Product → **Archive** → App Store Connect 업로드

## 중요

- **Windows에서는 .ipa를 만들 수 없습니다.** Mac + Xcode + Apple Developer 계정이 필요합니다.
- Bundle ID: `com.lofficeviewer.app` (Android와 동일)

생성일: 2026-06-19
