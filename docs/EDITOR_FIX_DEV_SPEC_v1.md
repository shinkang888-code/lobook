# Book Studio — 편집기 기능 결함 수정개발명세서 v1.0

> **문서 버전:** v1.0  
> **작성일:** 2026-06-17  
> **대상:** `shinkang888-code/book` (Book Studio Pro)  
> **선행 문서:** `EDITOR_UPGRADE_DEV_SPEC_v1.md` (v1.1), `UI_DESIGN_SPEC_POLARIS_v1.md`  
> **프로덕션:** https://book-mu-ochre.vercel.app  
> **목적:** Phase 1 UI 구현 후 **기능 미연동·규격 불일치·편집 불가** 결함을 일괄 진단하고, 수정 우선순위·작업 명세·수용 기준을 정의한다.

---

## 0. Executive Summary

Polaris Office형 Shell(UI)은 Phase 1에서 완성되었으나, **4종 편집기 중 Markdown(Toast UI)만 end-to-end로 동작**한다. 사용자 제보(2026-06-17) 기준 핵심 결함 3건:

| # | 사용자 증상 | 근본 원인 | 심각도 |
|---|------------|----------|--------|
| **E-01** | A4 설정 후 HWP 불러와도 규격 불일치 | HWP SVG가 원본 mm 고정 렌더, `pageSpec`/`zoom` 미전달, `max-w-lg`로 축소 | **Critical** |
| **E-02** | HWP가 이미지(SVG)로만 표시, 편집 불가 | `@rhwp/core` 뷰어 스텁, Import→챕터 파이프라인 단절, 편집 API 미연동 | **Critical** |
| **E-03** | HTML 편집기 Ribbon/기능 전무 | CodeMirror bare editor, `toolbar.register` 없음, Insert/Format onClick 미구현 | **High** |
| **E-04** | Word Ribbon 일부 후 비활성 | `EditorToolbarContext.register`가 **replace** 방식 → Shell zoom/page 액션 소실 | **High** |
| **E-05** | Markdown만 정상 | AS-IS 유산(Toast UI 완성품) vs Phase 1 신규 스켈레톤 | **Info** |

**권장 접근:** UI 추가 없이 **데이터·Toolbar·PageSpec 파이프라인 연결**을 먼저 수리(Phase A, 1~2주) → HWP HTML 변환 import(Phase B) → 네이티브 HWP 편집(Phase C, 장기).

---

## 1. 사용자 제보 증상 (재현 시나리오)

### 1.1 HWP + A4 규격 불일치

**재현:**
1. 우측 속성 패널 → 페이지 규격 **A4 (210×297mm)** 선택
2. 파일 → HWP 가져오기 → `.hwp` 업로드
3. HWP 탭에서 문서 확인

