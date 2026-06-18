# Book Studio — 오픈소스 편집 엔진 통합 업그레이드 설계서 v1.0

> **문서 버전:** v1.0  
> **작성일:** 2026-06-17  
> **대상:** `shinkang888-code/book` (Book Studio Pro)  
> **선행 문서:** `EDITOR_UPGRADE_DEV_SPEC_v1.md`, `EDITOR_FIX_DEV_SPEC_v1.md`, `UI_DESIGN_SPEC_POLARIS_v1.md`  
> **목적:** GitHub `shinkang888-code` 계정 및 로컬 연동 리포에 보유한 **WORD·PDF·HTML·PPT·HWP·JPG** 등 오픈소스 편집/뷰어 자산을 전수 조사하고, 이를 **전자책 편집기 허브**에 통합하는 아키텍처·로드맵을 설계한다.

---

## 0. Executive Summary

Book Studio는 현재 **Polaris Shell UI + Markdown(Toast UI) 1종 완성** 상태이다. 동일 GitHub 조직에는 **문서 포맷별 오픈소스 20+개**가 이미 포크·개발되어 있으며, **`Loffice`가 사실상 통합 검증 허브**로 모든 엔진을 연결해 두었다.

**핵심 설계 원칙:**

1. **`book` = 전자책 제작 허브** (챕터·pageSpec·EPUB export·협업)
2. **`Loffice` = 문서 엔진 레퍼런스 구현** (뷰어/편집기 패턴 복제 소스)
3. **브라우저 우선** — Vercel static/SSR 한계 내 WASM·npm 패키지
4. **Sidecar 선택** — Python(hwpx-skill, ddddocr), Java(Stirling-PDF)는 Render/Docker 옵션
5. **Convert-then-Edit** — HWP/PPT/PDF 스캔은 HTML/MD로 변환 후 Book CDM에 저장

```
┌─────────────────────────────────────────────────────────────────┐
│                    Book Studio (book) — 허브                       │
│  Polaris Shell · chapters/pages · pageSpec · export EPUB/PDF    │
└────────────┬────────────────────────────────────────────────────┘
             │ Document Engine Adapters (npm / WASM / API)
    ┌────────┼────────┬─────────┬─────────┬─────────┬──────────┐
    ▼        ▼        ▼         ▼         ▼         ▼          ▼
 Markdown   HTML    Word      HWP       PDF       PPT       Image
 naverb    CM+EPUB  TipTap+   @rhwp/    pdf-lib+  PptxGenJS  microscope
 Toast UI  Sigil    microscope rhwp      Stirling  ppt-master renderer
           ebook              hwpx-skill  OCR       MCP
```

---

## 1. 오픈소스 리포 전수 목록

### 1.1 포맷별 분류 (Book Studio 통합 대상)

