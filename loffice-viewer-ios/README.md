# 로피스뷰어 iOS

**Bundle ID:** `com.lofficeviewer.app`  
**앱 이름:** 로피스뷰어  
**최소 iOS:** 16.0

Android `loffice-viewer`와 동일한 LoBooK 문서 엔진 기반 **무료·광고 없음** 오피스 뷰어입니다.

## 지원 형식

| 형식 | iOS 구현 |
|------|----------|
| PDF | PDFKit |
| TXT/MD/CSV | SwiftUI Text |
| HWP | WKWebView + RHWP WASM |
| HWPX | Swift ZIP/XML 추출 → WebView |
| DOCX/PPTX/XLSX | OOXML 경량 파서 → WebView |

## Mac에서 빌드 (필수)

> iOS 앱은 **macOS + Xcode**에서만 빌드·서명 가능합니다.

### 1. XcodeGen 설치 (최초 1회)

```bash
brew install xcodegen
```

### 2. 프로젝트 생성

```bash
cd loffice-viewer-ios
xcodegen generate
open LofficeViewer.xcodeproj
```

### 3. Xcode 설정

1. **Signing & Capabilities** → Team 선택 (Apple Developer 계정)
2. Product → **Archive** → App Store Connect 업로드

### 4. 시뮬레이터 실행

Xcode에서 iPhone 15 시뮬레이터 선택 → Run (⌘R)

## App Store

- 등록 문구: `docs/APP_STORE_LISTING.md`
- 체크리스트: `docs/APP_STORE_CONNECT.md`

## RHWP 에셋 갱신

```bash
cp ../loffice-viewer/app/src/main/assets/viewers/hwp/* Resources/hwp/
```
