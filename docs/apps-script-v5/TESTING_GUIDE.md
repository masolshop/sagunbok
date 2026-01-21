# 🧪 Apps Script V5 테스트 가이드 (사용자 실행용)

**작성일**: 2026-01-21  
**버전**: V5 (FINAL)  
**상태**: ⚠️ Apps Script V5 배포 필요 (현재 URL 만료/미배포)

---

## ⚠️ 현재 상태

### 확인된 사항
- ✅ Apps Script V5 코드 완성 (`/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5_FINAL.js`)
- ✅ 5가지 요구사항 모두 구현 완료
- ✅ 자동 테스트 함수 포함 (`runAllTests`, `validateSheetStructure`)
- ❌ **Apps Script 미배포 상태** (현재 URL: 만료 또는 404)
- ❌ 프론트엔드 테스트 불가 (Apps Script 배포 필요)

### 다음 단계
**사용자가 직접 Apps Script V5를 배포한 후 테스트를 진행해야 합니다.**

---

## 📋 배포 전 준비사항 (Google Sheets)

### 1. 사근복컨설턴트 시트에 테스트 데이터 추가

**사근복컨설턴트 시트 > 2행**:
```
김철수	010-9876-5432	kim@sagunbok.com	수석 컨설턴트	의료사업부	12345	서울지사	2026-01-20 10:00:00
```

**복사용 (Tab 구분)**:
```
김철수	010-9876-5432	kim@sagunbok.com	수석 컨설턴트	의료사업부	12345	서울지사	2026-01-20 10:00:00
```

**입력 방법**:
1. Google Sheets > 사근복컨설턴트 시트 선택
2. 2행 A열 클릭
3. 위의 Tab 구분 텍스트 복사 (Ctrl+C)
4. 붙여넣기 (Ctrl+V)
5. Enter 키

---

### 2. 기업회원 시트 헤더 확인

**1행 (복사용)**:
```
핸드폰번호	회사명	기업유형	이름	이메일	비밀번호	추천인	가입일시	승인상태		마지막로그인
```

**확인 사항**:
- A1: `핸드폰번호` (오타 주의: ~~렌드폰번호~~)
- K1: `마지막로그인` (L1이 아님!)
- J1: 비어있음

---

## 🚀 Apps Script V5 배포 (5분)

### STEP 1: Apps Script 에디터 열기
1. Google Sheets 열기 (사근복 프로젝트)
2. 상단 메뉴: **확장 프로그램** → **Apps Script**

### STEP 2: V5 코드 복사 및 붙여넣기
1. **기존 코드 전체 삭제** (Ctrl+A → Delete)
2. **V5 코드 가져오기**:
   - 파일 경로: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5_FINAL.js`
   - 또는 아래 명령어로 출력:
     ```bash
     cat /home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5_FINAL.js
     ```
3. **전체 복사** (Ctrl+C)
4. **Apps Script 에디터에 붙여넣기** (Ctrl+V)
5. **저장** (Ctrl+S)

### STEP 3: 자동 테스트 실행
1. 상단 메뉴: **실행** → **함수 선택** → **`runAllTests`**
2. **실행** 버튼 클릭
3. **권한 승인** (최초 1회):
   - "권한 검토" 클릭
   - Google 계정 선택
   - "고급" → "프로젝트로 이동(안전하지 않음)" 클릭
   - "허용" 클릭
4. **로그 확인** (Ctrl+Enter 또는 **보기** → **로그**):
   ```
   🧪 Sagunbok Apps Script V5 자동 테스트 시작
   
   📱 테스트 1: 전화번호 포맷팅
   ✅ PASS: formatPhone("01012345678") = "010-1234-5678"
   ✅ PASS: normalizePhone("010-1234-5678") = "01012345678"
   
   🔍 테스트 2: 추천인 검증 (실패 케이스)
   ✅ PASS: 잘못된 추천인으로 가입 차단됨
   
   📊 테스트 결과
   ✅ 통과: 5개
   ❌ 실패: 0개
   ```

### STEP 4: 웹 앱으로 배포
1. 상단 우측: **배포** → **새 배포**
2. 설정:
   - **유형 선택**: ⚙️ 아이콘 클릭 → **웹 앱** 선택
   - **설명**: `Sagunbok Auth V5`
   - **실행 계정**: **나**
   - **액세스 권한**: **모든 사용자**
3. **배포** 버튼 클릭
4. **웹 앱 URL 복사** (중요!):
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
   ⚠️ **이 URL을 잘 보관하세요!**

---

## 🧪 테스트 시나리오 (5가지)

### 사전 준비
1. ✅ Google Sheets > 사근복컨설턴트 시트 > 2행: "김철수" 추가됨
2. ✅ Google Sheets > 기업회원 시트 > 1행: 헤더 확인
3. ✅ Google Sheets > 기업회원 시트 > 2행 이하: 기존 데이터 삭제 (백업 권장)
4. ✅ Apps Script V5 배포 완료
5. ✅ 웹 앱 URL 확보

---

### 테스트 1: 정상 회원가입 ✅

**입력 데이터**:
```json
{
  "action": "registerCompany",
  "companyName": "AI테스트병원",
  "companyType": "병의원개인사업자",
  "name": "AI테스터",
  "phone": "01099887766",
  "email": "ai-test@hospital.com",
  "password": "test1234",
  "referrer": "김철수"
}
```

**테스트 방법 1: curl 명령어**:
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_V5_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "companyName": "AI테스트병원",
    "companyType": "병의원개인사업자",
    "name": "AI테스터",
    "phone": "01099887766",
    "email": "ai-test@hospital.com",
    "password": "test1234",
    "referrer": "김철수"
  }'
```

