# 🔍 구글 시트 로그인 문제 진단 보고서

## 📋 현재 상황

### ✅ 확인된 사항
1. **Apps Script 배포**: v6.2.5 정상 배포됨
   - URL: https://script.google.com/macros/s/AKfycbxlweZ9_ZoDG9Qi2UVlTUXYyJSQwnhRhy9CDE1rzG3-77_0F5ZbATyjhudAgxEqgOyA/exec
   - Spreadsheet ID: `1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc`

2. **API 응답**: 정상 작동 중
   ```json
   {"success":false,"error":"승인 대기 중입니다."}
   ```
   → API는 정상적으로 구글 시트에 접근하고 데이터를 읽고 있음

3. **프론트엔드**: EC2 배포 완료
   - URL: http://3.34.186.174/
   - 최신 빌드: `index-DUJba_FA.js`

### ❌ 문제 증상
- **로그인 실패**: 시크릿 창에서 로그인 시도 시 실패
- **응답**: "승인 대기 중입니다."
- **구글 시트 로그**: 로그가 기록되지 않음

## 🔍 문제 분석

### 가능한 원인

#### 1. **승인 상태 문제** (가장 유력)
현재 Apps Script는 구글 시트에서 **승인상태** 컬럼을 확인합니다:
```javascript
const approvalStatus = String(row[7]).trim();  // 8번째 컬럼 (H열)

if (approvalStatus !== '승인') {
  return {
    success: false,
    error: '승인 대기 중입니다.'
  };
}
```

**확인 필요**:
- 구글 시트 '기업회원' 시트에서 전화번호 `01063529091`의 승인상태가 "승인"인지 확인

#### 2. **컬럼 매핑 문제**
현재 코드의 컬럼 매핑:
```
row[0]: 회사명
row[1]: 기업회원분류
row[2]: 추천인
row[3]: 이름
row[4]: 전화번호  ← 로그인 시 검색
row[5]: 이메일
row[6]: 비밀번호
row[7]: 승인상태  ← 승인 확인
row[8]: 가입일
```

**확인 필요**:
- 실제 구글 시트의 컬럼 순서가 위와 일치하는지 확인

#### 3. **로그 기능 제거**
v6.2.3부터 로그 기능이 제거되어 구글 시트에 로그가 기록되지 않습니다.
- 이는 SpreadsheetApp 권한 문제 해결을 위한 조치였습니다.

## 🛠️ 해결 방법

### 방법 1: 구글 시트에서 직접 확인 (가장 빠름)

1. **구글 시트 열기**
   ```
   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
   ```

2. **'기업회원' 시트 선택**

3. **전화번호 `01063529091` 찾기**
   - Ctrl+F로 검색
   - 해당 행을 찾음

4. **승인상태 컬럼 확인**
   - H열(8번째 컬럼)의 값이 **정확히 "승인"**인지 확인
   - 공백이나 다른 문자가 없는지 확인

5. **값 수정**
   ```
   변경 전: "대기" 또는 "승인대기" 또는 "pending"
   변경 후: "승인"
   ```

### 방법 2: 진단 스크립트 실행

1. **Apps Script 에디터 열기**
   - 구글 시트에서 확장 프로그램 → Apps Script

2. **진단 함수 추가**
   - `/home/user/webapp/APPS_SCRIPT_DIAGNOSE.js` 파일의 `diagnoseSheet()` 함수를 복사
   - Apps Script 에디터에 붙여넣기

3. **실행**
   - 함수 선택: `diagnoseSheet`
   - 실행 버튼 클릭 ▶
   - 실행 로그 확인 (Ctrl+Enter)

4. **로그 분석**
   - 헤더 컬럼 순서 확인
   - 전화번호 `01063529091`이 있는지 확인
   - 해당 행의 모든 데이터 확인

### 방법 3: API 직접 테스트

터미널에서 실행:
```bash
# 현재 상태 테스트
curl -L 'https://script.google.com/macros/s/AKfycbxlweZ9_ZoDG9Qi2UVlTUXYyJSQwnhRhy9CDE1rzG3-77_0F5ZbATyjhudAgxEqgOyA/exec?action=loginCompany&phone=01063529091&password=12345'

# 예상 결과 (승인 전)
{"success":false,"error":"승인 대기 중입니다."}

# 예상 결과 (승인 후)
{"success":true,"user":{"userType":"company","companyName":"페마연",...}}
```

## 📊 컬럼 구조 확인

### 기업회원 시트 예상 구조

| 인덱스 | 컬럼명 | 예시 값 |
|--------|--------|---------|
| 0 | 회사명 | 페마연 |
| 1 | 기업회원분류 | 법인 |
| 2 | 추천인 | 이종근 |
| 3 | 이름 | 이종근 |
| 4 | 전화번호 | 01063529091 |
| 5 | 이메일 | tysagunbok@gmail.com |
| 6 | 비밀번호 | 12345 |
| 7 | 승인상태 | **승인** ← 이 값이 정확히 "승인"이어야 함 |
| 8 | 가입일 | 2026-01-24 |

## 🎯 다음 단계

### 즉시 수행할 작업

1. **[최우선]** 구글 시트에서 승인상태 확인 및 수정
   - 전화번호 `01063529091` 행의 H열을 "승인"으로 변경

2. **로그인 재테스트**
   ```bash
   curl -L 'https://script.google.com/macros/s/AKfycbxlweZ9_ZoDG9Qi2UVlTUXYyJSQwnhRhy9CDE1rzG3-77_0F5ZbATyjhudAgxEqgOyA/exec?action=loginCompany&phone=01063529091&password=12345'
   ```

3. **프론트엔드 테스트**
   - http://3.34.186.174/ 접속
   - 시크릿 창에서 로그인 시도

### 로그 기능 복원 (선택사항)

로그 기록이 필요한 경우:
1. v6.2.5에 `writeLog()` 함수 추가
2. 각 로그인/등록 함수에서 `writeLog()` 호출
3. 재배포

**주의**: 로그 기능 추가 시 SpreadsheetApp 권한 재승인 필요

## 📝 체크리스트

- [ ] 구글 시트 열기 (`1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc`)
- [ ] '기업회원' 시트에서 전화번호 `01063529091` 찾기
- [ ] 승인상태 컬럼(H열) 값 확인
- [ ] 값이 "승인"이 아니면 "승인"으로 변경
- [ ] API 테스트 (curl 명령)
- [ ] 프론트엔드 로그인 테스트
- [ ] 성공 시 다른 사용자도 동일하게 승인 처리

## 🔗 관련 파일

- `/home/user/webapp/APPS_SCRIPT_V6.2.5_CORRECT_ID.js` - 현재 배포된 코드
- `/home/user/webapp/APPS_SCRIPT_DIAGNOSE.js` - 진단 스크립트
- `/home/user/webapp/components/Auth.tsx` - 프론트엔드 로그인 컴포넌트

---

**결론**: API는 정상 작동 중이며, 문제는 구글 시트의 **승인상태** 값이 "승인"이 아닌 것으로 추정됩니다. 구글 시트에서 직접 확인하고 수정하는 것이 가장 빠른 해결 방법입니다.
