# 📊 Apps Script v4.0 - 한국 시간(KST) + 로그 시트 통합

## 🎯 주요 변경사항

### ✅ **1. 한국 시간(KST, UTC+9) 적용**
- **모든 타임스탬프가 한국 시간으로 기록됩니다**
- 가입일, 로그 기록 시간 등 모든 시간이 KST로 표시
- 형식: `YYYY-MM-DD HH:mm:ss` (예: `2026-01-22 17:31:58`)

### ✅ **2. 로그기록 시트 통합**
- **기업회원 시트**: 10개 컬럼 → **9개 컬럼** (J열 로그기록 제거)
- **사근복컨설턴트 시트**: 10개 컬럼 → **9개 컬럼** (J열 로그기록 제거)
- **로그기록 시트**: 모든 로그를 중앙 집중식으로 관리

---

## 📋 시트 구조 (최종)

### 1️⃣ **기업회원 시트** (9개 컬럼)
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 회사명 | 기업회원분류 | 추천인 | 이름 | 전화번호 | 이메일 | 비밀번호 | 가입일 | 승인여부 |

- ❌ **J열 (로그기록) 제거됨** → 로그기록 시트로 통합

### 2️⃣ **사근복컨설턴트 시트** (9개 컬럼)
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 이름 | 전화번호 | 이메일 | 직함 | 소속사업단 | 소속지사 | 비밀번호 | 가입일 | 승인여부 |

- ❌ **J열 (로그기록) 제거됨** → 로그기록 시트로 통합

### 3️⃣ **로그기록 시트** (8개 컬럼)
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 타임스탬프 | 액션유형 | 사용자유형 | 사용자ID | 상세내용 | IP주소 | 상태 | 에러메시지 |

**예시 데이터:**
| 타임스탬프 | 액션유형 | 사용자유형 | 사용자ID | 상세내용 | IP주소 | 상태 | 에러메시지 |
|------------|----------|------------|----------|----------|--------|------|------------|
| 2026-01-22 17:31:58 | 회원가입 | 기업회원 | 01012345678 | 회원가입 완료: 테스트회사 | | 성공 | |
| 2026-01-22 17:32:05 | 로그인 | 기업회원 | 01012345678 | 로그인 성공: 테스트회사 | | 성공 | |
| 2026-01-22 17:32:15 | 로그인 | 기업회원 | 01099999999 | 미등록 전화번호 | | 실패 | 등록되지 않은 전화번호입니다 |

---

## 🚀 배포 방법

### 1️⃣ **Google Sheets 준비**
1. Google Sheets 열기: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

2. **기업회원 시트** 정리:
   - ❌ **J열(로그기록) 데이터 삭제** (컬럼은 남겨두거나 삭제 가능)
   - ✅ 헤더 행: 회사명 | 기업회원분류 | 추천인 | 이름 | 전화번호 | 이메일 | 비밀번호 | 가입일 | 승인여부

3. **사근복컨설턴트 시트** 정리:
   - ❌ **J열(로그기록) 데이터 삭제** (컬럼은 남겨두거나 삭제 가능)
   - ✅ 헤더 행: 이름 | 전화번호 | 이메일 | 직함 | 소속사업단 | 소속지사 | 비밀번호 | 가입일 | 승인여부

4. **로그기록 시트** 확인:
   - 시트가 없으면 자동 생성됩니다
   - ✅ 헤더 행: 타임스탬프 | 액션유형 | 사용자유형 | 사용자ID | 상세내용 | IP주소 | 상태 | 에러메시지

### 2️⃣ **Apps Script 업데이트**
1. **확장 프로그램 → Apps Script** 클릭

2. 기존 코드 **전체 삭제**

3. `/home/user/webapp/google-apps-script-v4-kst-logs.js` 파일 내용을 복사해서 붙여넣기

4. **Ctrl+S** 저장

5. **배포 → 배포 관리** 클릭

6. ✏️ **편집** 클릭

7. **새 버전** 선택

8. 버전 설명: **"v4.0 - 한국 시간(KST) + 로그 시트 통합"**

9. **배포** 클릭

10. ✅ 완료!

### 3️⃣ **테스트**
```bash
cd /home/user/webapp && ./test-apps-script-v4-kst.sh
```

---

## 🔍 핵심 변경 내용

