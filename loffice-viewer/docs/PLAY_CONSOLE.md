# Google Play Console 등록 가이드 — 로피스뷰어

## 앱 정보

| 필드 | 내용 |
|------|------|
| **앱 이름** | 로피스뷰어 |
| **영문 이름** | Loffice Viewer |
| **패키지명** | com.lofficeviewer.app |
| **카테고리** | 생산성 |
| **콘텐츠 등급** | 전체 이용가 |
| **가격** | 무료 |
| **광고** | 아니오 |
| **인앱 구매** | 없음 |

## 짧은 설명 (80자)

HWP·PDF·Word·PPT·Excel·TXT를 광고 없이 무료로 보는 Loffice 문서 뷰어

## 전체 설명 (예시)

로피스뷰어는 Loffice(LoBooK) 문서 엔진 기반의 **무료 오피스 뷰어**입니다.

✓ HWP / HWPX — 한글 문서 Canvas·본문 보기  
✓ PDF — 고품질 페이지 뷰어  
✓ Word / PowerPoint / Excel — 문서 내용 미리보기  
✓ TXT / MD / CSV — 텍스트 뷰어  

**광고 없음 · 회원가입 없음 · 무료**

파일 관리자에서 문서를 탭하면 바로 열립니다.

## 그래픽 에셋

| 에셋 | 경로 |
|------|------|
| 앱 아이콘 (512×512) | `app/src/main/res/drawable/ic_launcher_foreground.png` 확대 |
| 스플래시 / Feature | `app/src/main/res/drawable/looffice_logo.png` |
| 스크린샷 | 홈 화면, PDF/HWP/DOCX 뷰어 각 1장 이상 |

## AAB 빌드

1. `keystore.properties.example`을 복사해 `keystore.properties` 작성 (로컬 keystore 경로·비밀번호)
2. `keystore/loffice-viewer-release.keystore` 백업 (Git 제외)
3. Android Studio → **Build → Generate Signed Bundle / APK**

```powershell
cd loffice-viewer
.\gradlew.bat :app:bundleRelease
```

출력: `app/build/outputs/bundle/release/app-release.aab`

스토어 등록 문구 전체: [docs/STORE_LISTING.md](STORE_LISTING.md)

## 데이터 안전 양식

- 데이터 수집: **아니오** (로컬 뷰어만)
- 데이터 공유: **아니오**
- 암호화: 기본 Android

## 테스트

- [ ] PDF 외부 앱에서 "로피스뷰어로 열기"
- [ ] HWP Canvas 렌더 (WASM)
- [ ] HWPX 본문·이미지
- [ ] docx / pptx / xlsx 텍스트
- [ ] txt UTF-8
- [ ] 최근 문서 목록
- [ ] Release 빌드 ProGuard 통과