**테스트 방법 2: 프론트엔드 (http://3.34.186.174)**:
1. 기업회원 가입 클릭
2. 입력:
   ```
   회사명: AI테스트병원
   기업유형: 병의원개인사업자
   이름: AI테스터
   전화번호: 01099887766  ← 하이픈 없이 입력
   이메일: ai-test@hospital.com
   비밀번호: test1234
   추천인: 김철수
   ```
3. 가입하기 클릭

**예상 결과**:
```json
{
  "success": true,
  "message": "회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다."
}
```

**Google Sheets 확인 (기업회원 시트 > 마지막 행)**:
```
A: 010-9988-7766      ← 하이픈 포함 저장 ✅
B: AI테스트병원
C: 병의원개인사업자
D: AI테스터
E: ai-test@hospital.com
F: test1234
G: 김철수            ← 추천인 저장됨 ✅
H: 2026-01-21 XX:XX:XX
I: 승인전표           ← 초기 상태
J: (비어있음)
K: (비어있음)         ← 로그인 전까지 비어있음
```

---

### 테스트 2: 추천인 검증 실패 ❌

**입력 데이터**:
```json
{
  "action": "registerCompany",
  "companyName": "실패테스트병원",
  "companyType": "법인",
  "name": "실패테스터",
  "phone": "01012341234",
  "email": "fail@test.com",
  "password": "test1234",
  "referrer": "존재하지않는컨설턴트"
}
```

**curl 명령어**:
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_V5_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "companyName": "실패테스트병원",
    "companyType": "법인",
    "name": "실패테스터",
    "phone": "01012341234",
    "email": "fail@test.com",
    "password": "test1234",
    "referrer": "존재하지않는컨설턴트"
  }'
```

**예상 결과**:
```json
{
  "success": false,
  "error": "추천인 정보가 올바르지 않습니다. 사근복컨설턴트 명단에 등록된 이름을 입력해주세요."
}
```

**Google Sheets 확인**:
- 기업회원 시트에 데이터 **추가되지 않음** ✅

---

### 테스트 3: 중복 전화번호 차단 ❌

**입력 데이터**:
```json
{
  "action": "registerCompany",
  "companyName": "중복테스트병원",
  "companyType": "법인",
  "name": "중복테스터",
  "phone": "01099887766",
  "email": "dup@test.com",
  "password": "test5678",
  "referrer": "김철수"
}
```

**curl 명령어**:
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_V5_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "companyName": "중복테스트병원",
    "companyType": "법인",
    "name": "중복테스터",
    "phone": "01099887766",
    "email": "dup@test.com",
    "password": "test5678",
    "referrer": "김철수"
  }'
```

**예상 결과**:
```json
{
  "success": false,
  "error": "이미 가입된 핸드폰 번호입니다."
}
```

**Google Sheets 확인**:
- 기업회원 시트에 데이터 **추가되지 않음** ✅

---

### 테스트 4: 로그인 (하이픈 없이) ✅

**사전 작업**:
1. Google Sheets > 기업회원 시트
2. "AI테스터" 행 찾기
3. I열 (승인상태): `승인전표` → `승인완료` 변경
4. Enter 키

**입력 데이터**:
```json
{
  "action": "loginCompany",
  "phone": "01099887766",
  "password": "test1234"
}
```

**curl 명령어**:
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_V5_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "loginCompany",
    "phone": "01099887766",
    "password": "test1234"
  }'
```

**예상 결과**:
```json
{
  "success": true,
  "message": "로그인 성공",
  "userData": {
    "phone": "010-9988-7766",
    "companyName": "AI테스트병원",
    "companyType": "병의원개인사업자",
    "name": "AI테스터",
    "email": "ai-test@hospital.com",
    "referrer": "김철수",
    "registeredAt": "2026-01-21 XX:XX:XX",
    "approvalStatus": "승인완료",
    "lastLogin": "2026-01-21 YY:YY:YY"
  }
}
```

**Google Sheets 확인 (기업회원 시트 > AI테스터 행)**:
```
K열: 2026-01-21 YY:YY:YY  ← 로그인 시간 자동 업데이트 ✅
```

---

### 테스트 5: 로그인 (하이픈 포함) ✅

**입력 데이터**:
```json
{
  "action": "loginCompany",
  "phone": "010-9988-7766",
  "password": "test1234"
}
```

**curl 명령어**:
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_V5_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "loginCompany",
    "phone": "010-9988-7766",
    "password": "test1234"
  }'
```

