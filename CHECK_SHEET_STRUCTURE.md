# 구글 시트 구조 확인 가이드

## 🎯 목적
전화번호 `01063529091`로 로그인이 안 되는 이유를 찾기 위해 구글 시트의 실제 데이터 구조를 확인합니다.

## 📋 확인 절차

### 1단계: 구글 시트 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2단계: '기업회원' 시트 선택
- 하단 탭에서 **'기업회원'** 시트를 클릭

### 3단계: 헤더 행(1행) 확인
다음 컬럼들이 순서대로 있는지 확인:

| A열 | B열 | C열 | D열 | E열 | F열 | G열 | H열 | I열 |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 회사명 | 기업회원분류 | 추천인 | 이름 | 전화번호 | 이메일 | 비밀번호 | 승인상태 | 가입일 |

**중요**: 컬럼 순서가 위와 다르면 코드 수정이 필요합니다!

### 4단계: 전화번호 `01063529091` 검색
1. Ctrl+F (Mac: Cmd+F)로 검색창 열기
2. `01063529091` 입력
3. 해당 행으로 이동

### 5단계: 데이터 확인
전화번호를 찾았다면, 해당 행의 모든 데이터를 확인:

```
예시:
A: 페마연
B: 법인
C: 이종근
D: 이종근
E: 01063529091  ← 전화번호
F: tysagunbok@gmail.com
G: 12345        ← 비밀번호
H: ???          ← 승인상태 (여기를 확인!)
I: 2026-01-24
```

### 6단계: 승인상태(H열) 확인 및 수정

**현재 값 확인**:
- [ ] "승인" → 정상 (로그인 가능)
- [ ] "대기" → 문제! (로그인 불가)
- [ ] "승인 대기" → 문제! (로그인 불가)
- [ ] "pending" → 문제! (로그인 불가)
- [ ] 빈 칸 → 문제! (로그인 불가)
- [ ] 다른 값 → 문제! (로그인 불가)

**수정 방법**:
1. H열 셀 클릭
2. 기존 값 모두 삭제
3. 정확히 `승인` 입력 (공백 없이)
4. Enter로 저장

### 7단계: 로그인 재테스트

#### 터미널 테스트
```bash
curl -L 'https://script.google.com/macros/s/AKfycbxlweZ9_ZoDG9Qi2UVlTUXYyJSQwnhRhy9CDE1rzG3-77_0F5ZbATyjhudAgxEqgOyA/exec?action=loginCompany&phone=01063529091&password=12345'
```

**예상 결과 (성공)**:
```json
{
  "success": true,
  "user": {
    "userType": "company",
    "companyName": "페마연",
    "companyType": "법인",
    "referrer": "이종근",
    "name": "이종근",
    "phone": "01063529091",
    "email": "tysagunbok@gmail.com"
  }
}
```

**예상 결과 (아직 실패)**:
```json
{"success": false, "error": "승인 대기 중입니다."}
```

#### 브라우저 테스트
1. 시크릿 창 열기
2. http://3.34.186.174/ 접속
3. 로그인 시도:
   - 전화번호: `01063529091`
   - 비밀번호: `12345`
   - 회원구분: 기업회원

## 🚨 문제 해결

### 문제 1: 전화번호를 찾을 수 없음
**원인**: 해당 전화번호가 시트에 없음
**해결**: 회원가입 먼저 진행

### 문제 2: 컬럼 순서가 다름
**원인**: 시트 구조가 코드와 맞지 않음
**해결**: 실제 컬럼 순서를 알려주시면 코드를 수정하겠습니다

### 문제 3: 승인상태를 "승인"으로 변경했는데도 실패
**원인 1**: 공백이나 특수문자가 포함됨
**해결**: H열 셀을 완전히 지우고 다시 입력

**원인 2**: 비밀번호 불일치
**해결**: G열의 비밀번호가 `12345`인지 확인

**원인 3**: Apps Script 캐시
**해결**: 잠시 기다렸다가 (1-2분) 재시도

## 📸 스크린샷 요청

다음 정보를 스크린샷으로 공유해 주세요:
1. '기업회원' 시트의 헤더 행(1행)
2. 전화번호 `01063529091`이 포함된 행 전체
3. 특히 H열(승인상태) 값을 명확히 보여주는 화면

## 🔍 추가 진단

위 방법으로도 해결되지 않으면, Apps Script 에디터에서 진단 함수를 실행해 주세요:

1. 구글 시트에서 **확장 프로그램** → **Apps Script**
2. 다음 함수를 추가:

```javascript
function diagnoseSheet() {
  const ss = SpreadsheetApp.openById('1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc');
  const sheet = ss.getSheetByName('기업회원');
  const data = sheet.getDataRange().getValues();
  
  Logger.log('=== 헤더 ===');
  Logger.log(data[0].join(' | '));
  
  Logger.log('\n=== 전화번호 01063529091 찾기 ===');
  for (let i = 1; i < data.length; i++) {
    const phone = String(data[i][4]).replace(/[^0-9]/g, '');
    if (phone === '01063529091') {
      Logger.log('찾음! 행: ' + i);
      for (let j = 0; j < data[i].length; j++) {
        Logger.log('  [' + j + '] ' + data[0][j] + ': "' + data[i][j] + '"');
      }
    }
  }
}
```

3. `diagnoseSheet` 선택 후 실행 ▶
4. 실행 로그(Ctrl+Enter) 확인
5. 로그 결과를 공유해 주세요

---

**다음 응답 시 알려주실 정보**:
- [ ] 승인상태 수정 완료 여부
- [ ] API 테스트 결과
- [ ] 브라우저 로그인 테스트 결과
- [ ] (선택) 구글 시트 스크린샷
- [ ] (선택) 진단 함수 실행 로그
