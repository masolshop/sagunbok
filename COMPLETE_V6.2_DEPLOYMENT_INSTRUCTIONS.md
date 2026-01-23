# 🚀 Apps Script v6.2 긴급 업데이트 배포

## ⚠️ 문제 발견
`registerManager` 액션이 doPost 함수에 등록되지 않아 매니저 회원가입이 실패했습니다.

## ✅ 수정 완료
COMPLETE_V6.2_CODE.js 파일의 1077줄 이후에 다음 코드가 추가되었습니다:

```javascript
if (data.action === 'registerManager') {
  return ContentService
    .createTextOutput(JSON.stringify(registerManager(data)))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 📋 배포 방법

### 1. Google Apps Script 열기
https://script.google.com

### 2. Code.gs 파일 열기
"사근복 회원관리 v2" 프로젝트 → Code.gs

### 3. 1077-1081줄 찾기
```javascript
if (data.action === 'registerConsultant') {
  return ContentService
    .createTextOutput(JSON.stringify(registerConsultant(data)))
    .setMimeType(ContentService.MimeType.JSON);
}

if (data.action === 'getAllMembers') {
```

### 4. 중간에 다음 코드 삽입
```javascript
if (data.action === 'registerManager') {
  return ContentService
    .createTextOutput(JSON.stringify(registerManager(data)))
    .setMimeType(ContentService.MimeType.JSON);
}

```

### 5. 저장
Ctrl+S 또는 💾 아이콘 클릭

### 6. 완료!
배포 URL은 그대로 유지됩니다.

## 🧪 테스트 방법

브라우저 주소창에 입력:
```
https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec?action=registerManager&name=테스트매니저&phone=1099998888&email=test@test.com&position=팀장&businessUnit=사업부&branchOffice=본사
```

**기대 결과:**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다."
}
```

---

**업데이트 일시**: 2026-01-24 07:50 KST
**파일**: COMPLETE_V6.2_CODE.js (1120줄)
