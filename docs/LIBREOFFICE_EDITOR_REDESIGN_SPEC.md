# LoBooK LibreOffice 중심 편집기 재설계 명세서

> 기준 리포: [shinkang888-code/libreoffice](https://github.com/shinkang888-code/libreoffice) (LibreOffice/core fork)  
> 대상: LoBooK `lobook` — 전자책 제작 스튜디오  
> 버전: v1.0 (2026-06)

---

## 1. 배경 및 문제

LoBooK 편집기는 Markdown·TipTap·eigenpal·RHWP·microscope·Hancom 스킨 등 **여러 리포에서 조각 통합**된 구조로, 다음 문제가 있었다.

| 문제 | 설명 |
|------|------|
| 탭 과다 | 8개 모드 탭 (MD/HTML/Word/HWP/PDF/LoOffice/Cowork/Architecture) |
| 리본 중복 | PolarisRibbon + WordM365Ribbon + eigenpal 내장 툴바 |
| 엔진 분산 | 포맷별 패널이 서로 독립, LoOffice 허브와 미연결 |
| 저장 경로 불일치 | DOCX eigenpal round-trip vs html-to-docx export |

---

## 2. 설계 원칙

1. **LibreOffice를 메인** — UI/모듈 구조는 LO `framework`/`cui`/`vcl` NotebookBar 패턴
2. **LoBooK는 확장만** — 전자책(챕터·EPUB·AI Studio) 등 LO에 없는 기능만 추가
3. **런타임 현실성** — LO C++ 코어는 웹에 직접 빌드하지 않고, **LibreOfficeKit + 기존 Loffice 엔진**으로 브리지
4. **점진적 통합** — P1 UI/라우터, P2 LO Online WOPI, P3 WASM

---

## 3. LibreOffice 모듈 → LoBooK 엔진 매핑

| LO 모듈 | 앱 | 포맷 | LoBooK 엔진 | 상태 |
|---------|-----|------|-------------|------|
| `sw/` | Writer | docx, odt, rtf | eigenpal-docx | ✅ 통합 |
| `hwpfilter/` | HWP Filter | hwp, hwpx | rhwp | ✅ 통합 |
| `filter/` | PDF | pdf | pdfjs | ✅ 통합 |
| `editeng/` | Edit Engine | html | CodeMirror | ✅ 통합 |
| `sc/` | Calc | xlsx, ods | spreadsheet | 🔜 예정 |
| `sd/` | Impress | pptx, odp | ppt-master | ⚡ 부분 |
| `libreofficekit/` | LOK | * | Collabora WOPI | 🔜 P2 |

구현: `src/lib/libreoffice/libreOfficeCatalog.ts`

---

## 4. 새 UI 아키텍처 (3탭)

```
BookEditorShell
├── AiCommandBar          ← LoBooK 확장 (PPT AI Studio)
├── LibreOfficeRibbon     ← LO framework NotebookBar (파일/편집/보기/삽입/서식/도구)
├── EditorTabBar
│   ├── LibreOffice       ← 메인 (Writer/HWP/PDF/HTML/도구 서브탭)
│   ├── Writer (원고)     ← Markdown canonical (EPUB 파이프라인)
│   └── LoBooK Studio     ← AI Cowork + Architecture (LO 비중복)
├── 좌측: ChapterList + TOC
├── 중앙: 활성 허브/편집기
└── 우측: LibreOfficeSidebar (속성) / PageSpecPanel (원고)
```

### 제거·흡수된 레거시 탭

| 레거시 | 신규 위치 |
|--------|-----------|
| word, html, hwp, pdf, office | **LibreOffice** 허브 서브탭 |
| markdown | **Writer (원고)** |
| cowork, architecture | **LoBooK Studio** |

---

## 5. 신규 파일

| 경로 | 역할 |
|------|------|
| `src/lib/libreoffice/libreOfficeCatalog.ts` | LO 모듈 ↔ Loffice 엔진 바인딩 |
| `src/lib/libreoffice/libreOfficeStatus.ts` | 런타임 상태 |
| `src/components/editor/libreoffice/LibreOfficeHub.tsx` | 통합 문서 편집 허브 |
| `src/components/editor/libreoffice/LibreOfficeRibbon.tsx` | LO 스타일 리본 |
| `src/components/editor/libreoffice/LibreOfficeSidebar.tsx` | 속성 패널 (cui) |
| `src/components/editor/studio/StudioHub.tsx` | AI·아키텍처 확장 |
| `src/app/api/libreoffice/catalog/route.ts` | 카탈로그 API |
| `scripts/setup-libreoffice.js` | 매니페스트 설치 |
| `vendor/libreoffice/engine-manifest.json` | LO 모듈 메타데이터 |

---

## 6. LoBooK 고유 확장 (유지·강화)

| 기능 | 위치 | LO 중복 여부 |
|------|------|-------------|
| 챕터 구조·EPUB export | structure API | ✅ 고유 |
| Markdown 원고 (Toast UI) | Writer 탭 | ✅ 출판 워크플로 |
| AI 프레젠테이션 스튜디오 | AiCommandBar | ✅ 고유 |
| AI Cowork (AionUi) | Studio 탭 | ✅ 고유 |
| Architecture Hub | Studio 탭 | ✅ 고유 |
| OCR (Tesseract/ddddocr) | LibreOffice → 도구 | ⚡ LO 보완 |

---

## 7. 로드맵

### P1 — 완료 (현재)
- [x] 3탭 구조 재설계
- [x] LibreOfficeRibbon / Hub / Sidebar
- [x] 엔진 카탈로그 + API
- [x] setup/verify 스크립트
- [x] `npm run build` 통과

### P2 — LO Online 연동
- [ ] `LIBREOFFICE_ONLINE_URL` Collabora iframe
- [ ] WOPI 호스트 (`/api/wopi/*`)
- [ ] eigenpal ↔ LO Online 폴백 체인

### P3 — 고급
- [ ] LO WASM (Emscripten) 실험 빌드
- [ ] Calc/Impress 네이티브 패널
- [ ] eigenpal DOCX round-trip 저장 pipeline

---

## 8. 설치·검증

```powershell
npm run setup:libreoffice
npm run verify:libreoffice
npm run dev
# http://localhost:3000/books/{id}
```

### 환경 변수 (선택)

```
LIBREOFFICE_ONLINE_URL=https://your-collabora.example.com
```

---

## 9. 성공 지표

- 편집기 탭 **8개 → 3개**
- 리본 **단일 LibreOfficeRibbon**
- 포맷별 패널 **LibreOfficeHub 라우터로 통합**
- LoBooK 확장 기능 **Studio + AiCommandBar**에 격리
