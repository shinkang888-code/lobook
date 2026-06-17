# Figma Editor/Desktop 목업 스펙

> Book Studio Pro — Polaris Office 스타일 편집기 Figma 프레임 가이드  
> 파일: [Book Studio Design System](https://www.figma.com/design/3FVgUkf0MGa6QVQoRxnUE3/Book-Studio-Design-System)

## 프레임: Editor/Desktop (1440×900)

| 영역 | 크기 | 컴포넌트 |
|------|------|----------|
| Title Bar | 1440×36 | `#2b579a`, Book Studio + 문서명 |
| Menu Tabs | 1440×32 | 파일·편집·보기·입력·서식·쪽 |
| Ribbon | 1440×76 | contextual groups |
| Editor Tabs | 1440×40 | MD / HTML / Word / HWP |
| Left Panel | 260×flex | ChapterList + TocNavigator |
| Canvas | flex | PageCanvas `#f3f3f3` + white page |
| Right Panel | 300×flex | PageSpecPanel |
| Status Bar | 1440×24 | `#2b579a` |

## 컴포넌트 인벤토리

- `BookEditorShell` — root auto-layout column
- `PolarisRibbon` — title + tabs + ribbon
- `ImportDialog` — DOCX/EPUB/HWP modal
- `PagePresetCard` — B5/A4/6×9 variants
- `ChapterList` — active state `#2b579a/15`

## Code Connect

```powershell
figma connect create --label React
# Editor/Desktop 프레임 URL 지정
```
