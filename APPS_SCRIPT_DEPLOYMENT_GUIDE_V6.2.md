# 📘 Apps Script v6.2 배포 가이드

## 🎯 목표
CORS 및 POST 리다이렉트 문제 완전 해결

---

## ✅ v6.1 코드 그대로 사용 (GET 방식)

현재 **v6.1 코드**가 이미 GET 방식을 지원하며, 터미널 테스트에서 정상 작동했습니다.

### 📌 현재 배포 URL
```
https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec
```

### ✅ 테스트 성공 확인
```bash
# 로그인 테스트 결과
{
  "success": true,
  "user": {
    "userType": "consultant",
    "name": "이종근",
    "phone": "01063529091",
    "email": "ceo@femayeon.com",
    "position": "단장",
    "division": "수도권",
    "branch": "페마연"
  }
}
```

---

## 🔍 CORS 문제 진단

### 1️⃣ **브라우저 콘솔 확인**

**Chrome/Edge**: `F12` → Console 탭  
**Firefox**: `F12` → 콘솔 탭  
**Safari**: `Cmd+Option+C` → 콘솔 탭

**확인할 내용:**
- ❌ 빨간색 에러 메시지가 있나요?
- ❌ "CORS", "Access-Control-Allow-Origin" 같은 키워드가 보이나요?
- ❌ 네트워크 요청이 실패했나요?

### 2️⃣ **네트워크 탭 확인**

1. 개발자 도구 → Network 탭
2. "Preserve log" 체크
3. 로그인 버튼 클릭
4. 실패한 요청 찾기
5. **Response 탭에서 응답 내용 확인**

---

## 🚀 즉시 테스트 방법

### 브라우저 주소창에 직접 입력:

```
https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec?action=loginConsultant&phone=01063529091&password=12345
```

**기대 결과:**
```json
{
  "success": true,
  "user": {
    "userType": "consultant",
    "name": "이종근",
    ...
  }
}
```

---

## 🛠️ 해결 방법

### ✅ **해결 방법 1: Apps Script 배포 재생성 (권장)**

1. **Google Apps Script 에디터** 열기:
   - https://script.google.com/home
   - "사근복 회원관리 v2" 프로젝트 선택

2. **기존 배포 모두 보관처리**:
   - 왼쪽 사이드바 → 배포 (🚀) 아이콘
   - 각 배포 옆 `⋮` 클릭 → "보관처리"

3. **새 배포 만들기**:
   - 배포 → 새 배포
   - **설정 (매우 중요!)**:
     - 설명: `v6.2 CORS 해결`
     - 유형: **웹 앱** ⚠️
     - 실행 계정: **나** ⚠️
     - 액세스 권한: **누구나** ⚠️

4. **권한 승인**:
   - 권한 검토 → Google 계정 선택
   - "고급" → "[프로젝트명]으로 이동(안전하지 않음)"
   - 허용

5. **새 웹 앱 URL 복사**:
   ```
   https://script.google.com/macros/s/[NEW_DEPLOYMENT_ID]/exec
   ```

6. **새 URL을 알려주세요!** 🚀

---

### ✅ **해결 방법 2: CORS Proxy 사용 (임시)**

만약 Apps Script 재배포로도 해결이 안 된다면, 프론트엔드에서 CORS 프록시를 사용합니다:

```typescript
// components/Auth.tsx 수정
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const API_URL = CORS_PROXY + 'https://script.google.com/macros/s/.../exec';
```

⚠️ **주의**: 이 방법은 임시 해결책이며, 프로덕션에서는 사용하지 마세요.

---

## 📝 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| Apps Script v6.1 코드 | ✅ 완료 | GET 방식 지원 |
| 프론트엔드 GET 전환 | ✅ 완료 | Auth.tsx, AdminView.tsx |
| 터미널 테스트 | ✅ 성공 | 로그인 응답 정상 |
| EC2 배포 | ⏸️ 대기 | dist-v6.1-get-method-20260123102050.tar.gz |
| 브라우저 테스트 | ❌ 실패 | "로그인 중 오류" 메시지 |

---

## 🔴 다음 조치 필요

1. **브라우저 콘솔에서 정확한 에러 메시지 확인**
2. **Apps Script 새 배포 생성** (권장)
3. **새 배포 URL을 공유** → 즉시 프론트엔드 업데이트

---

## 📞 문의

새 배포 URL이 준비되면 알려주세요!  
즉시 프론트엔드를 업데이트하고 EC2에 재배포하겠습니다. 🚀

---

**작성일**: 2026-01-23 19:30 KST