**관찰 (스크린샷 #1):**
- PageCanvas 외곽은 A4 흰 페이지 프레임
- HWP SVG는 **원본 한글 용지 크기(B5 등)** 그대로, `max-w-lg`(512px)로 축소
- 좌측 여백·표 레이아웃이 A4 content area와 정렬되지 않음
- 여백 T/R/B/L이 **0**으로 설정된 경우 padding 없이 SVG가 프레임에 붙음

### 1.2 HWP 편집 불가

**관찰:**
- `renderPageSvg()` 결과를 `dangerouslySetInnerHTML`로 표시 → **비트맵/벡터 뷰어**
- 텍스트 선택·커서·입력 불가
- Ribbon Import(HWP)는 Storage 저장만, HwpEditorPanel과 **연결 안 됨**
- 저장 시 `buildSavePayload`에 HWP 분기 없음 → **DB 반영 0**

### 1.3 HTML 편집기 기능 없음

**관찰 (스크린샷 #2 — Markdown은 정상):**
- Markdown: Toast UI 툴바(H/B/I, 목록, 이미지 등) + md/html 동기화 ✅
- HTML: CodeMirror 소스 + 우측 preview만 존재
- Ribbon **서식/입력/편집** 탭 버튼 대부분 `disabled` (onClick 없음)
- preview에 `pageSpec` CSS 미적용 → A4 변경해도 미리보기 동일

### 1.4 Word 편집기 (부분 동작)

- TipTap 본문 편집은 가능
- Word 탭 진입 후 Markdown/HTML 전환 시 Ribbon **확대/축소·페이지 이동** 버튼 dead
- Insert(그림/표/링크) 전부 stub

---

## 2. AS-IS 아키텍처 결함 맵

```
┌──────────────── BookEditorShell ─────────────────┐
│ pageSpec ──► PageCanvas (CSS frame only)         │
│ activePage ──► Toc/Thumbnail/StatusBar ONLY      │
│ zoom ──► PageCanvas mmToPx                       │
│                                                   │
│  ┌─ Markdown ── draft(md+html) ── save ── DB ✅  │
│  ┌─ HTML ───── draft(html) ────── save ── DB ⚠️  │
│  │              Ribbon ✗  pageSpec preview ✗      │
│  ┌─ Word ───── draft(html) ────── save ── DB ⚠️  │
│  │              Ribbon △ (merge bug)             │
│  └─ HWP ────── (isolated) ───── save ── DB ✗    │
│                SVG viewer, no pageSpec            │
└───────────────────────────────────────────────────┘

HWP Import (Ribbon) ──► Storage only ──✗──► HwpEditorPanel
HWP Upload (Panel)  ──► WASM SVG ──✗──► chapters / save
```

### 2.1 파일별 구현 상태 매트릭스

| 컴포넌트 | UI | 챕터 draft | 저장 | Ribbon | pageSpec | 페이지 단위 | Import |
|---------|-----|-----------|------|--------|----------|------------|--------|
| MarkdownEditorPanel | ✅ Toast | ✅ md+html | ✅ | N/A(자체) | ❌ | ❌ | ✅ docx |
| HtmlEditorPanel | △ CM only | ✅ html | ✅ html | ❌ | ❌ preview | ❌ | ✅ epub |
| WordEditorPanel | ✅ TipTap | ✅ html | ✅ html | △ bug | ❌ | ❌ | ✅ docx |
| HwpEditorPanel | △ SVG | ❌ | ❌ | ❌ | ❌ | ❌ | △ storage |

---

## 3. 오류 목록 및 근본 원인 (일일 검토)

### E-01. A4/pageSpec이 HWP에 적용되지 않음

| 항목 | 내용 |
|------|------|
| **증상** | A4 선택 후 HWP 로드 시 용지 크기·여백 불일치 |
| **관련 파일** | `HwpEditorPanel.tsx`, `PageCanvas.tsx`, `pageSpec.ts` |
| **근본 원인 1** | `HwpEditorPanel` props가 `bookId`만 — `pageSpec`, `zoom`, `activePage` 미수신 |
| **근본 원인 2** | SVG를 `max-w-lg flex-col gap-6`으로 렌더 — PageCanvas content area 무시 |
| **근본 원인 3** | `@rhwp/core` `getPageInfo()` → HWP **원본 용지 mm** 사용, Book Studio spec과 독립 |
| **근본 원인 4** | `activePage`가 HWP page index와 sync 안 됨 — 다페이지 전체 스크roll |
| **수정 방향** | content area 크기 계산 → SVG/canvas scale fit (Loffice `RhwpCanvasViewer` 패턴 포팅) |

**참고 코드 (Loffice):**
```typescript
function fitScale(pageWidth: number, containerWidth: number): number {
  const pad = 32;
  return Math.min(2, Math.max(0.3, (containerWidth - pad) / pageWidth));
}
```

---

### E-02. HWP 편집 불가 (SVG 뷰어 only)

| 항목 | 내용 |
|------|------|
| **증상** | HWP = 이미지처럼 보임, 텍스트 수정 불가 |
| **관련 파일** | `HwpEditorPanel.tsx`, `import/hwp/route.ts`, `importService.ts`, `BookEditorShell.tsx` |
| **근본 원인 1** | Phase 1 의도적 **viewer stub** — UI 문구 "미리보기를 제공" |
| **근본 원인 2** | `renderPageSvg`만 사용, `renderPageHtml` / `insertText` API 미사용 |
| **근본 원인 3** | `storeHwpImport()` → Storage만, `chapters`/`content_html` 갱신 없음 |
| **근본 원인 4** | Ribbon Import ↔ Panel Upload **이중 경로**, Storage path DB 미기록 |
| **근본 원인 5** | `sessionStorage`에 filename만 저장, reload 시 소실 |

**현실적 TO-BE (단계):**

| 단계 | 목표 | 방법 |
|------|------|------|
| **B-1** | "편집 가능" 체감 | Import 시 `renderPageHtml()` → `content_html` + Word/HTML 탭에서 편집 |
| **B-2** | HWP 탭 split view | 좌 HWP SVG 참조 + 우 HTML/TipTap 동기 편집 |
| **B-3** | 네이티브 HWP 편집 | `@rhwp/core` canvas hit-test + `insertText` (Loffice `RhwpPageCanvas` 수준, 4~8주) |

> **의사결정:** HWPX 완전 WYSIWYG 편집은 비현실적. **변환 후 HTML/Word 편집**을 1차 목표로 명시 (`EDITOR_UPGRADE_DEV_SPEC` §8.4.4).

---

### E-03. HTML 편집기 Ribbon/기능 없음

| 항목 | 내용 |
|------|------|
| **증상** | HTML 탭에서 서식·입력·편집 Ribbon 버튼 전부 비활성 |
| **관련 파일** | `HtmlEditorPanel.tsx`, `PolarisRibbon.tsx`, `EditorToolbarContext.tsx` |
| **근본 원인 1** | `HtmlEditorPanel`이 `toolbar.register()` **호출 안 함** |
| **근본 원인 2** | Insert 탭: `onClick` prop 없음 (217~220행) — 의도적 stub |
| **근본 원인 3** | CodeMirror에 lineNumbers, format, emmet 미설정 |
| **근본 원인 4** | preview `.book-content`에 `pageSpecToCss` 미적용 |
| **근본 원인 5** | HTML 저장 시 `content_md` 미동기화 (turndown 없음) |

**수정 작업 (Phase A):**
1. CodeMirror `EditorView` ref → undo/redo/copy/cut/paste Ribbon 등록
2. preview pane에 `pageSpec` typography + content width 적용
3. 패널 상단 mini-toolbar: 포맷, 태그 삽입, 줄번호 토글
4. (Phase B) `@codemirror/lang-html` lint, emmet, Ctrl+Shift+F format

---

### E-04. EditorToolbarContext replace 버그

| 항목 | 내용 |
|------|------|
| **증상** | Word 탭 사용 후 Markdown/HTML에서 zoom·page Ribbon dead |
| **관련 파일** | `EditorToolbarContext.tsx` (17~18행), `WordEditorPanel.tsx` (79행), `BookEditorShell.tsx` (103~111행) |
| **근본 원인** | `register(next)` → `setActions(next)` **전체 교체** |
| **근본 원인 2** | Word unmount → `toolbar.reset()` → `{}`, Shell useEffect 재실행 없음 |

**수정:**
```typescript
// AS-IS
setActions(next);
// TO-BE
setActions((prev) => ({ ...prev, ...next }));
// cleanup: unregister(['bold','italic',...]) — reset() 금지
```

---

### E-05. activePage · 페이지 네비게이션 단절

| 항목 | 내용 |
|------|------|
| **증상** | 하단 1/N, TOC 클릭해도 편집 영역은 전체 챕터 |
| **관련 파일** | `BookEditorShell.tsx`, `tocBuilder.ts`, 각 EditorPanel |
| **근본 원인** | `splitMarkdownToPages()`는 md 전용, `activePage` slice 미전달 |
| **수정** | `getPageSlice(content, activePage, pageSpec)` 유틸 + 편집기에 page scope prop |

---

### E-06. pageSpec 저장 이중화

| 항목 | 내용 |
|------|------|
| **증상** | A4 설정 후 export는 B5로 나올 수 있음 |
| **관련 파일** | `pageSpec.ts`, `BookEditorShell.tsx` |
| **근본 원인** | localStorage + DB 동시 사용, 초기 load 순서 race |
| **수정** | DB `books.page_spec` 단일 source of truth, localStorage는 offline cache만 |

---

### E-07. Markdown `\n\n` literal 표시 (데이터)

| 항목 | 내용 |
|------|------|
| **증상** | preview에 `\n\n` 문자 그대로 노출 |
| **근본 원인** | DB/import 시 이스케이프된 줄바꿈 문자열 저장 |
| **수정** | import 시 normalize, 또는 load 시 `\\n` → `\n` 치환 |

---

### E-08. PolarisRibbon Insert/Page 탭 stub

| 버튼 | 상태 | 필요 연동 |
|------|------|----------|
| 그림 | onClick ✗ | TipTap Image / HTML `<img>` 삽입 / MD upload hook |
| 표 | onClick ✗ | TipTap Table extension |
| 하이퍼링크 | onClick ✗ | TipTap Link / HTML `<a>` |
| 구분선 | onClick ✗ | `<hr>` / MD `---` |
| 페이지 설정 | onClick ✗ | PageSpecPanel focus scroll |
| 방향 | onClick ✗ | `pageSpec.orientation` toggle |

---

## 4. TO-BE 목표 상태

### 4.1 공통 원칙

1. **Single Page Canvas:** 모든 편집기는 `PageCanvas` content area 안에서 `pageSpec` + `zoom` 준수
2. **Ribbon = Editor Capability:** 활성 탭의 편집기가 `toolbar.register`로 capability 노출
3. **Import → Chapter:** 모든 포맷 import는 `chapters[].content_*` + `primary_source` 갱신
4. **HWP = Convert-then-Edit:** 1차 목표는 SVG 뷰 + HTML 편집, 네이티브 편집은 Phase C

### 4.2 편집기별 TO-BE

| 편집기 | TO-BE UX |
|--------|----------|
| **Markdown** | pageSpec typography 반영, activePage slice (선택) |
| **HTML** | CM + pageSpec preview + Ribbon undo/format + insert |
| **Word** | TipTap + Ribbon merge fix + Insert extensions + pageSpec CSS |
| **HWP** | pageSpec fit scale + activePage 1장 표시 + Import→auto load + HTML 변환 import |

---

## 5. 수정 로드맵

### Phase A — 파이프라인 수리 (P0, 3~5일)

> UI 추가 최소, 기존 Shell 연결만 수리

| ID | 작업 | 파일 | 우선순위 |
|----|------|------|----------|
| A-1 | Toolbar merge + unregister | `EditorToolbarContext.tsx`, `WordEditorPanel.tsx`, `HtmlEditorPanel.tsx` | P0 |
| A-2 | Shell toolbar 재등록 안정화 | `BookEditorShell.tsx` | P0 |
| A-3 | HWP pageSpec scale + activePage | `HwpEditorPanel.tsx`, `pageSpec.ts` | P0 |
| A-4 | HTML preview pageSpec + mini toolbar | `HtmlEditorPanel.tsx` | P0 |
| A-5 | Ribbon Insert onClick wiring (Word 우선) | `PolarisRibbon.tsx`, `WordEditorPanel.tsx` | P1 |
| A-6 | pageSpec DB 단일화 | `BookEditorShell.tsx`, `pageSpec.ts` | P1 |
| A-7 | `\n` normalize on load/import | `chapterService.ts`, import libs | P2 |

**Phase A 수용 기준:**
- [ ] A4 + HWP: SVG가 흰 페이지 content area 너비에 fit
- [ ] Word ↔ Markdown 전환 후 Ribbon zoom/page 동작
- [ ] HTML 탭: undo/redo Ribbon 동작, preview에 A4 font/size 반영
- [ ] `npm run build` + `verify-phase1/2` 통과

---

### Phase B — HWP 편집 가능화 (P1, 1~2주)

| ID | 작업 | 설명 |
|----|------|------|
| B-1 | `books.hwp_storage_path` 또는 `chapters.hwp_path` 컬럼 | Import path 영속 |
| B-2 | `GET /api/books/[id]/import/hwp/latest` | Panel mount 시 auto fetch |
| B-3 | Import 통합: Ribbon = Panel 단일 진입 | ImportDialog success → HWP 탭 + fetch |
| B-4 | `importHwpToBook()`: renderPageHtml → chapters | `primary_source: "hwp"`, html 저장 |
| B-5 | HWP 탭 split UI | 좌 SVG 참조 / 우 WordEditor |
| B-6 | Loffice `RhwpCanvasViewer` / `RhwpPageCanvas` 포팅 | canvas 렌더 + zoom |

**Phase B 수용 기준:**
- [ ] Ribbon HWP import 후 HWP 탭에 문서 표시 (새로고침 후에도)
- [ ] "HTML로 변환하여 편집" 버튼 → Word 탭 + content_html 채워짐
- [ ] 저장 후 EPUB/DOCX export에 변환 HTML 반영

---

### Phase C — 고급 편집 (P2, 4~8주)

| ID | 작업 | 설명 |
|----|------|------|
| C-1 | `@rhwp/core` canvas 편집 UI | Loffice hwp-editor 패턴 |
| C-2 | activePage editor slice | md/html/word 페이지 단위 |
| C-3 | PageSpecPanel 고급 (font, orientation, facing) | 명세 §8.3 |
| C-4 | HTML emmet + EPUB lint | CodeMirror extensions |
| C-5 | hwpx-skill Python sidecar | HWPX → HTML batch |

---

## 6. 상세 작업 명세

### 6.1 A-1. EditorToolbarContext merge

**파일:** `src/components/editor/shell/EditorToolbarContext.tsx`

```typescript
// register: shallow merge
setActions((prev) => ({ ...prev, ...next }));

// add unregister(keys: (keyof EditorToolbarActions)[])
// WordEditorPanel cleanup:
return () => toolbar.unregister(['bold','italic','underline',...]);
// reset() 호출 제거
```

**WordEditorPanel:** unmount 시 Shell action 보존  
**HtmlEditorPanel:** mount 시 undo/redo/copy/cut/paste 등록  
**BookEditorShell:** shell action keys는 별도 owner id 또는 deps `[pageTotal]`로 re-register

---

### 6.2 A-3. HWP pageSpec scale

**파일:** `src/components/editor/hwp/HwpEditorPanel.tsx`

**Props 추가:**
```typescript
type HwpEditorPanelProps = {
  bookId: string;
  pageSpec: PageSpec;
  zoom: number;
  activePage: number;
  onPageCountChange?: (n: number) => void;
};
```

**로직:**
1. `contentAreaSize(pageSpec, zoom)` — padding 제외 inner width/height (px)
2. `fitScale = min(contentW / pageInfo.width, contentH / pageInfo.height)`
3. **activePage 1장만** 표시 (view 탭 page prev/next 연동)
4. SVG wrapper: `width: pageInfo.width * fitScale`, `transform-origin: top left`
5. `max-w-lg` 제거 → `w-full h-full flex items-start justify-center`

**신규 유틸:** `src/lib/editor/pageSpec.ts`
```typescript
export function contentAreaPx(spec: PageSpec, zoom = 1): { width: number; height: number }
```

---

### 6.3 A-4. HtmlEditorPanel 강화

**Props:** `pageSpec`, `zoom`

**추가 기능:**
| 기능 | 구현 |
|------|------|
| 줄 번호 | `@codemirror/view` lineNumbers |
| Undo/Redo | `undo`, `redo` from `@codemirror/commands` → toolbar |
| Preview pageSpec | preview div에 `pageSpecToCss` (padding 제외 typography) |
| 태그 삽입 bar | `<p>`, `<h1>`, `<img>`, `<table>` snippet buttons |
| Format | `Ctrl+Shift+F` → basic indent (Phase B: prettier) |

---

### 6.4 B-4. HWP → HTML import

**파일:** `src/lib/import/hwpImporter.ts` (신규)

```typescript
export async function importHwpToBook(bookId, buffer, fileName, mode) {
  const rhwp = await initRhwp();
  const doc = new rhwp.HwpDocument(new Uint8Array(buffer));
  const chapters = [];
  for (let i = 0; i < doc.pageCount(); i++) {
    chapters.push({
      title: `페이지 ${i + 1}`,
      content_html: doc.renderPageHtml(i),
      content_md: "",
      primary_source: "hwp",
    });
  }
  doc.free();
  await saveImportFile(...);
  return applyImport(bookId, mode, chapters);
}
```

**UI:** ImportDialog HWP mode에 "HTML로 변환하여 편집" / "원본 보기만" 선택

---

## 7. 테스트 계획

### 7.1 수동 QA 체크리스트

| # | 시나리오 | 기대 결과 |
|---|----------|----------|
| T-1 | A4 설정 → HWP 업로드 | SVG가 A4 content area에 fit, 잘리지 않음 |
| T-2 | HWP 3페이지 → view 이전/다음 | activePage별 1장 표시 |
| T-3 | HTML 탭 → Ribbon 실행취소 | CodeMirror undo 동작 |
| T-4 | Word 탭 → 굵게 → Markdown 전환 → view 확대 | zoom 버튼 활성 |
| T-5 | HWP Ribbon import → 새로고침 | (Phase B) 문서 유지 |
| T-6 | HWP import → HTML 변환 → 저장 → EPUB | 변환 내용 export |

### 7.2 자동 검증

```powershell
npm run verify:phase1
npm run verify:phase2
# Phase B 추가
npm run verify:phase3  # hwp html import 테스트 (신규)
```

---

## 8. 리스크 및 의사결정

| 리스크 | 영향 | 대응 |
|--------|------|------|
| HWP 네이티브 편집 공수 과대 | 일정 지연 | Phase B HTML 변환으로 "편집 가능" 먼저 충족 |
| renderPageHtml 품질 | 표·각주 깨짐 | Word 탭에서 수동 보정 + SVG 참조 병행 |
| CodeMirror Ribbon 한계 | HTML WYSIWYG 기대 | preview pane을 "준-WYSIWYG"로 강화 |
| pageSpec vs HWP 원본 불일치 | 레이아웃 차이 | UI에 "HWP 원본 규격 / Book 규격" 토글 표시 |
| `@rhwp/core` WASM 로드 실패 | HWP 탭 blank | Loffice 동일 fallback 메시지 |

### 8.1 확정 의사결정

1. **HWP 1차 편집 = HTML/Word 변환 편집** (네이티브 편집은 Phase C)
2. **pageSpec authoritative source = Supabase `books.page_spec`**
3. **Ribbon Insert는 WordEditor 우선 wiring**, HTML은 snippet bar 병행
4. **Loffice `RhwpCanvasViewer` 코드 재사용** (MIT/동일 계정 리포)

---

## 9. 변경 파일 목록 (Phase A 예상)

| 파일 | 변경 유형 |
|------|----------|
| `src/components/editor/shell/EditorToolbarContext.tsx` | merge + unregister |
| `src/components/editor/shell/BookEditorShell.tsx` | props 전달, HWP page count |
| `src/components/editor/hwp/HwpEditorPanel.tsx` | pageSpec scale, activePage |
| `src/components/editor/html/HtmlEditorPanel.tsx` | toolbar, pageSpec preview |
| `src/components/editor/word/WordEditorPanel.tsx` | unregister cleanup, Insert |
| `src/components/editor/shell/PolarisRibbon.tsx` | Insert onClick |
| `src/lib/editor/pageSpec.ts` | contentAreaPx |
| `scripts/verify-phase3.ts` | (Phase B) |

---

## 10. 일정 제안

| 주차 | 마일스톤 |
|------|----------|
| **1주차** | Phase A 완료 → 배포 → 사용자 재검증 |
| **2~3주차** | Phase B HWP import/HTML 변환 |
| **4주차+** | Phase C 네이티브 HWP, 페이지 slice |

---

## 11. 참고 리포 · 코드

| 리소스 | 경로 | 활용 |
|--------|------|------|
| Loffice RhwpCanvasViewer | `c:\cursor\lofice\src\components\hwp\` | HWP scale/zoom/canvas |
| Loffice HwpEditor | `c:\cursor\lofice\src\app\hwp-editor\` | 편집 API 참고 |
| @rhwp/core API | `node_modules/@rhwp/core/rhwp.d.ts` | renderPageHtml, insertText |
| 기존 명세 | `docs/EDITOR_UPGRADE_DEV_SPEC_v1.md` §8.4 | 편집기 상세 TO-BE |

---

**문서 끝.**  
Phase A 구현 착수 시 본 명세 §6 작업 ID를 GitHub Issue / PR에 매핑한다.