**예상 결과**:
```json
{
  "success": true,
  "message": "로그인 성공",
  "userData": { ... }
}
```

**Google Sheets 확인**:
```
K열: 2026-01-21 ZZ:ZZ:ZZ  ← 로그인 시간 재업데이트 ✅
```

---

## ✅ 테스트 체크리스트

### 배포 전 준비
- [ ] 사근복컨설턴트 시트 > 2행: "김철수" 추가
- [ ] 기업회원 시트 > 1행: 헤더 확인 (A1=핸드폰번호, K1=마지막로그인)
- [ ] 기업회원 시트 > 2행 이하: 기존 데이터 삭제 (백업 권장)

### Apps Script 배포
- [ ] Apps Script 에디터에 V5 코드 복사
- [ ] 저장 (Ctrl+S)
- [ ] `runAllTests` 실행 → 로그 확인 (모든 테스트 통과)
- [ ] 웹 앱으로 배포 (실행: 나, 액세스: 모든 사용자)
- [ ] 웹 앱 URL 복사 및 보관

### 테스트 실행
- [ ] 테스트 1: 정상 회원가입 → 시트에 하이픈 포함 저장 확인
- [ ] 테스트 2: 추천인 검증 실패 → 가입 차단 확인
- [ ] 테스트 3: 중복 전화번호 → 가입 차단 확인
- [ ] 테스트 4: 로그인 (하이픈 없이) → 성공 + K열 업데이트 확인
- [ ] 테스트 5: 로그인 (하이픈 포함) → 성공 + K열 재업데이트 확인

---

## 🚨 문제 해결

### Q1. "Page Not Found" 오류
**원인**: Apps Script가 배포되지 않았거나 URL이 잘못됨

**해결**:
1. Apps Script 에디터 > **배포** → **배포 관리**
2. 최신 배포 확인 (V5)
3. 웹 앱 URL 재확인 및 복사

---

### Q2. 테스트 실행 시 "권한 없음"
**해결**:
1. Apps Script 에디터 > **실행** > **`runAllTests`**
2. 권한 승인 팝업:
   - "고급" 클릭
   - "프로젝트로 이동(안전하지 않음)" 클릭
   - "허용" 클릭

---

### Q3. curl 명령어로 HTML이 반환됨
**원인**: 리다이렉트 발생

**해결**:
```bash
# -L 옵션 추가
curl -L -X POST "https://script.google.com/macros/s/YOUR_V5_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

### Q4. 회원가입 후 시트에 데이터가 이상하게 저장됨
**원인**: V5가 아닌 이전 버전 사용 중

**해결**:
1. Apps Script 에디터에서 코드 전체 확인
2. 파일 최상단 주석 확인:
   ```javascript
   /**
    * Sagunbok Apps Script - VERSION 5 (FINAL)
    * 작성일: 2026-01-21
    */
   ```
3. V5가 아니면 재복사 및 재배포

---

## 📊 예상 결과 요약

| 테스트 | 입력 | 예상 결과 | 시트 변화 |
|--------|------|-----------|----------|
| 1. 정상 가입 | 추천인=김철수 | ✅ 성공 | A~I열 데이터 추가 (A열에 010-9988-7766) |
| 2. 추천인 실패 | 추천인=존재안함 | ❌ 차단 | 데이터 추가 안됨 |
| 3. 중복 번호 | phone=01099887766 | ❌ 차단 | 데이터 추가 안됨 |
| 4. 로그인 (하이픈 X) | phone=01099887766 | ✅ 성공 | K열 시간 추가 |
| 5. 로그인 (하이픈 O) | phone=010-9988-7766 | ✅ 성공 | K열 시간 재업데이트 |

---

## 🎉 완료 기준

**모든 테스트가 통과하면 Apps Script V5가 정상 작동하는 것입니다!**

✅ 체크리스트:
- [ ] 5가지 테스트 모두 예상 결과와 일치
- [ ] Google Sheets 데이터가 올바른 열에 저장됨
- [ ] 전화번호 형식: 010-1234-5678 (하이픈 포함)
- [ ] 추천인 검증 및 중복 체크 작동
- [ ] 로그인 시 K열에 시간 자동 업데이트

---

**작성일**: 2026-01-21  
**버전**: V5 (FINAL)  
**상태**: ⚠️ 사용자 배포 필요  
**다음 단계**: Apps Script V5 배포 → 5가지 테스트 실행
