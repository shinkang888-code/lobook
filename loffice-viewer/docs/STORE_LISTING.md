# Google Play 스토어 등록 문구 — 로피스뷰어

> Play Console → 앱 콘텐츠 → 스토어 설정에 아래 내용을 붙여 넣으세요.

---

## 기본 정보

| 항목 | 값 |
|------|-----|
| 앱 이름 | 로피스뷰어 |
| 기본 언어 | 한국어 |
| 앱 ID | com.lofficeviewer.app |
| 카테고리 | 생산성 |
| 유형 | 앱 |
| 가격 | 무료 |

---

## 짧은 설명 (80자 이내)

```
HWP·PDF·Word·PPT·Excel·TXT를 광고 없이 무료로 보는 Loffice 문서 뷰어
```

---

## 전체 설명

```
로피스뷰어 — 광고 없는 무료 오피스 문서 뷰어

한글(HWP/HWPX), PDF, Word, PowerPoint, Excel, 텍스트 파일을 스마트폰에서 바로 열어보세요.
Loffice(LoBooK) 문서 엔진 기반으로, 별도 회원가입 없이 무료로 사용할 수 있습니다.

■ 지원 형식
• HWP — 한글 문서 Canvas 보기 (RHWP 엔진)
• HWPX — 본문·이미지 HTML 미리보기
• PDF — 고품질 페이지 뷰어 (핀치 줌)
• Word (.docx) — 문서 본문 보기
• PowerPoint (.pptx) — 슬라이드 텍스트 보기
• Excel (.xlsx) — 시트 표 미리보기
• TXT / MD / CSV — 텍스트 뷰어

■ 특징
✓ 광고 없음 — 방해 없이 문서에만 집중
✓ 무료 — 인앱 결제 없음
✓ 오프라인 — 문서는 기기에서만 열림 (서버 업로드 없음)
✓ 파일 앱 연동 — 「다른 앱으로 열기」에서 로피스뷰어 선택

■ 사용 방법
1. 앱 실행 후 「파일 열기」
2. 또는 파일 관리자 / 카카오톡 / 이메일에서 문서 → 「로피스뷰어」로 열기

■ 참고
• 편집 기능은 LoBooK 웹 편집기를 이용해 주세요.
• 구형 .doc / .ppt / .xls 바이너리 형식은 제한적으로 지원됩니다.

문의: GitHub shinkang888-code/lobook
```

---

## 영문 전체 설명 (선택 — 글로벌 배포 시)

```
Loffice Viewer — Free ad-free office document viewer

Open HWP, HWPX, PDF, Word, PowerPoint, Excel, and text files on your phone.
Powered by the Loffice (LoBooK) document engine. No sign-up, no ads, completely free.

Supported: HWP, HWPX, PDF, DOCX, PPTX, XLSX, TXT, MD, CSV
Privacy: documents stay on your device — no upload to our servers.
```

---

## 그래픽 에셋 체크리스트

| 에셋 | 규격 | 파일 |
|------|------|------|
| 앱 아이콘 | 512×512 PNG | `app/src/main/res/drawable/ic_launcher_foreground.png` 리사이즈 |
| Feature Graphic | 1024×500 | Loffice 로고 + 「광고 없는 무료 뷰어」 문구 |
| 스크린샷 (폰) | 최소 2장 | 홈 / PDF 또는 HWP 뷰어 |
| 스크린샷 (7인치) | 선택 | 동일 |

---

## 콘텐츠 등급

- 폭력, 성적 콘텐츠, 약물 등: **없음**
- 사용자 생성 콘츠: **없음** (로컬 파일만)
- 예상 등급: **전체 이용가**

---

## 데이터 안전 (Data safety)

| 질문 | 답변 |
|------|------|
| 앱에서 사용자 데이터를 수집하나요? | **아니오** |
| 데이터를 타사와 공유하나요? | **아니오** |
| 데이터가 암호화되나요? | 기기 기본 암호화에 따름 |
| 사용자가 데이터 삭제를 요청할 수 있나요? | 해당 없음 (서버 저장 없음) |

수집/공유 유형: **없음** 으로 선언

---

## 광고

- 앱에 광고 ID 포함: **아니오**
- 광고 SDK: **없음**

---

## 앱 액세스

- 특별한 로그인/데모 계정: **불필요** (모든 기능 즉시 사용)

---

## Release 노트 (v1.0.0)

```
로피스뷰어 첫 출시
• HWP / HWPX / PDF / Word / PPT / Excel / TXT 뷰어
• 파일 앱에서 「로피스뷰어로 열기」 지원
• 광고 없는 무료 앱
```

---

## 서명 키 (로컬 설정)

1. `keystore.properties.example` → `keystore.properties` 복사
2. Release keystore: `keystore/loffice-viewer-release.keystore` (로컬 생성됨, Git 제외)
3. **keystore 백업 필수** — 분실 시 Play 업데이트 불가
4. AAB 빌드: Android Studio → Generate Signed Bundle

Play App Signing 사용 시: 업로드 키만 등록, Google이 앱 서명 키 관리
