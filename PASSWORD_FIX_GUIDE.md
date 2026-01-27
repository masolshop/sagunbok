# 🔧 비밀번호 로그인 버그 수정 가이드

## 📋 문제 설명

### 🐛 발견된 버그
- **증상**: 모든 로그인 시도가 "전화번호 또는 비밀번호가 일치하지 않습니다" 오류 발생
- **원인**: Apps Script에서 비밀번호 비교 시 타입 불일치
  - 시트에 저장된 비밀번호: `12345` (숫자 타입)
  - 로그인 시 입력된 비밀번호: `"12345"` (문자열 타입)
  - 비교 연산: `12345 === "12345"` → `false` ❌

### 📍 문제 발생 위치
**APPS_SCRIPT_v7.1.1_WITH_LOGGING.gs**:
- **392번 라인** (loginCompany): `data[i][6] === password`
- **436번 라인** (loginConsultant): `data[i][6] === password`

---

## ✅ 해결 방법

### 🔧 수정 내용
비밀번호 비교 시 **양쪽을 문자열로 변환**:

```javascript
// ❌ 기존 코드 (v7.1.1)
if (isSamePhone(data[i][4], phone) && data[i][6] === password) {
  // ...
}

// ✅ 수정 코드 (v7.1.2)
if (isSamePhone(data[i][4], phone) && String(data[i][6]) === String(password)) {
  // ...
}
```

### 📦 수정된 파일
- **파일명**: `APPS_SCRIPT_v7.1.2_PASSWORD_FIX.gs`
- **버전**: v7.1.2
- **변경 사항**:
  1. loginCompany 함수 (라인 392)
  2. loginConsultant 함수 (라인 436)
  3. 버전 번호 업데이트 (헤더 주석)

---

## 🚀 배포 절차

### 1️⃣ Apps Script 에디터 열기
👉 https://script.google.com

1. 프로젝트 선택: **사근복 AI**
2. 기존 코드 전체 선택 (Ctrl + A)
3. 삭제 (Delete)

### 2️⃣ 수정된 코드 붙여넣기
1. `/home/user/webapp/APPS_SCRIPT_v7.1.2_PASSWORD_FIX.gs` 파일 열기
2. 전체 내용 복사
3. Apps Script 에디터에 붙여넣기
4. 저장 (Ctrl + S)

### 3️⃣ 새 배포 생성
1. **배포** → **새 배포** 클릭
2. **유형 선택**: 웹 앱
3. **설명**: `v7.1.2 - Password type fix`
4. **실행 사용자**: 본인
5. **액세스 권한**: 모든 사용자 (익명 포함)
6. **배포** 버튼 클릭
7. **새 배포 URL 복사** (예: `https://script.google.com/macros/s/AKfycbz.../exec`)

### 4️⃣ 프론트엔드 API URL 업데이트
1. `/home/user/webapp/components/AdminView.tsx` 수정
2. `/home/user/webapp/components/Auth.tsx` 수정
3. 새 API URL로 교체

### 5️⃣ 빌드 & 배포
```bash
cd /home/user/webapp
npm run build
scp -i lightsail-key.pem -r dist/* ubuntu@3.34.186.174:/var/www/sagunbok/
ssh -i lightsail-key.pem ubuntu@3.34.186.174 'sudo systemctl restart nginx'
```

---

## ✅ 테스트 계획

### 1️⃣ API 직접 테스트
```bash
# 슈퍼관리자 로그인 (비밀번호: 12345)
curl "https://script.google.com/macros/s/[NEW_API_URL]/exec?action=loginCompany&phone=01063529091&password=12345"

# 컨설턴트 로그인 (비밀번호: consultant1234)
curl "https://script.google.com/macros/s/[NEW_API_URL]/exec?action=loginConsultant&phone=01077776666&password=consultant1234&userType=consultant"
```

### 2️⃣ 예상 결과
```json
{
  "success": true,
  "userData": {
    "name": "이종근",
    "phone": "01063529091",
    "companyName": "페마연",
    "userType": "company"
  }
}
```

### 3️⃣ 실제 화면 테스트
1. https://sagunbok.com 접속
2. 로그인 버튼 클릭
3. 전화번호: `01063529091`
4. 비밀번호: `12345`
5. 로그인 → ADMIN DASHBOARD 진입 확인

---

## 📊 변경 사항 요약

### 코드 변경
| 파일 | 라인 | 변경 전 | 변경 후 |
|------|------|---------|---------|
| loginCompany | 392 | `data[i][6] === password` | `String(data[i][6]) === String(password)` |
| loginConsultant | 436 | `data[i][6] === password` | `String(data[i][6]) === String(password)` |
| 헤더 주석 | 1-14 | v7.1.1 | v7.1.2 - Password type fix |

### 지원하는 비밀번호 형식
- ✅ 숫자 타입: `12345` (시트에서 숫자로 입력)
- ✅ 문자열 타입: `"12345"` (시트에서 문자열로 입력)
- ✅ 혼합 형식: `consultant1234`, `femayeon1234` 등

---

## 🔍 추가 확인 사항

### 시트 비밀번호 확인
👉 [구글 시트 열기](https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit)

#### 기업회원 시트 (G열: 비밀번호)
- 이종근 (01063529091): `12345`
- 김민수 (01063850700): `12345`
- 홍길동 (01099998888): `test1234`
- 이사장 (01044443333): `test1234`

#### 매니저 시트 (G열: 비밀번호)
- 김매니저 (01088887777): `manager1234`
- 최부산매니저 (01066665555): `busan1234`

#### 컨설턴트 시트 (G열: 비밀번호)
- 박컨설턴트 (01077776666): `consultant1234`
- 정페마연컨설턴트 (01055554444): `femayeon1234`

---

## 📋 로그 확인

### 로그 시트
배포 후 로그인 시도 시 다음 로그가 기록됩니다:

```
타임스탬프 | 액션 | 회원타입 | 전화번호 | 상태 | 메시지
---------------------------------------------------------
2026-01-25 21:XX:XX | loginCompany | company | 01063529091 | START | 기업회원 로그인 시도
2026-01-25 21:XX:XX | loginCompany | company | 01063529091 | SUCCESS | 로그인 성공: 페마연
```

---

## ⚠️ 주의사항

### 배포 후 필수 작업
1. ✅ 새 API URL 복사
2. ✅ 프론트엔드 코드 업데이트
3. ✅ 빌드 & EC2 배포
4. ✅ Nginx 재시작
5. ✅ 로그인 테스트

### 캐시 이슈
- 브라우저 캐시: Ctrl + Shift + R (강제 새로고침)
- Apps Script 배포: 새 배포 URL 사용

---

## 🎯 다음 단계

1. ✅ Apps Script v7.1.2 배포
2. ✅ API 테스트 (curl)
3. ✅ 프론트엔드 업데이트
4. ✅ EC2 배포
5. ✅ 실제 화면 로그인 테스트
6. ✅ AdminView 기능 테스트
7. ✅ Git 커밋 & PR 업데이트

---

**작성일**: 2026-01-25  
**버전**: v7.1.2  
**작성자**: AI Assistant
