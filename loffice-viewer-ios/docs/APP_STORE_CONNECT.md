# App Store Connect 체크리스트

1. [Apple Developer](https://developer.apple.com) — App ID `com.lofficeviewer.app` 등록
2. Mac에서 `xcodegen generate` → Xcode Archive
3. **Transporter** 또는 Xcode → App Store Connect 업로드
4. `docs/APP_STORE_LISTING.md` 문구 입력
5. 아이콘 1024×1024: `Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`
6. 스크린샷 3장 이상
7. App Privacy: 데이터 수집 없음
8. 심사 정보: 데모 계정 불필요

## IPA 추출 (TestFlight / Ad Hoc)

Xcode → Product → Archive → Distribute App → Ad Hoc / TestFlight

## Windows에서 할 수 없는 것

- `.ipa` 빌드 (Mac + Xcode 필수)
- App Store 서명 (Apple Developer Team 필요)

소스·에셋·등록 문구는 본 zip에 모두 포함되어 있습니다.
