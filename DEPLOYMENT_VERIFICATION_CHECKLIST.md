# 🔍 Apps Script v7.2.2 배포 검증 체크리스트

## ⚠️ 현재 문제 상황
- POST 요청이 Google Drive 에러 페이지로 리다이렉트됨
- GET 요청은 "전화번호 또는 비밀번호 불일치" 에러 반환
- 슈퍼어드민 계정(010-6352-9091)이 Google Sheets에 없을 가능성

---

## 📝 1단계: Google Sheets 직접 확인

### Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
```

### 확인 항목

#### A. 기업회원 시트 구조
```
A열: 사업자번호
B열: 회사명
C열: 대표자명
D열: 기업회원분류
E열: 직함
F열: 이름
G열: 전화번호    ← 여기서 "01063529091" 검색
H열: 이메일
I열: 비밀번호     ← 해당 행의 비밀번호 확인
J열: 가입일
K열: 승인여부     ← "승인" 또는 "승인대기"
L열: 추천인
```

#### B. 슈퍼어드민 계정 확인
- [ ] G열에서 "01063529091" 검색
- [ ] 해당 행이 있는가?
  - 있다면: I열(비밀번호) 확인 → 테스트에 사용
  - 없다면: 사근복 사이트에서 기업회원 가입 필요

#### C. 로그 시트 확인
- [ ] 최근 "loginCompany" 액션 확인
- [ ] 디버그 정보 확인
  - 입력 전화번호 (정규화 전/후)
  - 시트 전화번호 (정규화 전/후)
  - 비밀번호 매칭 결과
  - 슈퍼어드민 체크 여부

---

## 📝 2단계: Apps Script 배포 재확인

### A. Apps Script 에디터 열기
```
1. Google Sheets에서: 확장 프로그램 → Apps Script
```

### B. 배포 상태 확인
```
2. 배포 → 배포 관리
3. 현재 활성 배포 확인
   - 설명에 "v7.2.2" 포함 확인
   - 웹앱 URL 확인
```

### C. POST 지원 확인
Apps Script 코드에서 `doPost` 함수가 있는지 확인:

```javascript
function doPost(e) {
  try {
    var data;
    
    // Content-Type 확인
    if (e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.postData.type === 'application/x-www-form-urlencoded') {
      data = e.parameter;
    } else {
      data = e.parameter;
    }
    
    // ... 나머지 코드
  } catch (error) {
    // 에러 처리
  }
}
```

- [ ] `doPost` 함수 존재 확인
- [ ] JSON 파싱 로직 확인

### D. 배포 설정 확인
```
4. 배포 → 배포 관리 → (기존 배포) 편집
5. 다음 설정 확인:
   - 실행 계정: "나(본인)"
   - 액세스 권한: "모든 사용자"
   - [ ] 위 설정이 맞다면 "배포" 클릭
```

### E. 새 버전으로 다시 배포 (필요시)
만약 POST가 여전히 작동하지 않으면:

```
6. 배포 → 새 배포
7. 설명: "v7.2.2 - POST 지원 재배포"
8. 실행 계정: "나"
9. 액세스 권한: "모든 사용자"
10. 배포 클릭
11. 새 웹앱 URL 복사
```

**중요**: 새 배포로 했다면 프런트엔드의 `API_URL`도 업데이트 필요!

---

## 📝 3단계: 슈퍼어드민 계정 생성 (없는 경우)

### 방법 1: 사근복 사이트에서 가입

```
1. https://sagunbok.com 접속
2. 우측 상단 "회원가입" 클릭
3. "기업" 탭 선택
4. 다음 정보 입력:
   - 사업자번호: 123-45-67890 (테스트용)
   - 회사명: 슈퍼어드민테스트
   - 대표자명: 관리자
   - 기업회원분류: 법인
   - 직함: 대표
   - 이름: 슈퍼어드민
   - 전화번호: 010-6352-9091
   - 이메일: admin@test.com
   - 비밀번호: test1234
   - 비밀번호 확인: test1234
   - 추천인: (비워두기)
5. 가입 완료
```

### 방법 2: Google Sheets에 직접 입력

```
1. Google Sheets → 기업회원 시트
2. 새 행 추가:
   A: 123-45-67890
   B: 슈퍼어드민테스트
   C: 관리자
   D: 법인
   E: 대표
   F: 슈퍼어드민
   G: 01063529091
   H: admin@test.com
   I: test1234
   J: (오늘 날짜)
   K: 승인
   L: (비워두기)
