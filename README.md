# Book Studio

Next.js + Supabase 기반 **전자책 제작 웹 스튜디오**입니다.

- **에디터:** naverb(Toast UI Editor) — Markdown / WYSIWYG
- **저장:** Supabase 또는 로컬 `.data/books.json` (환경변수 없을 때)
- **내보내기:** EPUB3 (`jszip`)
- **데스크톱 참고:** `c:\cursor\ebook` (Magic/Sigil C++ 포크), Sigil 2.8.0 설치됨

## 빠른 시작

```powershell
cd c:\cursor\book
npm install
npm run dev
```

브라우저: http://localhost:3000

Supabase 없이도 **로컬 저장소**로 바로 동작합니다.

## Supabase 연동 (선택)

1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/20260617000000_books.sql` 실행
3. `.env.local.example` → `.env.local` 복사 후 값 입력

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 전자책 목록 |
| `/books/new` | 새 책 생성 |
| `/books/[id]` | Markdown/WYSIWYG 편집 |
| `/books/[id]/preview` | HTML 미리보기 |
| `POST /api/books/[id]/export` | EPUB 다운로드 |

## UI / Figma

Figma Code Connect CLI가 전역 설치되어 있습니다.

```powershell
figma --version
figma connect create <figma-node-url>
```

Figma Personal Access Token은 `FIGMA_ACCESS_TOKEN` 환경변수로 설정하세요.

## shadcn/ui 추가

```powershell
npx shadcn@latest add [component]
```

## Vercel 배포

1. GitHub `shinkang888-code/book` 연결
2. Environment Variables에 Supabase 3개 키 등록
3. Deploy

## 관련 리포

| 리포 | 용도 |
|------|------|
| `shinkang888-code/ebook` | Magic EPUB 에디터 (C++/Qt) |
| `shinkang888-code/Sigil` | Sigil EPUB 에디터 포크 |
| `shinkang888-code/naverb` | Toast UI Editor 포크 (npm `@toast-ui/react-editor` 사용) |

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 실행 |
| `npm run lint` | ESLint |
