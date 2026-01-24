# 🚀 빠른 해결 가이드 (Quick Fix)

## ⚡ 5분 안에 해결하기

### 문제
시크릿 창에서 로그인 시도 시:
```
"로그인 중 오류가 발생했습니다"
또는
API 응답: {"success":false,"error":"승인 대기 중입니다."}
```

### 원인
✅ **API는 정상 작동 중**  
❌ 구글 시트의 승인상태가 "승인"이 아님

---

## 🎯 해결 (3단계)

### 1️⃣ 구글 시트 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2️⃣ 승인상태 수정
1. '기업회원' 시트 선택
2. Ctrl+F → `01063529091` 검색
3. H열(승인상태) 클릭
4. 값 삭제 → `승인` 입력
5. Enter

### 3️⃣ 테스트
```bash
# 터미널에서
curl -L 'https://script.google.com/macros/s/AKfycbxlweZ9_ZoDG9Qi2UVlTUXYyJSQwnhRhy9CDE1rzG3-77_0F5ZbATyjhudAgxEqgOyA/exec?action=loginCompany&phone=01063529091&password=12345'
```

**성공 시 응답:**
```json
{"success": true, "user": {"userType": "company", ...}}
```

---

## 📱 브라우저 테스트

1. 시크릿 창 열기
2. http://3.34.186.174/ 접속
3. 로그인:
   - 전화번호: `01063529091`
   - 비밀번호: `12345`
   - 회원구분: 기업회원

---

## 🔍 여전히 안 되면?

### 진단 스크립트 실행
1. 구글 시트 → 확장 프로그램 → Apps Script
2. 아래 코드 추가:

```javascript
function diagnoseSheet() {
  const ss = SpreadsheetApp.openById('1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc');
  const sheet = ss.getSheetByName('기업회원');
  const data = sheet.getDataRange().getValues();
  
  Logger.log('=== 헤더 ===');
  Logger.log(data[0].join(' | '));
  
  for (let i = 1; i < data.length; i++) {
    const phone = String(data[i][4]).replace(/[^0-9]/g, '');
    if (phone === '01063529091') {
      Logger.log('\n=== 찾음! 행 ' + i + ' ===');
      for (let j = 0; j < data[i].length; j++) {
        Logger.log('[' + j + '] ' + data[0][j] + ': "' + data[i][j] + '"');
      }
    }
  }
}
```

3. 실행 ▶ → Ctrl+Enter로 로그 확인
4. 로그 결과를 공유해 주세요

---

## 📊 예상 컬럼 구조

| 인덱스 | 컬럼명 | 예시 값 |
|--------|--------|---------|
| 0 | 회사명 | 페마연 |
| 1 | 기업회원분류 | 법인 |
| 2 | 추천인 | 이종근 |
| 3 | 이름 | 이종근 |
| 4 | 전화번호 | 01063529091 |
| 5 | 이메일 | tysagunbok@gmail.com |
| 6 | 비밀번호 | 12345 |
| 7 | 승인상태 | **승인** ← 여기! |
| 8 | 가입일 | 2026-01-24 |

---

## ⚠️ 주의사항

### 승인상태 값은 정확히 "승인"이어야 합니다

❌ 안 되는 값들:
- "대기"
- "승인 대기"
- "승인대기"
- "pending"
- 빈 칸
- 앞/뒤 공백이 있는 "승인"

✅ 올바른 값:
- `승인` (공백 없이 정확히)

---

## 📞 추가 도움

다음 정보를 공유해 주세요:
- [ ] 승인상태를 "승인"으로 변경했는지
- [ ] API 테스트 결과 (success: true/false)
- [ ] 구글 시트 스크린샷 (해당 행)
- [ ] 진단 함수 실행 로그

---

**관련 문서:**
- `DIAGNOSIS_REPORT.md` - 상세 진단 보고서
- `CHECK_SHEET_STRUCTURE.md` - 시트 구조 확인 가이드
- `APPS_SCRIPT_DIAGNOSE.js` - 진단 스크립트
