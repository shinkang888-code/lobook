# Release Keystore

이 폴더의 `.keystore` 파일은 Git에 포함되지 않습니다.

로컬에서 생성:

```powershell
keytool -genkeypair -v `
  -keystore loffice-viewer-release.keystore `
  -alias lofficeviewer `
  -keyalg RSA -keysize 2048 -validity 10000
```

프로젝트 루트에 `keystore.properties`를 두고 `keystore.properties.example`을 참고하세요.

**Play Console 업데이트를 위해 keystore와 비밀번호를 안전한 곳에 백업하세요.**
