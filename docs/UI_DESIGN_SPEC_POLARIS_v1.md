# Book Studio Pro — Polaris Office UI/기능 통합 기획안 v1.0

> **문서 버전:** v1.0  
> **작성일:** 2026-06-17  
> **벤치마크:** [Polaris Office Web HWP](https://hwp.polarisoffice.com/)  
> **기반 명세:** `EDITOR_UPGRADE_DEV_SPEC_v1.md` v1.1  
> **대상:** `shinkang888-code/book` (Book Studio)

---

## 0. Executive Summary

Book Studio는 현재 **단일 Markdown 에디터 + 카드 레이아웃** MVP이다.  
본 기획안은 **Polaris Office Web HWP** 수준의 **Office Ribbon UI** 위에, dev spec v1.1의 **PDF형 3-Zone(좌 목차 · 중앙 페이지 · 우 속성)** 을 결합한 **Book Studio Pro** 편집 경험을 정의한다.

| 구분 | Polaris Office HWP | Book Studio Pro (목표) |
|------|-------------------|------------------------|
| 타이틀 바 | 문서명 + 전체 서비스 | Book Studio + 책 제목 + 저장 상태 |
| 메뉴 | 파일·편집·보기·입력·서식·**쪽** | 파일·편집·보기·입력·서식·**쪽** + **편집기(MD/HTML/Word/HWP)** |
| 리본 | 탭별 아이콘 그룹 | 동일 + 편집기 모드별 contextual ribbon |
| 포맷 바 | 글꼴·크기·B/I/U·정렬 | 동일 (TipTap/Toast UI 연동) |
| 캔버스 | 회색 배경 + 흰 A4 페이지 | **Page Spec(mm)** 적용 페이지 박스 |
| 좌측 | *(Polaris HWP에는 없음)* | **TOC + 썸네일** (Acrobat + Notion) |
| 우측 | *(없음)* | **Page Spec·메타·EPUB** 속성 패널 |
| 상태줄 | 페이지·줌 | 페이지·규격·편집기·줌·저장 |

---

## 1. Polaris Office 벤치마킹 분석

### 1.1 UI 레이어 구조 (첨부 스크린샷 기준)

```
┌─────────────────────────────────────────────────────────────────┐
│ Title Bar (~36px) — 앱명 | 문서명.hwp                    [유틸] │
├─────────────────────────────────────────────────────────────────┤
│ Menu Tabs (~32px) — [파일][편집][보기][입력][서식][쪽]            │
├─────────────────────────────────────────────────────────────────┤
│ Ribbon Panel (~76px) — 탭별 대형 아이콘 + 그룹 라벨              │
│  [클립보드] [글자/문단] [용지설정] [표·도형·그림] [찾기·바꾸기]   │
├─────────────────────────────────────────────────────────────────┤
│ Format Bar (~36px) — Undo/Redo | 글꼴 | 크기 | B I U | 정렬     │
├─────────────────────────────────────────────────────────────────┤
│ Alert Bar (~28px, optional) — 자동저장 안내 등                   │
├──────────┬──────────────────────────────────────────┬───────────┤
│ LEFT     │ WORKSPACE (#f3f3f3)                       │ RIGHT     │
│ (Book    │     ┌─────────────────┐                  │ (Book     │
│  Studio  │     │ WHITE PAGE      │                  │  Studio   │
│  추가)   │     │ (A4/B5 규격)    │                  │  추가)    │
│ 260px    │     └─────────────────┘                  │ 300px     │
├──────────┴──────────────────────────────────────────┴───────────┤
│ Status Bar (~24px) — 페이지 n/m | 줌 | 문서명                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Polaris → Book Studio 매핑

| Polaris 요소 | Book Studio 대응 | 구현 컴포넌트 |
|-------------|-----------------|---------------|
| **쪽 탭 → 페이지 설정** | Page Spec 프리셋·여백·방향 | `PageSpecPanel`, `PagePresetDialog` |
| **보기 탭 → 눈금자·줌·쪽 맞춤** | ZoomControls, Fit width | `ZoomControls`, `PageCanvas` |
| **편집 탭 → 클립보드·찾기** | Ribbon contextual | `PolarisRibbon` + `EditorToolbarContext` |
| **입력 탭 → 표·그림·하이퍼링크** | 탭별 Insert ribbon | MD/HTML/Word/HWP 각각 |
| **흰 페이지 + L자 여백 표시** | PageCanvas shadow + margin guides | `PageCanvas` CSS |
| **회색 workspace** | `--workspace-bg: #f3f3f3` | globals.css `.polaris-workspace` |

### 1.3 Polaris에 없고 Book Studio가 추가하는 차별점

1. **좌측 TOC + 썸네일** — 전자책·EPUB spine 네비게이션
2. **4종 편집기 탭** — MD/HTML/Word/HWP 동급 전환
3. **EPUB export** — 페이지 규격 CSS + 다챕터
4. **Supabase 자동 저장** — Polaris 경고 배너 대체

---

## 2. 연동 리포 분석 및 기능 매핑

### 2.1 리포 현황 (2026-06-17 로컬 분석)

| 리포 | 로컬 | 역할 | Book Studio 통합 |
|------|------|------|-------------------|
| **book** | ✅ `c:\cursor\book` | 허브 Next.js 앱 | 본 프로젝트 |
| **naverb** | ✅ `c:\cursor\naverb` | Toast UI Editor 소스 | Markdown 탭 (npm `@toast-ui/react-editor` 사용 중) |
| **ebook** | ✅ `c:\cursor\ebook` | Magic/Sigil EPUB C++ | OPF/Nav/Headings 알고리즘 TS 포팅 |
| **lofice** | ✅ `c:\cursor\lofice` | **Polaris UI 레퍼런스** | `LoficeLayout`, `DocxEditor`, `RhwpCanvasViewer` 패턴 복제 |
| **hwpreader** | ⚠️ LFS 일부 실패 | `@rhwp/core` WASM | npm 설치 + `public/rhwp_bg.wasm` |
| **hwpx-skill** | ✅ | Python HWPX 변환 | Phase 2 API sidecar |
| **microscope-js** | ✅ | DOCX/PDF 뷰어 | Word import preview |
| **voice** | ❌ 빈 리포 | TTS/오디오북 | Phase 4 |

### 2.2 lofice — Polaris UI 청사진 (1차 복제 대상)

| lofice 파일 | Book Studio 대응 | 비고 |
|------------|-----------------|------|
| `src/components/office/LoficeLayout.tsx` | `PolarisRibbon.tsx` | 타이틀바 `#2b579a`, 리본 76px, 상태줄 |
| `src/components/office/EditorToolbarContext.tsx` | `EditorToolbarContext.tsx` | 리본 ↔ 에디터 액션 브릿지 |
| `src/components/editor/DocxEditor.tsx` | `WordEditorPanel.tsx` | TipTap + ribbonMode |
| `src/components/editor/HtmlEditor.tsx` | `HtmlEditorPanel.tsx` | HTML 소스 편집 |
| `src/components/hwp/RhwpCanvasViewer.tsx` | `HwpEditorPanel.tsx` | HWP 페이지 SVG |
| `src/components/hwp/RhwpEditor.tsx` | HWP iframe 편집 Phase 2 | `@rhwp/editor` |
| `src/lib/rhwp/setup.ts` | `src/lib/rhwp/setup.ts` | WASM init |
| `src/lib/parsers/docx.ts` | `src/lib/parsers/docx.ts` | mammoth import |
| `scripts/copy-native-assets.js` | `scripts/copy-native-assets.js` | WASM → public |

### 2.3 naverb — Markdown 탭

**이미 통합됨** (`MarkdownEditorInner.tsx`).

| API | 용도 |
|-----|------|
| `getMarkdown()` / `getHTML()` | CDM 저장 |
| `setMarkdown()` | 챕터 로드 |
| `addImageBlobHook` | Storage URL 업로드 |

**naverb 포크 활용 (선택):** `plugins/code-syntax-highlight`, `table-merged-cell` → Phase 2.

### 2.4 ebook (Magic/Sigil) — EPUB 엔진

**직접 import 불가.** TypeScript 포팅 우선순위:

| Sigil 소스 | TS 대상 | Phase |
|-----------|---------|-------|
| `epub_utils.py` zip 규칙 | `lib/export/epub/zip.ts` | P1 |
| `opf_parser.py` | `lib/export/epub/opf/parser.ts` | P1 |
| `Headings.cpp` h1–h6 | `lib/export/epub/toc/headings.ts` | P1 |
| `NavProcessor.cpp` | `lib/export/epub/nav/` | P1 |
| `ImportEPUB.cpp` | `lib/import/epubImporter.ts` | P2 |

### 2.5 hwpreader — HWP 탭

```typescript
// npm: @rhwp/core, @rhwp/editor
HwpDocument.load(bytes) → pageCount() → renderPageSvg(i)
```

**lofice 패턴:** `registerRhwpTextMeasure()` 필수 → Canvas `measureTextWidth`.

### 2.6 microscope-js — Word Preview

```tsx
import { Viewer, useRegistry } from '@microscope-js/react';
import { docxRenderer } from '@microscope-js/renderer-docx';
// DOCX 업로드 → preview → mammoth → TipTap
```

### 2.7 hwpx-skill — 서버 변환

| 스크립트 | 용도 |
|---------|------|
| `scripts/md2hwpx.py` | MD → HWPX export |
| `scripts/convert_hwp.py` | HWP → HWPX |
| `scripts/text_extract.py` | HWP/HWPX → plain/MD |

**통합:** FastAPI sidecar 또는 Supabase Edge (Python 제한) — Phase 2.

---

## 3. Book Studio Pro UI 설계 (최종)

### 3.1 전체 레이아웃 (Desktop ≥1280px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ POLARIS TITLE BAR (#2b579a, 36px)                                            │
│ 📘 Book Studio | 《퀀텀투자의 첫걸음》 ▼ | ● 저장됨 | [저장][발행][▼내보내기]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ MENU TABS: [파일][편집][보기][입력][서식][쪽]                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ RIBBON (76px) — 선택 탭별 아이콘 그룹                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ EDITOR TABS: [Markdown][HTML][Word][HWP]  |  FORMAT BAR (contextual)           │
├──────────┬───────────────────────────────────────────────────────┬───────────┤
│ LEFT 260 │ CENTER — PageCanvas (#f3f3f3 workspace)                │ RIGHT 300 │
│ [목차][썸]│  zoom controls + white page box + active editor        │ Page Spec │
│ TOC tree │  [◀ 3/12 ▶]  75% 100% 125% fit                         │ Meta/EPUB │
├──────────┴───────────────────────────────────────────────────────┴───────────┤
│ STATUS BAR (#2b579a, 24px) — p.3 · B5 · Markdown · 100% · 14:32 저장         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 디자인 토큰 (Polaris Office Web)

```css
:root {
  --polaris-navy: #2b579a;
  --polaris-navy-dark: #1e3f6f;
  --polaris-workspace: #f3f3f3;
  --polaris-ribbon-bg: #f3f3f3;
  --polaris-page-bg: #ffffff;
  --polaris-alert: #fff3cd;
  --polaris-alert-text: #856404;
  --editor-left-width: 260px;
  --editor-right-width: 300px;
  --page-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
```

**폰트:** `"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif` (Polaris HWP 기본)

### 3.3 Ribbon 탭별 기능 명세

#### 파일
| 그룹 | 항목 | 동작 |
|------|------|------|
| 파일 | 새 책, 열기, 저장, EPUB/PDF 내보내기 | API 연동 |
| 가져오기 | DOCX, HWP, EPUB import | Phase 2 |
| 공유 | 링크 공유, 발행 | Supabase status |

#### 편집
| 그룹 | 항목 | 편집기 |
|------|------|--------|
| 클립보드 | 잘라내기·복사·붙여넣기 | Word/HWP |
| 편집 | 실행취소·다시실행 | 전체 |
| 찾기 | 찾기·바꾸기 | MD/HTML/Word |

#### 보기
| 그룹 | 항목 | 동작 |
|------|------|------|
| 확대/축소 | +/-, 100%, 폭 맞춤, 쪽 맞춤 | PageCanvas zoom |
| 페이지 | 이전/다음, 썸네일 패널 | TOC 연동 |
| 표시 | 눈금자, 여백 가이드 | PageCanvas overlay |

#### 입력
| 그룹 | MD | HTML | Word | HWP |
|------|-----|------|------|-----|
| 표 | plugin | `<table>` | TipTap | viewer |
| 그림 | blob hook | `<img>` | TipTap | import |
| 하이퍼링크 | MD link | `<a>` | TipTap | — |

#### 서식
| 그룹 | 항목 |
|------|------|
| 글자 | 글꼴, 크기, B/I/U, 색 |
| 문단 | 정렬, 줄간격, 목록 |
| 스타일 | 제목1–3, 인용 |

#### 쪽 (Page Spec — Polaris 「쪽」탭 대응)
| 그룹 | 항목 |
|------|------|
| 페이지 설정 | 프리셋(A4/B5/6×9), 방향 |
| 여백 | 상·하·좌·우 mm |
| 적용 범위 | 전체 / 챕터 / 현재 페이지 |

### 3.4 편집기 탭별 UI

#### Markdown
- PageCanvas 내 Toast UI (vertical preview)
- Format bar: GFM 툴바
- 페이지 구분: `---` 또는 리본 「페이지 나누기」

#### HTML
- 좌: CodeMirror 6 (XHTML) / Phase 1: textarea
- 우: rendered page (Page Spec CSS)
- 리본: Format, Well-formed check

#### Word
- TipTap WYSIWYG (lofice `DocxEditor` ribbonMode)
- DOCX import: microscope preview → mammoth → TipTap
- `.polaris-doc-body` 스타일

#### HWP
- 좌: `@rhwp/core` SVG 페이지 (RhwpCanvasViewer 패턴)
- 우: 변환 HTML 편집 (Phase 1 placeholder → WASM)
- 업로드: `book-imports` Storage

---

## 4. 컴포넌트 아키텍처

```
src/components/editor/
├── shell/
│   ├── BookEditorShell.tsx      # 3-Zone + full viewport
│   ├── PolarisRibbon.tsx        # lofice LoficeLayout 패턴
│   ├── EditorTabBar.tsx         # MD|HTML|Word|HWP
│   ├── FormatToolbar.tsx        # 글꼴·B/I/U bar
│   ├── StatusBar.tsx
│   └── EditorToolbarContext.tsx
├── navigation/
│   ├── TocNavigator.tsx
│   └── PageThumbnailStrip.tsx
├── canvas/
│   ├── PageCanvas.tsx
│   ├── PageSpecPanel.tsx
│   └── ZoomControls.tsx
├── markdown/MarkdownEditorPanel.tsx
├── html/HtmlEditorPanel.tsx
├── word/WordEditorPanel.tsx
├── hwp/HwpEditorPanel.tsx
└── modals/PagePresetDialog.tsx

src/lib/editor/
├── types.ts
├── pageSpec.ts
├── tocBuilder.ts
└── adapters/ (Phase 2)

src/lib/export/epub/          # ebook 포팅
src/lib/rhwp/                 # lofice 포팅
src/lib/parsers/              # docx, hancom
```

---

## 5. 데이터 모델 (Phase 1 → Phase 2)

### Phase 1 (클라이언트 state)
- `page_spec` — localStorage per book
- `pages[]` — MD `---` 분할 또는 단일 페이지
- `toc[]` — `# heading` 파싱

### Phase 2 (Supabase)
- `books.page_spec` jsonb
- `chapters`, `pages` 테이블 (dev spec §10)

---

## 6. 구현 로드맵

### Sprint 1 (현재) — Polaris Shell + MD 탭
- [x] 기획안 문서
- [ ] `BookEditorShell` full viewport
- [ ] `PolarisRibbon` (파일·편집·보기·쪽)
- [ ] `PageCanvas` B5 + zoom
- [ ] `TocNavigator` heading 파싱
- [ ] `EditorTabBar` 4탭 (Word/HWP placeholder)
- [ ] `PageSpecPanel` + preset dialog

### Sprint 2 — HTML + Word
- [ ] CodeMirror 6 HTML panel
- [ ] TipTap Word panel (lofice 복제)
- [ ] mammoth DOCX import
- [ ] `@microscope-js/renderer-docx` preview

### Sprint 3 — HWP + EPUB v2
- [ ] `@rhwp/core` WASM viewer
- [ ] `chapters`/`pages` API
- [ ] ebook Headings/Nav TS 포팅
- [ ] EPUB export v2

### Sprint 4 — Polish
- [ ] Figma Editor/Desktop 프레임
- [ ] hwpx-skill sidecar
- [ ] PDF export (Playwright)

---

## 7. npm 의존성 계획

```bash
# Sprint 1
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-underline \
  @tiptap/extension-text-align @tiptap/extension-placeholder

# Sprint 2
npm install @codemirror/view @codemirror/state @codemirror/lang-html \
  mammoth @microscope-js/core @microscope-js/react @microscope-js/renderer-docx

# Sprint 3
npm install @rhwp/core @rhwp/editor
```

---

## 8. Figma 컴포넌트 (Book Studio Design System)

| Frame | Components |
|-------|------------|
| Editor/Desktop | BookEditorShell, PolarisRibbon |
| Editor/Left | TocNavigator, PageThumbnailStrip |
| Editor/Center | PageCanvas, EditorTabBar, FormatToolbar |
| Editor/Right | PageSpecPanel |
| Editor/Modals | PagePresetDialog, NewBookWizard |

---

## 9. 성공 기준 (Sprint 1)

1. `/books/[id]` 진입 → **전체 화면 Polaris Shell** (기존 Header 숨김)
2. **쪽 탭**에서 B5/A4 프리셋 변경 → PageCanvas 크기 즉시 반영
3. **좌측 목차**에서 `# heading` 클릭 → 해당 위치 스크롤
4. **MD/HTML/Word/HWP** 4탭 전환 (< 300ms)
5. Markdown 편집 → 저장 → EPUB export (기존 기능 유지)
6. **상태줄**에 페이지·규격·편집기·줌 표시

---

## 10. 참고 링크

- [Polaris Office Web HWP](https://hwp.polarisoffice.com/)
- lofice `LoficeLayout.tsx` — 이미 Polaris 벤치마킹 구현
- `EDITOR_UPGRADE_DEV_SPEC_v1.md` v1.1
- Figma: Book Studio Design System

---

**다음 단계:** Sprint 1 구현 → `npm run build` → commit → push → Vercel 배포