### 1️⃣ **한국 시간(KST) 함수 추가**
```javascript
function getKSTTimestamp() {
  const now = new Date();
  // UTC 시간에 9시간(32400000ms) 추가
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getUTCDate()).padStart(2, '0');
  const hour = String(kstTime.getUTCHours()).padStart(2, '0');
  const minute = String(kstTime.getUTCMinutes()).padStart(2, '0');
  const second = String(kstTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
```

### 2️⃣ **로그 기록 함수 변경**
```javascript
// Before: new Date().toISOString()
const timestamp = new Date().toISOString();
// 결과: "2026-01-22T08:31:58.123Z" (UTC)

// After: getKSTTimestamp()
const timestamp = getKSTTimestamp();
// 결과: "2026-01-22 17:31:58" (KST)
```

### 3️⃣ **회원가입 컬럼 수 변경**
```javascript
// Before: 10개 컬럼 (J열 포함)
companySheet.appendRow([
  data.companyName,    // A
  data.companyType,    // B
  data.referrer,       // C
  data.name,           // D
  data.phone,          // E
  data.email,          // F
  data.password,       // G
  timestamp,           // H
  STATUS_PENDING,      // I
  ''                   // J: 로그기록 (빈 문자열)
]);

// After: 9개 컬럼 (J열 제거)
companySheet.appendRow([
  data.companyName,    // A
  data.companyType,    // B
  data.referrer,       // C
  data.name,           // D
  data.phone,          // E
  data.email,          // F
  data.password,       // G
  timestamp,           // H: 가입일 (KST)
  STATUS_PENDING       // I: 승인여부
]);
```

### 4️⃣ **로그인 함수 컬럼 인덱스 변경**
```javascript
// Before: row[9] (J열) - 로그기록
const logRecord = row[9];

// After: row[8] (I열) - 승인여부 (마지막 컬럼)
const approvalStatus = String(row[8]).trim();
```

---

## 📊 로그 기록 예시

### 성공 케이스
```json
{
  "타임스탬프": "2026-01-22 17:31:58",
  "액션유형": "회원가입",
  "사용자유형": "기업회원",
  "사용자ID": "01012345678",
  "상세내용": "회원가입 완료: 테스트회사",
  "IP주소": "",
  "상태": "성공",
  "에러메시지": ""
}
```

### 실패 케이스
```json
{
  "타임스탬프": "2026-01-22 17:32:15",
  "액션유형": "로그인",
  "사용자유형": "기업회원",
  "사용자ID": "01099999999",
  "상세내용": "미등록 전화번호",
  "IP주소": "",
  "상태": "실패",
  "에러메시지": "등록되지 않은 전화번호입니다"
}
```

---

## 🔗 관련 파일
- `/home/user/webapp/google-apps-script-v4-kst-logs.js` - Apps Script v4.0 코드
- `/home/user/webapp/SHEETS_STRUCTURE_EXACT.md` - 시트 구조 가이드 (v3.0)
- `/home/user/webapp/APPS_SCRIPT_DEPLOYMENT_GUIDE.md` - 배포 방법 가이드

---

## 🎯 체크리스트

### 배포 전 확인 사항
- [ ] Google Sheets에서 기업회원 시트의 J열 데이터 삭제 완료
- [ ] Google Sheets에서 사근복컨설턴트 시트의 J열 데이터 삭제 완료
- [ ] 로그기록 시트가 생성되었거나 자동 생성 대기 중

### 배포 후 확인 사항
- [ ] Apps Script 코드가 v4.0으로 업데이트됨
- [ ] 배포 관리에서 새 버전으로 배포 완료
- [ ] GET 요청으로 버전 확인: "4.0 - 한국 시간(KST) + 로그 시트 통합"
- [ ] 회원가입 테스트 시 가입일이 한국 시간으로 기록됨
- [ ] 로그기록 시트에 새 로그가 한국 시간으로 기록됨
- [ ] 기업회원/컨설턴트 시트의 J열에 데이터가 추가되지 않음

---

## 🌐 테스트 URL
- **Apps Script URL**: https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **EC2 API**: http://3.34.186.174/api

---

## 🚀 다음 단계
1. ✅ Google Sheets에서 J열 데이터 삭제
2. ✅ Apps Script v4.0 코드 업데이트
3. ✅ 배포 관리에서 새 버전으로 배포
4. ✅ 테스트 실행
5. ✅ 로그기록 시트 확인 (한국 시간 적용 확인)

---

**버전**: 4.0 - 한국 시간(KST) + 로그 시트 통합  
**작성일**: 2026-01-22  
**작성자**: GenSpark AI Assistant