```

**중요**: K열(승인여부)를 "승인"으로 설정해야 로그인 가능!

---

## 📝 4단계: 테스트

### A. GET 방식 테스트
```bash
curl -L "https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec?action=loginCompany&phone=01063529091&password=test1234&_t=$(date +%s)" | jq '.'
```

**기대 결과**:
```json
{
  "success": true,
  "user": {
    "companyName": "슈퍼어드민테스트",
    "name": "슈퍼어드민",
    "phone": "01063529091",
    "isSuperAdmin": true
  }
}
```

### B. 사근복 사이트 로그인 테스트
```
1. https://sagunbok.com 접속
2. 로그인 클릭
3. 기업 탭
4. 전화번호: 010-6352-9091
5. 비밀번호: test1234 (또는 Google Sheets에서 확인한 비밀번호)
6. 로그인 버튼 클릭
```

**기대 결과**:
- ✅ 로그인 성공
- ✅ 좌측 메뉴 모든 항목 활성화
- ✅ 브라우저 개발자 도구(F12) → Console에서:
  ```
  user.isSuperAdmin === true
  ```

### C. 기업절세계산기 접근 테스트
```
1. 로그인 후 좌측 메뉴
2. "기업절세계산기" 클릭
3. 복리후생비절세 시뮬레이션 실행
```

**기대 결과**:
- ✅ 계산기 페이지 표시
- ✅ 시뮬레이션 실행 가능
- ✅ 결과 표시

---

## 🚨 문제 해결

### 문제 1: POST 요청이 작동하지 않음

**증상**: "Page Not Found" 또는 Google Drive 에러 페이지

**해결**:
1. Apps Script에서 `doPost` 함수 존재 확인
2. 배포 → 배포 관리 → 새 버전 선택
3. 또는 배포 → 새 배포 (새 URL 생성)

### 문제 2: "전화번호 또는 비밀번호 불일치"

**증상**: GET 요청은 성공하지만 로그인 실패

**해결**:
1. Google Sheets에서 전화번호 확인 (정확히 "01063529091")
2. Google Sheets에서 비밀번호 확인 (앞뒤 공백 제거)
3. K열(승인여부)가 "승인"인지 확인

### 문제 3: isSuperAdmin 플래그가 없음

**증상**: 로그인은 성공하지만 `isSuperAdmin: true`가 없음

**해결**:
1. Apps Script 코드 재확인:
   ```javascript
   // loginCompany 함수 내부
   if (normalizedPhone === '01063529091') {
     return ContentService.createTextOutput(JSON.stringify({
       success: true,
       user: {
         // ...
         isSuperAdmin: true  // ← 이 줄 확인
       }
     }));
   }
   ```
2. 배포 → 배포 관리 → 새 버전 선택
3. 재배포 후 캐시 삭제 후 테스트

---

## 📋 최종 체크리스트

배포 완료 후 다음 항목 확인:

- [ ] Google Sheets에 슈퍼어드민 계정(010-6352-9091) 존재
- [ ] 승인여부가 "승인"으로 설정됨
- [ ] Apps Script v7.2.2 코드 배포 완료
- [ ] `doPost` 함수 포함 확인
- [ ] GET 요청 테스트 성공
- [ ] POST 요청 테스트 성공 (선택사항)
- [ ] 사근복 사이트 로그인 성공
- [ ] `isSuperAdmin: true` 플래그 확인
- [ ] 모든 메뉴 항목 활성화 확인
- [ ] 기업절세계산기 접근 가능
- [ ] 복리후생비 시뮬레이션 실행 가능

---

## 🔗 관련 링크

- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
- **사근복 사이트**: https://sagunbok.com
- **GitHub PR**: https://github.com/masolshop/sagunbok/pull/1

---

## 💡 다음 단계

배포 검증 완료 후:

1. ✅ 슈퍼어드민 로그인 성공 확인
2. ✅ 기업절세계산기 접근 확인
3. ✅ 복리후생비 시뮬레이션 실행 확인
4. 🎯 프런트엔드 UI 개선 (AI 분석 버튼 추가)
5. 🎯 CEO/컨설턴트 리포트 UI 구현

---

**현재 상태**: 배포 완료, 검증 대기 중 ⏳
