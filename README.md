# LoBooK

Next.js + Supabase 기반 **전자책 제작 웹 스튜디오**입니다.

- **브랜드:** LoBooK
- **리포:** [shinkang888-code/lobook](https://github.com/shinkang888-code/lobook)
- **에디터:** Markdown · HTML · Word · HWP · PDF 멀티 편집
- **저장:** Supabase 또는 로컬 `.data/books.json` (환경변수 없을 때)
- **보내기:** EPUB3 · DOCX · PDF

## 빠른 시작

```powershell
cd c:\cursor\book
npm install
npm run dev
```

브라우저: http://localhost:3000

Supabase 없이도 **로컬 저장소**로 바로 동작합니다.

## Supabase 연동 (선택)

`.env.local.example` → `.env.local` 복사 후 값 입력

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
| `/books/[id]` | 멀티 편집기 |
| `/books/[id]/preview` | HTML 미리보기 |

## Vercel 배포

1. GitHub `shinkang888-code/lobook` 연결
2. Environment Variables (Production): Supabase 키 설정

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run verify:architecture` | Architecture Hub 검증 |
| `npm run verify:m365-word` | M365 Word 편집기 검증 |
