# 로피스뷰어 (Loffice Viewer)

**패키지:** `com.lofficeviewer.app`  
**한글명:** 로피스뷰어  
**유형:** 광고 없는 무료 오피스 문서 뷰어 (Android)

LoBooK([lobook](https://github.com/shinkang888-code/lobook)) 편집기에서 사용하는 엔진·UI 패턴을 기반으로, **보기 전용** Android 앱입니다.

## 지원 형식

| 형식 | 엔진 | 구현 |
|------|------|------|
| **PDF** | Android `PdfRenderer` | 네이티브 페이지 렌더 + 핀치 줌 |
| **HWP** | [@rhwp/core](https://github.com/edwardkim/rhwp) WASM | WebView + `rhwp_bg.wasm` (LoBooK `RhwpCanvasViewer` 동일) |
| **HWPX** | hwpx-contents-extract 포팅 | Kotlin ZIP/XML → HTML WebView |
| **Word** (.docx) | OOXML 경량 파서 | `word/document.xml` 텍스트 추출 |
| **PowerPoint** (.pptx) | OOXML 경량 파서 | 슬라이드별 `a:t` 텍스트 |
| **Excel** (.xlsx) | OOXML 경량 파서 | 시트 테이블 프리뷰 |
| **TXT/MD/CSV** | UTF-8 | 네이티브 스크롤 텍스트 |

> `.doc` / `.ppt` / `.xls` (구형 바이너리)는 제한적 지원. Play Store 설명에 명시 권장.

## 빌드

1. [Android Studio](https://developer.android.com/studio) Ladybug 이상 설치
2. `loffice-viewer/` 폴더를 **Open**
3. Gradle Sync 후 **Run** (또는 Release APK/AAB 빌드)

### RHWP 에셋 갱신 (LoBooK 루트에서)

```powershell
cd c:\cursor\book
npm install
.\loffice-viewer\scripts\copy-viewer-assets.ps1
```

## Google Play Console 등록

| 항목 | 값 |
|------|-----|
| 앱 이름 | 로피스뷰어 |
| 패키지 | com.lofficeviewer.app |
| 카테고리 | 생산성 |
| 광고 | 없음 |
| 인앱 결제 | 없음 |
| 데이터 수집 | 로컬만 (서버 전송 없음) |

상세 체크리스트: [docs/PLAY_CONSOLE.md](docs/PLAY_CONSOLE.md)  
아키텍처: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 라이선스

- RHWP: MIT (@rhwp/core)
- HWPX 추출: Apache-2.0 (hancom-io/hwpx-contents-extract 포팅)
- 앱 UI/코드: LoBooK 프로젝트와 동일 리포
