# 컨설턴트 회원가입 오류 수정

## 문제 원인
`sendConsultantApprovedEmail` 함수가 주석 처리되어 정의되지 않음

## 수정 내용
- **파일**: COMPLETE_V6.2_CODE.js
- **라인**: 488-494
- **수정**: 주석 제거 (`/**` → JSDoc 형식 `/**`)

## 수정 전
```javascript
/**
function sendConsultantApprovedEmail(data) {
  sendEmail(
    data.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    `${data.name}님, 축하합니다!...`
  );
}
```

## 수정 후
```javascript
/**
 * 컨설턴트 승인 이메일
 */
function sendConsultantApprovedEmail(data) {
  sendEmail(
    data.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    `${data.name}님, 축하합니다!...`
  );
}
```

## 배포 방법
1. Google Apps Script 열기: https://script.google.com
2. 프로젝트: '사근복 회원관리 v2'
3. Code.gs 전체 교체
4. 저장 (Ctrl+S)
5. 배포 → 배포 관리 → 새 버전 배포

## 테스트 URL
```
https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec?action=registerConsultant&name=테스트컨설턴트&phone=10555512345&email=testcon@example.com&position=수석&division=영업&branch=본사
```

## 기대 결과
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다."
}
```

---
**수정 완료**: 2026-01-24 08:50 KST
**버전**: v6.2.2