| 포맷 | GitHub 리포 | 로컬 경로 | 언어/런타임 | 핵심 역량 | Book 통합 우선순위 |
|------|------------|----------|------------|----------|-------------------|
| **전자책 허브** | [book](https://github.com/shinkang888-code/book) | `c:\cursor\book` | TS/Next.js | Polaris Shell, chapters, EPUB v2 | — (허브) |
| **Markdown** | [naverb](https://github.com/shinkang888-code/naverb) | `c:\cursor\naverb` | TS | Toast UI Editor, GFM, 차트/UML 플러그인 | **P0** ✅ 사용 중 |
| **EPUB/HTML** | [ebook](https://github.com/shinkang888-code/ebook) | `c:\cursor\ebook` | C++/Qt (Magic) | Sigil 기반 EPUB2/3 편집, OPF/Nav | **P1** TS 포팅 |
| **EPUB/HTML** | [Sigil](https://github.com/shinkang888-code/Sigil) | — | C++ | 업스트림 EPUB 에디터 (데스크톱) | **P2** 알고리즘 참조 |
| **HTML 디자인** | [huashu-design](https://github.com/shinkang888-code/huashu-design) | — | HTML/CSS | HTML-native 슬라이드·애니·MP4 | **P3** EPUB CSS 템플릿 |
| **Word (DOCX)** | [microscope-js](https://github.com/shinkang888-code/microscope-js) | `c:\cursor\microscope-js` | TS | DOCX/PDF/XLSX/PPTX **클라이언트 뷰어** | **P0** |
| **Word (DOCX)** | [DocX](https://github.com/shinkang888-code/DocX) | — | C# | Word 파일 생성/수정 (.NET) | **P4** 서버 sidecar |
| **Word (DOCX)** | [python-office](https://github.com/shinkang888-code/python-office) | — | Python | Office 자동화 | **P3** batch 변환 |
| **통합 오피스** | [Loffice](https://github.com/shinkang888-code/looffice) | `c:\cursor\looffice` | JS/Next.js | **60+ 포맷**, 모든 엔진 통합 레퍼런스 | **P0** 패턴 소스 |
| **HWP/HWPX** | [hwpreader](https://github.com/shinkang888-code/hwpreader) | `c:\cursor\hwpreader` | Rust/WASM | `@rhwp/core` 뷰어·편집, rhwp-studio | **P0** |
| **HWP/HWPX** | [hwpx-skill](https://github.com/shinkang888-code/hwpx-skill) | `c:\cursor\hwpx-skill` | Python | HWP→HWPX, MD→HWPX, 양식 복제 | **P1** sidecar |
| **HWP/HWPX** | [HANCOM](https://github.com/shinkang888-code/HANCOM) | — | PS | 한컴 설치 구조 분석 | **P4** 참조 |
| **PDF** | [Stirling-PDF](https://github.com/shinkang888-code/Stirling-PDF) | — | Java | PDF merge/split/rotate/OCR | **P1** Docker 옵션 |
| **PDF** | [opendataloader-pdf](https://github.com/shinkang888-code/opendataloader-pdf) | — | Java | AI용 PDF 파서 | **P2** import |
| **PDF** | [AndroidPdfViewer](https://github.com/shinkang888-code/AndroidPdfViewer) | — | Java/Kotlin | Pdfium Android 뷰 | **P4** Capacitor |
| **PPT/PPTX** | [ppt-master](https://github.com/shinkang888-code/ppt-master) | — | Python | AI 편집 가능 PPT, SVG 슬라이드 | **P2** |
| **PPT/PPTX** | [PptxGenJS](https://github.com/shinkang888-code/PptxGenJS) | — | JS | 브라우저 PPT **생성** | **P2** |
| **PPT/PPTX** | [Office-PowerPoint-MCP-Server](https://github.com/shinkang888-code/Office-PowerPoint-MCP-Server) | — | Python | python-pptx MCP | **P3** AI 슬라이드 |
| **Image/JPG** | microscope-js `renderer-image` | (위 동일) | TS | png/jpg/webp/svg/avif | **P0** |
| **Image/OCR** | [ddddocr](https://github.com/shinkang888-code/ddddocr) | — | Python | OCR, 스캔 PDF 텍스트 | **P2** |
| **오디오북** | [voice](https://github.com/shinkang888-code/voice) | — | — | VoiceCraft AI, TTS·오디오북 | **P3** |
| **오디오북** | [CosyVoice](https://github.com/shinkang888-code/CosyVoice) | — | Python | 다국어 TTS | **P4** |
| **Office 암호** | [msoffice](https://github.com/shinkang888-code/msoffice) | — | C++ | docx/xlsx/pptx 암·복호화 | **P3** Loffice 이식 |
| **Excel** | [excel](https://github.com/shinkang888-code/excel) | — | TS | (미확인) | **P4** 표 데이터 import |
| **범용 뷰어** | [ViewerJS](https://github.com/shinkang888-code/ViewerJS) | — | JS | PDF/ODF 브라우저 리더 | **P4** legacy |

### 1.2 통합 제외 (Book Studio 범위 외)

LawyGo, wallpilot, trading, Signal, obsidian 테마, marketing 등 **문서 편집과 무관**한 리포 80+개는 본 설계에서 제외한다.

---

## 2. Loffice — 통합 레퍼런스 아키텍처

`Loffice` README 기준, **이미 Book Studio에 필요한 모든 엔진이 연결·검증**되어 있다. Book 업그레이드는 **Loffice에서 proven 패턴을 패키지 단위로 포팅**하는 것이 최단 경로이다.

| Loffice 모듈 | 원본 OSS | Book Studio 대응 | 포팅 방식 |
|-------------|----------|------------------|----------|
| `RhwpCanvasViewer` | hwpreader | HWP 탭 | 컴포넌트 복제 |
| `RhwpEditor` / rhwp-studio | @rhwp/editor | HWP 네이티브 편집 | iframe 또는 npm |
| `DocxEditor` | @eigenpal/docx-editor-react | Word 탭 (고급) | npm 교체/병행 |
| `MicroscopeDocxViewer` | microscope-js | Word import preview | npm |
| `PdfEditorPanel` | Stirling-PDF + pdf-lib | PDF 탭 (신규) | pdf-lib 클라이언트 |
| `PptMasterViewer` | ppt-master | PPT→챕터 import | Phase 3 |
| `PptxGenJS` export | PptxGenJS | 슬라이드 export | Phase 3 |
| `extractDocumentTextClient` | ddddocr + Tesseract | PDF 스캔 OCR | API sidecar |
| `MarkdownEditor` | Toast UI | Markdown 탭 | ✅ 완료 |
| `HtmlEditor` | CodeMirror | HTML 탭 | 강화 중 |
| `LofficeLayout` | Polaris 패턴 | BookEditorShell | ✅ 완료 |

---

## 3. 포맷별 통합 설계

### 3.1 Markdown — naverb (Toast UI Editor)

**현재:** `@toast-ui/react-editor` 사용 ✅

**업그레이드:**

| 기능 | naverb 소스 | 작업 |
|------|------------|------|
| 코드 하이라이트 | `plugins/code-syntax-highlight` | npm 플러그인 추가 |
| 병합 셀 표 | `plugins/table-merged-cell` | Phase 2 |
| 차트/UML | `plugins/chart`, `plugins/uml` | 학술·기술서 Phase 3 |
| pageSpec 연동 | — | Toast preview pane에 `pageSpecToCss` |
| activePage slice | — | `---` 구분자 기반 페이지 편집 |

```typescript
// packages/editor-markdown (제안)
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
```

---

### 3.2 HTML / EPUB — CodeMirror + ebook(Sigil) + huashu-design

**3단계 모델:**

```
┌─────────────┐     import      ┌──────────────┐
│ EPUB file   │ ──────────────► │ chapters[]   │
└─────────────┘                 │ content_html │
                                │ page_spec    │
┌─────────────┐     edit        └──────┬───────┘
│ HTML Editor │ ◄──────────────────────┘
│ CodeMirror  │
└──────┬──────┘
       │ export
       ▼
┌─────────────┐
│ buildEpub   │ ◄── ebook/Sigil OPF·Nav 알고리즘 TS 포팅
└─────────────┘
```

**ebook(Magic/Sigil)에서 TS 포팅 대상:**

| Sigil/ebook 기능 | Book `src/lib/export/epub/` | 우선순위 |
|-----------------|----------------------------|----------|
| OPF manifest/spine | `buildEpub.ts` v2 ✅ | — |
| nav.xhtml TOC | `buildEpub.ts` | P1 |
| HTML well-formed lint | `HtmlEditorPanel` | P1 |
| CSS cascade / page | `pageSpecToCss` + EPUB CSS | P1 |
| MathJax 수식 | Toast/Math plugin | P2 |

**huashu-design:** HTML-native 고품질 레이아웃 템플릿 → EPUB `OEBPS/Styles/` 프리셋으로 제공.

---

### 3.3 Word (DOCX) — TipTap + microscope-js + mammoth + DocX

**현재:** mammoth import, html-to-docx export, TipTap 기본 편집

**TO-BE 파이프라인:**

```
Import DOCX ──► microscope-js preview ( fidelity check )
            ──► mammoth → content_html → TipTap/Word 탭
Edit        ──► TipTap (+ @eigenpal/docx-editor-react 옵션)
Export DOCX ──► html-to-docx (현재) 또는 DocX sidecar (고급)
```

| 엔진 | 역할 | 배포 |
|------|------|------|
| `@microscope-js/renderer-docx` | Import 전 **원본 미리보기** | npm, client |
| `mammoth` | DOCX → HTML (편집용) | npm, client |
| `@tiptap/*` | WYSIWYG 편집 | npm, client |
| `@eigenpal/docx-editor-react` | **실제 DOCX round-trip** (Loffice) | npm, client |
| `html-to-docx` | HTML → DOCX export | npm, server |
| `DocX` (.NET) | 서버 고급 DOCX 생성 | Render sidecar |

**Ribbon Insert:** TipTap Image, Table, Link extensions (Loffice `DocxEditor` ribbonMode 참조)

---

### 3.4 HWP/HWPX — hwpreader + hwpx-skill + Loffice

**현실적 3-Track 전략:**

| Track | 엔진 | 용도 | 편집 가능 |
|-------|------|------|----------|
| **A. WASM 뷰어** | `@rhwp/core` Canvas/SVG | 원본 fidelity 참조 | ❌ |
| **B. HTML 변환** | `renderPageHtml()` → Word/HTML | **1차 편집 경로** | ✅ |
| **C. 네이티브 편집** | `@rhwp/editor` rhwp-studio | Loffice `/hwp-editor` | ✅ (장기) |
| **D. HWPX 생성** | hwpx-skill Python | MD→HWPX export, 공문 양식 | △ 생성만 |

**Import Flow (TO-BE):**

```
.hwp/.hwpx upload
    ├─► Storage (book-imports) — 원본 보존
    ├─► @rhwp/core: renderPageHtml(i) → chapters[i].content_html
    ├─► primary_source: "hwp"
    └─► Word 탭 자동 전환 + "원본 HWP 보기" split
```

**hwpx-skill Sidecar API (Render):**

```
POST /convert/hwp-to-hwpx
POST /generate/hwpx-from-markdown
POST /clone-form
```

Loffice `services/hwpx-skill-api` 패턴 재사용.

---

### 3.5 PDF — Stirling-PDF + pdf-lib + opendataloader + ddddocr

**Book Studio PDF 역할:** 인쇄용 전자책 PDF export + **스캔 PDF import**

| 기능 | 엔진 | 구현 위치 |
|------|------|----------|
| EPUB→PDF | 인쇄 HTML + browser print | ✅ `/export/pdf` |
| PDF 페이지 미리보기 | `@microscope-js/renderer-pdf` | PDF 탭 (신규) |
| merge/split/rotate | pdf-lib (Loffice `stirlingMergePdfs` 등) | PDF 편집 패널 |
| Full PDF workbench | Stirling-PDF iframe | `NEXT_PUBLIC_STIRLING_PDF_URL` |
| 스캔 PDF→텍스트 | opendataloader-pdf / ddddocr OCR | Sidecar |
| PDF→챕터 | OCR text → MD/HTML | import API |

**신규 EditorMode:** `pdf` (Phase 3) — PageCanvas 내 pdf.js 페이지 + pageSpec overlay

---

### 3.6 PPT/PPTX — ppt-master + PptxGenJS + MCP

**전자책 관점:** PPT = **그림이 많은 챕터** 또는 **슬라이드형 EPUB**

| 기능 | 엔진 | Book 통합 |
|------|------|----------|
| PPTX import preview | `@microscope-js/renderer-pptx` | import dialog |
| PPTX→HTML 챕터 | ppt-master slide SVG/HTML 추출 | Phase 3 |
| 슬라이드→EPUB fixed-layout | huashu-design HTML | Phase 4 |
| PPT export | PptxGenJS | 챕터→슬라이드 deck |
| AI 슬라이드 | ppt-master / Office-PowerPoint-MCP | Phase 4 |

Loffice `PptMasterViewer`, `PptSlideEditor`, `exportSlidesToPptx` 포팅.

---

### 3.7 Image (JPG/PNG/WebP) — microscope-js + Supabase Storage

**현재:** Markdown Toast UI `uploadEditorImage` → `book-images` bucket ✅

**업그레이드:**

| 기능 | 엔진 | 작업 |
|------|------|------|
| 이미지 뷰어 | `@microscope-js/renderer-image` | asset 패널 |
| 리사이즈/크롭 | browser Canvas API | Phase 3 |
| OCR (이미지→텍스트) | ddddocr sidecar | 스캔 페이지 import |
| WebP/AVIF | renderer-image | 자동 |
| EPUB img src | Supabase public URL | ✅ |

**Cover/illus 챕터:** `primary_source: "image"` + microscope viewer

---

### 3.8 오디오북 — voice + CosyVoice (Phase 4)

| 기능 | voice 리포 | Book 통합 |
|------|-----------|----------|
| TTS 챕터 낭독 | VoiceCraft AI | `chapters.audio_url` |
| 보이스 클론 | CosyVoice | sidecar |
| EPUB3 media overlay | SMIL | export 확장 |

---

## 4. 목표 아키텍처 — Document Engine Layer

Book Studio 코드베이스에 **어댑터 레이어**를 도입하여 Shell UI와 OSS 엔진을 분리한다.

```
src/
├── components/editor/          # Polaris Shell (UI only)
├── lib/
│   ├── engines/                # ★ 신규 — OSS 어댑터
│   │   ├── markdown/           # naverb / Toast UI
│   │   ├── html/               # CodeMirror + EPUB lint
│   │   ├── word/               # TipTap + eigenpal + microscope
│   │   ├── hwp/                # @rhwp/core + rhwp-studio
│   │   ├── pdf/                # pdf-lib + pdfjs + stirling client
│   │   ├── ppt/                # ppt-master + pptxgenjs
│   │   ├── image/              # microscope renderer-image
│   │   └── registry.ts         # format → engine routing
│   ├── import/                 # ✅ 기존 — engine 호출로 확장
│   ├── export/                 # ✅ 기존
│   └── chapterService.ts
├── app/api/
│   ├── convert/                # ★ sidecar proxy (hwpx, ocr, docx)
│   └── books/[id]/import/      # format별 라우트 확장
└── services/                   # ★ optional monorepo
    ├── hwpx-skill-api/         # Python FastAPI (Loffice 복제)
    ├── ddddocr-api/
    └── stirling-proxy/
```

### 4.1 Engine Registry 인터페이스

```typescript
// src/lib/engines/registry.ts
export type DocumentFormat =
  | "markdown" | "html" | "docx" | "hwp" | "hwpx"
  | "pdf" | "pptx" | "epub" | "image";

export interface DocumentEngine {
  format: DocumentFormat;
  canView: boolean;
  canEdit: boolean;
  importToChapters(buffer: ArrayBuffer, opts: ImportOpts): Promise<ChapterDraft[]>;
  exportFromStructure(structure: BookStructure, opts: ExportOpts): Promise<ArrayBuffer | Blob>;
  renderPreview?(buffer: ArrayBuffer): Promise<ReactNode>;
}
```

### 4.2 EditorMode 확장

| Mode | 현재 | TO-BE | 엔진 |
|------|------|-------|------|
| markdown | ✅ | pageSpec + plugins | naverb |
| html | △ | EPUB lint + Ribbon | CodeMirror + Sigil rules |
| word | △ | eigenpal option | TipTap / docx-editor |
| hwp | △ viewer | split + HTML convert | @rhwp/core |
| **pdf** | ❌ | **신규** | pdfjs + pdf-lib |
| **ppt** | ❌ | **신규** | ppt-master viewer |
| **image** | ❌ | asset editor | microscope-image |

---

## 5. 데이터 모델 확장

```typescript
// chapters 테이블 확장 (마이그레이션)
Chapter {
  id, book_id, title, sort_order,
  content_md, content_html,
  primary_source: "markdown"|"html"|"word"|"hwp"|"pdf"|"ppt"|"image",
  source_file_path?: string,      // book-imports Storage path
  source_format?: DocumentFormat,
  page_count?: number,
  metadata?: jsonb,               // HWP page info, PPT slide count 등
}

Book {
  ...
  page_spec: PageSpec,
  cover_image_url?: string,
  audio_manifest?: jsonb,         // Phase 4 오디오북
}
```

---

## 6. 배포 토폴로지

```
┌──────────────── Vercel (book) ────────────────┐
│ Next.js · WASM (@rhwp, pdfjs) · Edge API      │
│ Supabase: books, chapters, Storage            │
└───────────────┬───────────────────────────────┘
                │ HTTPS (optional)
    ┌───────────┼───────────┬──────────────┐
    ▼           ▼           ▼              ▼
 Render       Render      Docker         Supabase
 hwpx-skill   ddddocr     Stirling-PDF   book-images
 FastAPI      OCR API     :8080          book-imports
```

| 서비스 | 필수 | 비고 |
|--------|------|------|
| Vercel + Supabase | ✅ | 현재 |
| hwpx-skill API | HWPX export 시 | Loffice `services/hwpx-skill-api` |
| ddddocr API | PDF 스캔 import | Loffice Docker compose |
| Stirling-PDF | 고급 PDF 편집 | iframe embed, 선택 |
| DocX .NET | 고급 DOCX | Phase 4 |

**原칙:** Vercel 단독으로 **Markdown/HTML/Word/HWP(HTML변환)/Image/JPG** 처리 가능. PDF OCR·HWPX 생성·Stirling만 sidecar.

---

## 7. 통합 로드맵

### Phase 0 — 기반 수리 (1~2주) ← `EDITOR_FIX_DEV_SPEC` Phase A/B

- [ ] Toolbar merge, pageSpec 파이프라인
- [ ] HWP scale + HTML convert import
- [ ] HTML Ribbon + pageSpec preview

### Phase 1 — Core Engines (2~4주)

| ID | 작업 | OSS | 산출물 |
|----|------|-----|--------|
| 1-1 | `@microscope-js/renderer-docx` Word import preview | microscope-js | ImportDialog preview pane |
| 1-2 | `@eigenpal/docx-editor-react` Word 탭 옵션 | Loffice | WordEditorPanel v2 |
| 1-3 | `@rhwp/core` RhwpCanvasViewer 포팅 | Loffice/hwpreader | HwpEditorPanel v2 |
| 1-4 | `renderPageHtml` import pipeline | hwpreader | importHwpToBook |
| 1-5 | Toast code-syntax-highlight | naverb | MarkdownEditorInner |
| 1-6 | Engine registry + format routing | — | `lib/engines/` |

### Phase 2 — EPUB + PDF (3~5주)

| ID | 작업 | OSS |
|----|------|-----|
| 2-1 | Sigil/ebook Nav·OPF TS 포팅 | ebook |
| 2-2 | HTML EPUB lint (well-formed) | Sigil rules |
| 2-3 | PDF 탭: `@microscope-js/renderer-pdf` | microscope-js |
| 2-4 | pdf-lib merge/split (Loffice port) | Stirling-PDF |
| 2-5 | ddddocr OCR sidecar + PDF import | ddddocr |

### Phase 3 — PPT + HWPX + Image (4~6주)

| ID | 작업 | OSS |
|----|------|-----|
| 3-1 | PPT import + PptMasterViewer | ppt-master |
| 3-2 | PptxGenJS chapter→slides export | PptxGenJS |
| 3-3 | hwpx-skill API sidecar | hwpx-skill |
| 3-4 | Image asset panel | microscope-image |
| 3-5 | rhwp-studio iframe 편집 (선택) | @rhwp/editor |

### Phase 4 — 오디오북 + AI (8주+)

| ID | 작업 | OSS |
|----|------|-----|
| 4-1 | voice TTS 챕터 | voice |
| 4-2 | EPUB3 media overlay | ebook |
| 4-3 | ppt-master AI 슬라이드 | ppt-master |
| 4-4 | huashu-design EPUB 템플릿 | huashu-design |

---

## 8. npm 의존성 로드맵

```json
{
  "dependencies": {
    "@toast-ui/react-editor": "✅",
    "@codemirror/*": "✅",
    "@tiptap/*": "✅",
    "@rhwp/core": "✅",
    "mammoth": "✅",
    "html-to-docx": "✅",

    "@microscope-js/react": "Phase 1",
    "@microscope-js/renderer-docx": "Phase 1",
    "@microscope-js/renderer-pdf": "Phase 2",
    "@microscope-js/renderer-pptx": "Phase 2",
    "@microscope-js/renderer-image": "Phase 1",

    "@eigenpal/docx-editor-react": "Phase 1 (Word 고급)",
    "@toast-ui/editor-plugin-code-syntax-highlight": "Phase 1",
    "pdf-lib": "Phase 2",
    "pptxgenjs": "Phase 3"
  }
}
```

---

## 9. 리스크 및 의사결정

| 결정 | 선택 | 근거 |
|------|------|------|
| HWP 편집 1차 | HTML 변환 후 Word/HTML | 네이티브 편집 4~8주 vs 2주 |
| Word 고급 | eigenpal vs TipTap only | Loffice에서 eigenpal 검증됨 |
| PDF 서버 | pdf-lib client 우선 | Vercel Java 불가 |
| PPT in ebook | 슬ide→fixed-layout EPUB | reflowable EPUB에 PPT 직접 삽입 비현실 |
| Sidecar 호스트 | Render (Loffice 패턴) | Docker Python/Java |
| Sigil C++ | TS 포팅만, 데스크톱 브릿지 X | 웹 우선 |

---

## 10. 성공 지표 (KPI)

| 지표 | 현재 | Phase 1 | Phase 3 |
|------|------|---------|---------|
| 편집 가능 포맷 | 1 (MD) | 4 (MD/HTML/Word/HWP*) | 7 (+PDF/PPT/Image) |
| Import 포맷 | DOCX/EPUB/HWP(storage) | +preview +HWP→HTML | +PDF/PPT/OCR |
| Export | EPUB/DOCX/PDF(print) | +HWPX | +PPTX |
| Ribbon 동작률 | ~30% | ~80% | ~95% |
| pageSpec 적용 | Canvas only | 모든 preview | +export WYSIWYG |

*HWP: HTML 변환 후 편집

---

## 11. 즉시 실행 체크리스트 (Phase 1 Sprint 1)

1. `lib/engines/registry.ts` 스캐폴드 생성
2. Loffice에서 `RhwpCanvasViewer.tsx` → `book/src/components/editor/hwp/` 포팅
3. `@microscope-js/react` + `renderer-docx` ImportDialog preview
4. `importHwpToBook()` — `renderPageHtml` 구현
5. naverb `code-syntax-highlight` Markdown 탭 적용
6. `docs/EDITOR_OSS_INTEGRATION_DESIGN_v1.md` → Issue 보드 매핑

---

## 12. 참고 링크

| 리포 | URL |
|------|-----|
| book | https://github.com/shinkang888-code/book |
| Loffice | https://github.com/shinkang888-code/looffice |
| naverb | https://github.com/shinkang888-code/naverb |
| hwpreader | https://github.com/shinkang888-code/hwpreader |
| microscope-js | https://github.com/shinkang888-code/microscope-js |
| ebook (Magic) | https://github.com/shinkang888-code/ebook |
| Sigil | https://github.com/shinkang888-code/Sigil |
| hwpx-skill | https://github.com/shinkang888-code/hwpx-skill |
| ppt-master | https://github.com/shinkang888-code/ppt-master |
| Stirling-PDF | https://github.com/shinkang888-code/Stirling-PDF |
| PptxGenJS | https://github.com/shinkang888-code/PptxGenJS |

---

**문서 끝.**  
다음 단계: Phase 1 Sprint 1 착수 또는 Issue/PR 단위 작업 분할.
