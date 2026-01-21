# Apps Script CORS 문제 해결 가이드

## 🔍 문제 증상
- 브라우저 Console에서 CORS 오류 발생
- `Access to fetch at 'https://script.google.com/...' from origin 'http://3.34.186.174' has been blocked by CORS policy`
- Apps Script 내부 테스트(`testLoginCompany`)는 성공
- 웹 브라우저에서의 API 호출은 실패

## 🎯 근본 원인
Google Apps Script 웹 앱의 **"액세스 권한"** 설정이 잘못됨

## ✅ 해결 방법

### 방법 1: 기존 배포 수정 (URL 유지)

1. **Apps Script 편집기 열기**
   - Google Sheets: https://docs.google.com/spreadsheets/d/1PmVNfdxXrYSKAWgYLAywqo0IJXTPPL7eJnLd14-_vaU/edit
   - 상단 메뉴: 확장 프로그램 → Apps Script

2. **배포 관리**
   - 상단 메뉴: 배포 → 배포 관리

3. **기존 배포 수정**
   - 현재 배포 옆 ✏️ (연필) 클릭
   - 버전: **새 버전** 선택
   - 설명: `액세스 권한 수정 v5`

4. **핵심 설정 확인**
   - 실행 권한: `나` (masolshopceo@gmail.com)
   - **액세스 권한: `모든 사용자`** ← 가장 중요!

5. **배포** 클릭

6. **기존 URL 유지됨**
   - https://script.google.com/macros/s/AKfycbxMcJ82NqcvWOh5ODzo9ZyQ0zxotgT5oKRJL9CH66JGuNi2V7WpT7XI4CRYWYb11WOB/exec

---

### 방법 2: 새 배포 생성 (새 URL 발급)

1. **Apps Script 편집기 열기**

2. **새 배포**
   - 상단 메뉴: 배포 → 새 배포

3. **유형 선택**
   - ⚙️ (톱니바퀴) 클릭
   - **웹 앱** 선택

4. **설정**
   - 설명: `사근복 인증 API v6`
   - 실행 권한: `나`
   - **액세스 권한: `모든 사용자`** ← 필수!

5. **배포** 클릭

6. **새 웹 앱 URL 복사**
   - 예: `https://script.google.com/macros/s/NEW_DEPLOYMENT_ID/exec`

7. **프런트엔드 코드 업데이트 필요**
   - `/home/user/webapp/components/Auth.tsx`의 `BACKEND_URL` 변경
   - 재빌드 및 재배포 필요

---

## 🔑 액세스 권한 옵션 설명

| 옵션 | CORS 지원 | 외부 접근 | 권장 |
|------|----------|---------|------|
| **모든 사용자** | ✅ | ✅ | ⭐ 권장 |
| Google 계정이 있는 사용자 | ❌ | 제한적 | ❌ |
| 조직 내 사용자만 | ❌ | ❌ | ❌ |

---

## 📊 테스트 절차

### 1️⃣ 배포 설정 변경 후

### 2️⃣ 5-10분 대기
Google Apps Script 변경사항 반영 시간

### 3️⃣ 브라우저 캐시 삭제
- `Ctrl + Shift + Del` (윈도우)
- `Cmd + Shift + Del` (Mac)
- "캐시된 이미지 및 파일" 선택
- "전체 기간" 선택
- 삭제 → 브라우저 재시작

### 4️⃣ 시크릿/개인정보 보호 모드로 테스트
- `Ctrl + Shift + N` (Chrome/Edge)
- `Ctrl + Shift + P` (Firefox)

### 5️⃣ 웹사이트 접속 및 로그인
- http://3.34.186.174
- 회원 구분: 기업회원
- ID: `01012345678`
- 비밀번호: `test1234`

### 6️⃣ 개발자 도구(F12) 확인
- **Console 탭**: CORS 오류가 사라졌는지 확인
- **Network 탭**: `exec` 요청이 200 OK인지 확인

---

## 🚨 중요 참고사항

### CORS 오류의 핵심 원인
```
Google Apps Script의 CORS 지원은
"액세스 권한: 모든 사용자" 설정에 의존합니다.

이 설정이 없으면:
- OPTIONS preflight 요청 실패
- 브라우저가 실제 요청을 차단
- "blocked by CORS policy" 오류 발생
```

### 배포 URL 변경 시
새 배포를 만들면 URL이 변경되므로:
1. 새 URL 복사
2. `Auth.tsx`의 `BACKEND_URL` 업데이트
3. `npm run build` 실행
4. AWS에 재배포
5. 테스트

---

## ✅ 성공 확인

다음 조건을 모두 만족하면 성공:

- [ ] Apps Script 배포 설정: "액세스 권한 = 모든 사용자"
- [ ] 브라우저 Console에 CORS 오류 없음
- [ ] Network 탭에서 `exec` 요청 200 OK
- [ ] 로그인 성공 메시지 표시
- [ ] 메인 화면 진입

---

## 📞 문제 지속 시

배포 관리 화면 스크린샷 공유:
- 특히 "액세스 권한" 부분
- 전체 배포 설정

---

## 📚 관련 문서
- CORS_FIX_GUIDE.md
- GETCURRENTTIMESTAMP_FIX.md
- AUTH_ACTIVATION_COMPLETE.md
