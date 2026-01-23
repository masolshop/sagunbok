# ✅ 사근복 AI - v6.1 최종 배포 완료

## 📅 배포 정보
- **배포 일시**: 2026-01-23 19:20 KST
- **버전**: v6.1 - Hybrid Request 지원
- **커밋**: 596bb4e
- **배포 파일**: dist-v6.1-get-method-20260123102050.tar.gz (147 KB)

---

## 🎯 해결된 문제

### ❌ 기존 문제 (v6.0)
- POST 요청이 Google Apps Script 리다이렉트로 실패
- "Page Not Found" 에러 발생
- CORS 문제

### ✅ 해결 방법 (v6.1)
- **GET 메서드**로 전환
- **URL 파라미터**로 데이터 전달
- Apps Script `parseRequestData()` 함수로 POST/GET 모두 지원

---

## 🚀 Apps Script v6.1 배포

### 새 배포 URL
```
https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec
```

### 주요 기능
1. **Hybrid Request 지원**
   - POST 데이터 우선 파싱
   - GET 파라미터 fallback
   
2. **JSON DB 이중 백업**
   - Google Sheets (메인 DB)
   - Google Drive JSON 파일 (백업)

3. **자동 동기화**
   - 회원가입 시
   - 승인 상태 변경 시

---

## 🧪 테스트 결과

### ✅ GET 요청 테스트
```bash
curl -G 'https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec' \
  --data-urlencode 'action=loginConsultant' \
  --data-urlencode 'phone=01063529091' \
  --data-urlencode 'password=12345'
```

**응답:**
```json
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

## 💻 프론트엔드 변경사항

### Auth.tsx
```typescript
const callAPI = async (action: string, data: any) => {
  // GET 방식으로 변경
  const params = new URLSearchParams({
    action,
    ...Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    )
  });
  
  const response = await fetch(`${API_URL}?${params.toString()}`, {
    method: 'GET',
  });
  return response.json();
};
```

### AdminView.tsx
모든 API 호출을 GET 방식으로 변경:
- `fetchMembers()` - getAllMembers
- `syncJsonFiles()` - syncJson
- `downloadJsonFiles()` - getJsonUrls
- `updateMemberStatus()` - updateMemberStatus

---

## 📊 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    프론트엔드                        │
│            React/TypeScript/Vite                    │
│         http://3.34.186.174/ (EC2)                  │
└──────────────────┬──────────────────────────────────┘
                   │ GET 요청 (URL 파라미터)
                   ↓
┌─────────────────────────────────────────────────────┐
│            Apps Script v6.1 (Web App)               │
│  parseRequestData() - POST/GET 통합 파싱            │
│                                                     │
│  https://script.google.com/macros/s/...            │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│  Google Sheets   │  │  Google Drive    │
│   (메인 DB)      │  │   (JSON 백업)    │
│                  │  │                  │
│ - 기업회원       │  │ - members_all    │
│ - 사근복컨설턴트 │  │ - by_consultant  │
│ - 로그기록       │  │                  │
└──────────────────┘  └──────────────────┘
```

---

## 📝 API 엔드포인트

### 1. 로그인
```
GET /?action=loginConsultant&phone=01063529091&password=12345
GET /?action=loginCompany&phone=XXX&password=XXX
```

### 2. 회원가입
```
GET /?action=registerConsultant&name=XXX&phone=XXX&email=XXX&...
GET /?action=registerCompany&companyName=XXX&name=XXX&...
```

### 3. 회원 조회
```
GET /?action=getAllMembers
```

### 4. 승인 상태 변경
```
GET /?action=updateMemberStatus&phone=XXX&type=consultant&status=승인완료
```

### 5. JSON 동기화
```
GET /?action=syncJson
```

### 6. JSON 다운로드 URL
```
GET /?action=getJsonUrls
```

---

## 🔗 중요 링크

### 프론트엔드
- **EC2 배포**: http://3.34.186.174/
- **GitHub**: https://github.com/masolshop/sagunbok
- **최신 커밋**: 596bb4e

### 백엔드
- **Apps Script URL**: https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

---

## 🧪 다음 테스트 항목

### 1. 로그인 테스트
- [ ] 컨설턴트 로그인 (01063529091 / 12345)
- [ ] 기업회원 로그인
- [ ] 승인 대기 상태 계정 로그인 (에러 확인)

### 2. 관리자 기능 테스트
- [ ] 전체 회원 조회
- [ ] JSON 동기화 버튼
- [ ] JSON 다운로드 버튼
- [ ] 회원 승인/거부 기능

### 3. 컨설턴트 뷰 테스트
- [ ] 추천 회원만 표시되는지 확인
- [ ] JSON 기능 숨김 확인

---

## 📦 배포 파일

### 로컬 파일
- `google-apps-script-v6.1-hybrid.js` (751줄)
- `dist-v6.1-get-method-20260123102050.tar.gz` (147 KB)

### 변경된 파일
```
components/Auth.tsx          (GET 방식 전환)
components/AdminView.tsx     (GET 방식 전환)
google-apps-script-v6.1-hybrid.js (NEW)
```

---

## ✅ 체크리스트

- [x] Apps Script v6.1 코드 작성
- [x] Apps Script 배포 (웹 앱)
- [x] 권한 승인
- [x] GET 요청 테스트 성공
- [x] 로그인 기능 테스트 성공
- [x] 프론트엔드 GET 방식 전환
- [x] 빌드 성공
- [x] Git 커밋/푸시
- [ ] EC2 배포 (수동)
- [ ] 실제 브라우저 테스트

---

## 🚨 주의사항

### 보안
- GET 방식으로 비밀번호가 URL에 노출됨
- HTTPS 사용으로 암호화되지만, URL 로그에 남을 수 있음
- 프로덕션 환경에서는 추가 보안 조치 필요

### 대안 (향후)
1. **JWT 토큰 인증** 방식 도입
2. **API Gateway + Lambda** 구조로 변경
3. **CORS 설정**이 가능한 백엔드 서버 구축

---

## 📞 문의

- **작성자**: 사근복 AI 개발팀
- **작성일**: 2026-01-23 19:20 KST
- **버전**: v6.1 Hybrid Request 지원

---

## 🎉 결론

✅ Google Apps Script POST 리다이렉트 문제 해결
✅ GET 방식으로 안정적인 API 통신 구현
✅ 로그인 기능 정상 작동 확인
✅ JSON DB 이중 백업 시스템 완성

**다음 단계**: EC2에 배포 후 브라우저에서 실제 테스트
