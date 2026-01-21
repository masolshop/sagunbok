# 🚨 긴급: 신규 Google Sheets로 Apps Script 재배포

**문제**: Apps Script가 이전 시트에 데이터 저장 중  
**신규 시트**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

---

## 📋 신규 시트 ID
```
1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
```

---

## ✅ 해결 방법 (5분 소요)

### 방법 1: 신규 시트에서 Apps Script 새로 생성 (권장)

#### 1단계: 신규 Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

#### 2단계: 시트 구조 확인
```
[기업회원] 시트:
  A: 가입일시
  B: 회사명
  C: 기업유형
  D: 이름
  E: 핸드폰번호
  F: 이메일
  G: 비밀번호
  H: 추천인
  I: 승인상태  ← 이 열이 있어야 함!
  J: (비어있음)
  K: 마지막로그인

[사근복컨설턴트] 시트:
  A: 이름
  B: 핸드폰번호
  C: 이메일
  D: 직함
  E: 소속 사업단
  F: 비밀번호
  G: 소속 지사
  H: 가입일시
  I: 승인상태  ← 이 열이 있어야 함!
```

#### 3단계: 헤더 행이 없다면 추가
```
[기업회원] 시트 A1 행:
A1: 가입일시
B1: 회사명
C1: 기업유형
D1: 이름
E1: 핸드폰번호
F1: 이메일
G1: 비밀번호
H1: 추천인
I1: 승인상태
J1: (비어있음)
K1: 마지막로그인

[사근복컨설턴트] 시트 A1 행:
A1: 이름
B1: 핸드폰번호
C1: 이메일
D1: 직함
E1: 소속 사업단
F1: 비밀번호
G1: 소속 지사
H1: 가입일시
I1: 승인상태
```

#### 4단계: Apps Script 열기
```
신규 시트에서:
상단 메뉴 > 확장 프로그램 > Apps Script
```

#### 5단계: 기존 코드 삭제
```
왼쪽 에디터에서 모든 코드 선택 (Ctrl+A)
Delete 키
```

#### 6단계: 새 코드 붙여넣기
```
로컬 파일 열기: /home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js
전체 복사 (Ctrl+A > Ctrl+C)
Apps Script 에디터에 붙여넣기 (Ctrl+V)
저장 (Ctrl+S)
```

#### 7단계: 배포
```
1. 왼쪽 하단: 오류 메시지 없음 확인 ✅
2. 오른쪽 상단: "배포" 버튼 클릭
3. "새 배포" 선택
4. 설정:
   - 유형: 웹 앱
   - 설명: V5.4.2 - 신규 시트 (승인상태 I열)
   - 실행 계정: 나
   - 액세스 권한: 모든 사용자
5. "배포" 클릭
6. **새 웹 앱 URL 복사** ⭐
```

#### 8단계: 프론트엔드 URL 업데이트
```
새 웹 앱 URL을 받으면:
components/Auth.tsx 파일에서 BACKEND_URL 업데이트 필요
```

---

### 방법 2: 기존 Apps Script에서 시트 ID 변경 (복잡함)

코드에서 `SpreadsheetApp.getActiveSpreadsheet()` 대신  
`SpreadsheetApp.openById('1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc')`로 변경

**⚠️ 주의**: 이 방법은 권장하지 않습니다. 방법 1이 더 안전합니다.

---

## 🎯 배포 후 테스트

### 1. Apps Script 버전 확인
```bash
curl -L 'https://script.google.com/macros/s/새로운URL/exec' | jq '.'
```

예상 결과:
```json
{
  "success": true,
  "message": "Sagunbok Apps Script V5.4.2 (FINAL) is running!",
  "version": "5.4.2",
  "sheetStructure": {
    "A": "가입일시",
    "B": "회사명",
    "C": "기업유형",
    ...
    "I": "승인상태"
  }
}
```

### 2. 회원가입 테스트
```
신규 시트 URL: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

테스트 데이터:
회사명: 신규시트테스트병원
기업유형: 병의원개인사업자
담당자: 신규테스터
휴대폰: 010-5555-6666
이메일: newsheet@test.com
비밀번호: test1234
추천인: 김철수
```

### 3. 신규 시트 확인
```
[기업회원] 시트 열기
✅ 새 행 추가됨
✅ A열: 2026-01-21 XX:XX:XX
✅ B열: 신규시트테스트병원
✅ C열: 병의원개인사업자
✅ D열: 신규테스터
✅ E열: 010-5555-6666
✅ F열: newsheet@test.com
✅ G열: (해시값)
✅ H열: 김철수
✅ I열: 승인전표  ⭐ 가장 중요!
```

---

## 🔥 만약 I열(승인상태) 열이 없다면

### 신규 시트 준비

#### [기업회원] 시트
```
1. A1 셀 클릭
2. 다음 헤더 입력:
   A1: 가입일시
   B1: 회사명
   C1: 기업유형
   D1: 이름
   E1: 핸드폰번호
   F1: 이메일
   G1: 비밀번호
   H1: 추천인
   I1: 승인상태  ← 필수!
   J1: (공백)
   K1: 마지막로그인
```

#### [사근복컨설턴트] 시트
```
1. A1 셀 클릭
2. 다음 헤더 입력:
   A1: 이름
   B1: 핸드폰번호
   C1: 이메일
   D1: 직함
   E1: 소속 사업단
   F1: 비밀번호
   G1: 소속 지사
   H1: 가입일시
   I1: 승인상태  ← 필수!
```

#### [로그인기록] 시트 (선택사항)
```
A1: 타임스탬프
B1: 전화번호
C1: 사용자유형
D1: 상태
```

---

## 📁 참고 파일

- **Apps Script 코드**: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`
- **신규 시트 URL**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

---

## ⚡ 체크리스트

- [ ] 신규 Google Sheets 열기
- [ ] 시트 이름 확인: [기업회원], [사근복컨설턴트], [로그인기록]
- [ ] 헤더 행 추가 (I열: 승인상태 포함)
- [ ] E열(핸드폰번호) 서식: 일반 텍스트로 설정
- [ ] Apps Script 열기 (확장 프로그램 > Apps Script)
- [ ] 기존 코드 삭제
- [ ] 새 코드 붙여넣기 (APPS_SCRIPT_V5.4_FINAL.js)
- [ ] 저장 (Ctrl+S)
- [ ] 오류 없음 확인
- [ ] 배포 > 새 배포
- [ ] 웹 앱 URL 복사
- [ ] 프론트엔드 BACKEND_URL 업데이트 (필요 시)
- [ ] 회원가입 테스트
- [ ] 신규 시트에 데이터 저장 확인
- [ ] I열(승인상태): '승인전표' 확인

---

## 🎉 완료!

**신규 시트에 Apps Script를 배포하면 모든 데이터가 신규 시트에 저장됩니다!**

**새 웹 앱 URL을 받으면 알려주세요!** 프론트엔드를 업데이트하겠습니다.

---

**지금 즉시 신규 시트에서 Apps Script 배포하세요! ⚡**
