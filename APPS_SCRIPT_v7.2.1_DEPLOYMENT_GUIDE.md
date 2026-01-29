# Apps Script v7.2.1 배포 가이드

## 📦 버전 정보

- **버전**: v7.2.1
- **배포일**: 2026-01-28
- **변경사항**: `doPost` 함수 추가 (POST 요청 지원)

---

## 🔧 주요 변경사항

### 1. `doPost` 함수 추가

```javascript
/**
 * POST 요청 처리
 */
function doPost(e) {
  return doGet(e);
}
```

**이유**: Frontend에서 POST 요청으로 데이터를 전송하는데, 기존에는 `doGet`만 있어서 실패했습니다.

---

## 📋 배포 절차

### 1단계: Google Sheets 열기

https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc

### 2단계: Apps Script 에디터 열기

1. 상단 메뉴 → **확장 프로그램** → **Apps Script**
2. 새 창이 열립니다

### 3단계: 기존 코드 삭제

1. 왼쪽 파일 목록에서 `Code.gs` 클릭
2. `Ctrl+A` (전체 선택)
3. `Delete` (삭제)

### 4단계: 새 코드 붙여넣기

1. `/home/user/webapp/APPS_SCRIPT_v7.2.1_WITH_DOPOST.gs` 파일 내용 복사
2. Apps Script 에디터에 붙여넣기
3. `Ctrl+S` (저장)

### 5단계: 새 배포 생성

1. 상단 **배포** → **새 배포** 클릭
2. **설명** 입력: `v7.2.1 - POST 요청 지원`
3. **실행 계정**: `나` (본인 이메일)
4. **액세스 권한**: `모든 사용자`
5. **배포** 클릭

### 6단계: 권한 승인 (필요 시)

1. "권한 검토" 클릭
2. Google 계정 선택
3. "고급" → "프로젝트로 이동(안전하지 않음)" 클릭
4. "허용" 클릭

### 7단계: 배포 URL 확인

```
https://script.google.com/macros/s/AKfycby.../exec
```

**중요**: 이 URL을 복사해두세요!

---

## 🧪 테스트

### 1. 간단한 테스트

```bash
curl -sL "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=test"
```

**기대 결과**:
```json
{"success":false,"error":"알 수 없는 액션입니다"}
```

### 2. 기업회원 가입 테스트

```bash
curl -sL -X POST "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=registerCompany&businessNumber=2208162708&companyName=에스텍시스템&ceoName=김철수&companyType=법인&position=재무담당자&name=홍길동&phone=010-9999-8888&email=test@sagunbok.com&password=1234&referrer=010-6352-9091"
```

**기대 결과**:
```json
{
  "success": true,
  "message": "가입 신청이 완료되었습니다. 승인 후 이용 가능합니다."
}
```

### 3. Google Sheets 확인

1. **기업회원** 시트 열기
2. 최신 행 확인:
   - A: 01099998888 (normalized phone)
   - B: 2208162708 (사업자번호)
   - C: 홍길동 (이름)
   - D: 김철수 (대표자명)
   - E: test@sagunbok.com (이메일)
   - F: 재무담당자 (직함)
   - G: (해시된 비밀번호)
   - H: 에스텍시스템 (회사명)
   - I: 법인 (기업회원분류)
   - J: N (승인여부)
   - K: (가입일시)
   - L: 01063529091 (추천인)

---

## 🔗 Frontend 업데이트

새 배포 URL을 Frontend에 반영해야 합니다:

```typescript
// components/Auth.tsx
const API_URL = 'https://script.google.com/macros/s/NEW_DEPLOYMENT_ID/exec';
```

---

## ✅ 완료!

배포가 완료되면:

1. Google Sheets에 데이터가 정상적으로 저장됩니다
2. Frontend에서 회원가입이 작동합니다
3. 사업자번호 조회 → 회사명/대표자명 자동완성이 작동합니다

---

**문의사항이 있으면 PR 코멘트로 남겨주세요!**
