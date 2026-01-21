# 사근복 AI 최종 로그인 테스트 절차

## 📋 사전 준비

### ✅ 완료된 사항
- [x] Google Sheets 데이터 확인 (01012345678)
- [x] Apps Script 코드 전체 업로드 완료
- [x] Apps Script 배포 설정: "액세스 권한 = 모든 사용자"
- [x] testLoginCompany 함수 실행 성공
- [x] 프런트엔드 재빌드 및 AWS 배포 완료

---

## 🕐 타임라인

### 1️⃣ Apps Script 재배포 (지금)
- 배포 관리 → ✏️ 연필 클릭
- 새 버전 선택
- 설명: "CORS 완전 수정 v6"
- 배포 클릭

### 2️⃣ 대기 시간 (5-10분)
Google Apps Script 전파 시간

### 3️⃣ 브라우저 캐시 삭제
```
Windows: Ctrl + Shift + Del
Mac: Cmd + Shift + Del

선택 항목:
☑️ 쿠키 및 기타 사이트 데이터
☑️ 캐시된 이미지 및 파일

기간: 전체 기간
```

### 4️⃣ 브라우저 재시작

### 5️⃣ 시크릿/개인정보 보호 모드로 접속
```
Chrome/Edge: Ctrl + Shift + N
Firefox: Ctrl + Shift + P
Safari: Cmd + Shift + N
```

---

## 🧪 테스트 시나리오

### 테스트 1: 기업회원 로그인

**접속:**
- URL: http://3.34.186.174
- F12 개발자 도구 열기

**로그인 정보:**
- 회원 구분: **기업회원** (기본값)
- ID(핸드폰번호): `01012345678`
- 비밀번호: `test1234`

**예상 결과:**
- ✅ "로그인 성공!" 알림
- ✅ 메인 화면 진입
- ✅ 우측 상단에 "홍길동" 표시
- ✅ Console에 CORS 오류 없음
- ✅ Network 탭에서 exec 요청 200 OK

---

### 테스트 2: 컨설턴트 로그인

**로그인 정보:**
- 회원 구분: **사근복 컨설턴트**
- ID(핸드폰번호): `01087654321`
- 비밀번호: `12345`

**예상 결과:**
- ✅ "로그인 성공!" 알림
- ✅ 메인 화면 진입
- ✅ 우측 상단에 "김전문 - 수석" 표시

---

### 테스트 3: 로그인 실패 케이스

**잘못된 비밀번호:**
- ID: `01012345678`
- 비밀번호: `wrongpassword`

**예상 결과:**
- ⚠️ "ID 또는 비밀번호가 일치하지 않습니다." 알림

---

## 🔍 개발자 도구 확인 사항

### Console 탭
```
기대: 오류 없음 (또는 로그인 성공 로그만)

❌ 이전:
Access to fetch at 'https://script.google.com/...' 
from origin 'http://3.34.186.174' 
has been blocked by CORS policy

✅ 이후:
(CORS 오류 없음)
```

### Network 탭
```
1. exec 요청 찾기
2. Status Code: 200 OK
3. Response 탭:
   {
     "success": true,
     "user": {
       "userType": "company",
       "userId": "01012345678",
       "name": "홍길동",
       "companyName": "(주)테스트",
       "email": "test@company.com"
     }
   }
```

---

## 📊 Google Sheets 확인

### 로그인기록 시트
로그인 성공 시 새로운 행 추가 확인:

| 열 | 예상 값 |
|---|---|
| A | 2026-01-20 15:xx:xx |
| B | 기업회원 |
| C | 01012345678 |
| D | 홍길동 |
| E | (주)테스트 |
| F | success |
| G | (빈칸) |

### 기업회원 시트
마지막로그인 업데이트 확인:

| 열 | 예상 값 |
|---|---|
| H | 2026-01-20 15:xx:xx |

---

## ✅ 성공 체크리스트

### Apps Script
- [ ] 배포 관리에서 "새 버전" 배포 완료
- [ ] 배포 설명: "CORS 완전 수정 v6"
- [ ] 액세스 권한: "모든 사용자" 유지
- [ ] 5-10분 대기

### 브라우저
- [ ] 캐시 완전 삭제
- [ ] 브라우저 재시작
- [ ] 시크릿/개인정보 보호 모드 사용
- [ ] F12 개발자 도구 열기

### 로그인 테스트
- [ ] http://3.34.186.174 접속
- [ ] 기업회원 로그인 시도
- [ ] Console에 CORS 오류 없음 확인
- [ ] Network에서 200 OK 확인
- [ ] 로그인 성공 알림 확인
- [ ] 메인 화면 진입 확인

### Google Sheets
- [ ] 로그인기록 시트에 새 행 추가됨
- [ ] 기업회원 시트의 마지막로그인 업데이트됨

---

## 🚨 문제 발생 시

### CORS 오류 지속
1. Apps Script 배포 URL 직접 접속
   - https://script.google.com/macros/s/AKfycbxMcJ82NqcvWOh5ODzo9ZyQ0zxotgT5oKRJL9CH66JGuNi2V7WpT7XI4CRYWYb11WOB/exec
   - 기대 응답: `{"status":"ok","message":"Sagunbok Auth API is running","timestamp":"..."}`
   - 만약 오류 발생 → 권한 재승인 필요

2. 15분 이상 대기 후 재시도

3. 완전히 새로운 배포 생성
   - 배포 → 새 배포
   - 유형: 웹 앱
   - 액세스 권한: 모든 사용자
   - 새 URL로 프런트엔드 업데이트

---

## 📸 스크린샷 요청 (문제 지속 시)

1. **브라우저 Console 탭**
   - CORS 오류 메시지 전체

2. **Network 탭 → exec 요청**
   - Headers 탭
   - Response 탭
   - Preview 탭

3. **Apps Script 배포 URL 직접 접속 결과**

4. **Google Sheets 로그인기록 시트**
   - 최근 5개 행

---

## 🎯 최종 목표

```
✅ 웹사이트에서 로그인 성공
✅ CORS 오류 없음
✅ 메인 화면 진입
✅ 계산기 기능 사용 가능
```

---

## 📞 연락

문제가 지속되면 다음 정보와 함께 문의:
- Apps Script 배포 URL 직접 접속 결과
- 브라우저 Console/Network 스크린샷
- Google Sheets 로그인기록 스크린샷
