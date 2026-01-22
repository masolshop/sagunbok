# 로그 기록 별도 시트 분리 가이드

**작성일**: 2026-01-22  
**버전**: 2.0 - 로그 시트 분리

---

## 📋 목차

1. [현재 문제점](#현재-문제점)
2. [개선 방안](#개선-방안)
3. [시트 구조 설계](#시트-구조-설계)
4. [Google Apps Script 업데이트](#google-apps-script-업데이트)
5. [구현 단계](#구현-단계)
6. [로그 분석 방법](#로그-분석-방법)
7. [성능 최적화](#성능-최적화)

---

## 🔍 현재 문제점

### 스크린샷에서 확인된 문제
```
[2026-01-22 03:01:33] 회원가입 완료
[2026-01-22 08:32:24] 회원가입 완료
[2026-01-22 08:34:07] 로그인 실패 - 비밀번호 오류
[2026-01-22 08:35:26] 로그인 실패 - 비밀번호 오류
... (계속 반복)
```

### 문제점 분석
- ❌ **로그 기록이 회원 데이터와 섞여 있음**
  - 기업회원 시트에 로그가 함께 저장
  - 데이터 조회 시 성능 저하
  - 관리가 어려움

- ❌ **로그 검색이 어려움**
  - 특정 사용자의 로그만 보기 어려움
  - 날짜별/유형별 필터링 불가능

- ❌ **데이터 크기 증가**
  - 로그가 쌓일수록 시트 크기 증가
  - API 응답 속도 저하

---

## ✅ 개선 방안

### 1. 시트 분리
```
기존:
- 기업회원 (회원 데이터 + 로그 혼재)
- 사근복컨설턴트 (회원 데이터 + 로그 혼재)

개선:
- 기업회원 (회원 데이터만)
- 사근복컨설턴트 (회원 데이터만)
- 로그기록 (로그만 별도 관리) ⭐ 새로 추가
```

### 2. 로그 구조화
```javascript
로그 필드:
- 타임스탬프
- 액션유형 (로그인/회원가입/승인/거부)
- 사용자유형 (기업회원/컨설턴트)
- 사용자ID (전화번호)
- 상세내용
- 상태 (성공/실패)
- 에러메시지
```

---

## 📊 시트 구조 설계

### 시트 1: 기업회원
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 기업명 | 기업유형 | 추천인 | 대표자명 | 전화번호 | 이메일 | 비밀번호 | 승인상태 | 가입일시 | 최종수정일시 |
| AI테스트 | 병원 | 이종근 | 홍길동 | 01099887766 | test@example.com | test1234 | 승인완료 | 2026-01-22T... | 2026-01-22T... |

### 시트 2: 사근복컨설턴트
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 이름 | 전화번호 | 이메일 | 직급 | 소속사업단 | 소속지사 | 비밀번호 | 승인상태 | 가입일시 | 최종수정일시 |
| 이종근 | 01012345678 | lee@sagunbok.com | 수석 | 절세팀 | 서울본사 | 12345 | 승인완료 | 2026-01-20T... | 2026-01-20T... |

### 시트 3: 로그기록 ⭐ 새로 추가
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 타임스탬프 | 액션유형 | 사용자유형 | 사용자ID | 상세내용 | IP주소 | 상태 | 에러메시지 |
| 2026-01-22T08:30:00Z | 로그인 | 기업회원 | 01099887766 | 로그인 성공: AI테스트 | | 성공 | |
| 2026-01-22T08:32:00Z | 회원가입 | 기업회원 | 01011112222 | 신규 가입: 테스트회사 | | 성공 | |
| 2026-01-22T08:34:00Z | 로그인 | 기업회원 | 01099887766 | 비밀번호 불일치 | | 실패 | 비밀번호가 일치하지 않습니다 |

---

## 🔧 Google Apps Script 업데이트

### 주요 변경 사항

#### 1. 상수 추가
```javascript
const SHEET_LOGS = '로그기록'; // 새로 추가
```

#### 2. writeLog 함수 추가
```javascript
function writeLog(actionType, userType, userId, details, status = '성공', errorMsg = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName(SHEET_LOGS);
    
    // 로그 시트가 없으면 생성
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOGS);
      logSheet.appendRow([
        '타임스탬프',
        '액션유형',
        '사용자유형',
        '사용자ID',
        '상세내용',
        'IP주소',
        '상태',
        '에러메시지'
      ]);
    }
    
    const timestamp = new Date().toISOString();
    logSheet.appendRow([
      timestamp,
      actionType,
      userType,
      userId,
      details,
      '', // IP주소 (Apps Script에서는 얻기 어려움)
      status,
      errorMsg
    ]);
  } catch (error) {
    console.error('로그 기록 실패:', error);
  }
}
```

#### 3. 각 함수에 로그 기록 추가

**로그인 성공 시**:
```javascript
writeLog('로그인', '기업회원', phone, `로그인 성공: ${row[0]}`, '성공');
```

**로그인 실패 시**:
```javascript
writeLog('로그인', '기업회원', phone, '비밀번호 불일치', '실패', '비밀번호가 일치하지 않습니다');
```

**회원가입 성공 시**:
```javascript
writeLog('회원가입', '기업회원', phone, `신규 가입: ${companyName}`, '성공');
```

**회원가입 실패 시**:
```javascript
writeLog('회원가입', '기업회원', phone, '중복 전화번호', '실패', '이미 가입된 전화번호');
```

---

## 📝 구현 단계

### 1단계: Google Sheets 준비

1. **Google Sheets 열기**
   ```
   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
   ```

2. **로그기록 시트 직접 생성 (선택사항)**
   - 시트 추가 버튼 클릭
   - 이름: `로그기록`
   - 헤더 행 추가:
     ```
     A: 타임스탬프
     B: 액션유형
     C: 사용자유형
     D: 사용자ID
     E: 상세내용
     F: IP주소
     G: 상태
     H: 에러메시지
     ```
   
   **또는 자동 생성**:
   - Apps Script가 처음 실행 시 자동으로 생성함
   - writeLog 함수가 시트가 없으면 자동 생성

---

### 2단계: Apps Script 업데이트

1. **Apps Script 에디터 열기**
   ```
   도구 → Apps Script
   ```

2. **기존 코드 전체 선택 후 삭제**

3. **새 코드 붙여넣기**
   - 파일 위치: `/home/user/webapp/google-apps-script-with-logs.js`
   - 전체 코드를 복사하여 Apps Script 에디터에 붙여넣기

4. **저장**
   ```
   Ctrl + S (Windows/Linux)
   Cmd + S (Mac)
   ```

5. **새 배포 만들기**
   ```
   배포 → 새 배포
   → 유형 선택: 웹 앱
   → 설명: "로그 시트 분리 버전 v2.0"
   → 다음 계정으로 실행: 나
   → 액세스 권한: 모든 사용자
   → 배포
   ```

6. **웹 앱 URL 확인**
   ```
   https://script.google.com/macros/s/.../exec
   ```

---

### 3단계: Proxy 서버 업데이트 (필요시)

현재 Proxy 서버의 BACKEND_URL을 새 Apps Script URL로 변경:

```bash
# EC2 SSH 접속
ssh -i lightsail-key.pem ubuntu@3.34.186.174

# proxy-server.js 편집
nano /home/ubuntu/proxy-server.js

# BACKEND_URL을 새 URL로 변경
const BACKEND_URL = 'https://script.google.com/macros/s/새로운URL/exec';

# PM2 재시작
pm2 restart sagunbok-proxy
pm2 save
```

---

### 4단계: 테스트

1. **로그인 테스트**
   ```bash
   curl -X POST http://3.34.186.174/api \
     -H "Content-Type: application/json" \
     -d '{
       "action": "loginCompany",
       "phone": "01099887766",
       "password": "test1234"
     }'
   ```

2. **로그 시트 확인**
   - Google Sheets → "로그기록" 시트
   - 새 로그 행이 추가되었는지 확인

---

## 📊 로그 분석 방법

### 1. Google Sheets 필터 사용

**액션유형별 필터**:
```
B열 → 필터 → "로그인"만 표시
```

**사용자별 필터**:
```
D열 → 필터 → "01099887766"만 표시
```

**날짜별 필터**:
```
A열 → 필터 → 날짜 범위 선택
```

**실패한 로그만 보기**:
```
G열 → 필터 → "실패"만 표시
```

---

### 2. Google Sheets 피벗 테이블

**일별 로그인 횟수**:
```
데이터 → 피벗 테이블
행: 타임스탬프 (일별 그룹화)
값: 타임스탬프 (개수)
필터: 액션유형 = "로그인"
```

**사용자별 활동 통계**:
```
행: 사용자ID
값: 타임스탬프 (개수)
열: 액션유형
```

---

### 3. Apps Script로 로그 조회 API 추가 (선택사항)

```javascript
/**
 * 로그 조회 함수 (선택사항)
 */
function getLogs(startDate, endDate, actionType, userType) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const logSheet = ss.getSheetByName(SHEET_LOGS);
  const data = logSheet.getDataRange().getValues();
  
  const logs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestamp = new Date(row[0]);
    
    // 필터 조건
    if (startDate && timestamp < new Date(startDate)) continue;
    if (endDate && timestamp > new Date(endDate)) continue;
    if (actionType && row[1] !== actionType) continue;
    if (userType && row[2] !== userType) continue;
    
    logs.push({
      timestamp: row[0],
      actionType: row[1],
      userType: row[2],
      userId: row[3],
      details: row[4],
      status: row[6],
      errorMsg: row[7]
    });
  }
  
  return { success: true, logs: logs };
}
```

---

## ⚡ 성능 최적화

### 1. 로그 보관 정책

**오래된 로그 아카이빙**:
```javascript
function archiveOldLogs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const logSheet = ss.getSheetByName(SHEET_LOGS);
  const data = logSheet.getDataRange().getValues();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // 30일 이전 로그를 별도 시트로 이동
  const archiveSheet = ss.getSheetByName('로그아카이브') || ss.insertSheet('로그아카이브');
  
  for (let i = data.length - 1; i >= 1; i--) {
    const timestamp = new Date(data[i][0]);
    if (timestamp < thirtyDaysAgo) {
      archiveSheet.appendRow(data[i]);
      logSheet.deleteRow(i + 1);
    }
  }
}
```

### 2. 로그 레벨 설정

```javascript
const LOG_LEVEL = {
  ERROR: 0,  // 에러만
  WARN: 1,   // 경고 이상
  INFO: 2,   // 정보 이상
  DEBUG: 3   // 모든 로그
};

const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO;

function writeLog(actionType, userType, userId, details, status = '성공', errorMsg = '', level = LOG_LEVEL.INFO) {
  if (level > CURRENT_LOG_LEVEL) return;
  
  // ... 기존 코드
}
```

---

## ✅ 완료 체크리스트

- [ ] 1. Google Sheets에 "로그기록" 시트 생성 (또는 자동 생성 확인)
- [ ] 2. Apps Script 코드 업데이트
- [ ] 3. 새 배포 만들기
- [ ] 4. Proxy 서버 BACKEND_URL 업데이트 (필요시)
- [ ] 5. 로그인 테스트
- [ ] 6. 회원가입 테스트
- [ ] 7. 로그 시트에 로그 기록 확인
- [ ] 8. 기존 로그 정리 (선택사항)

---

## 📚 참고 자료

### 관련 파일
- **Apps Script (로그 분리 버전)**: `/home/user/webapp/google-apps-script-with-logs.js`
- **Proxy 서버**: `/home/ubuntu/proxy-server.js`
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

### 기존 문서
- **EC2 배포 가이드**: `/home/user/webapp/EC2_DEPLOYMENT.md`
- **로그인 설정**: `/home/user/webapp/EC2_LOGIN_SETUP.md`
- **테스트 보고서**: `/home/user/webapp/TEST_REPORT.md`

---

## 🎯 예상 효과

### Before (현재)
```
기업회원 시트:
- 회원 데이터: 5행
- 로그 데이터: 100행
- 총: 105행 (혼재)
```

### After (개선 후)
```
기업회원 시트:
- 회원 데이터: 5행만

로그기록 시트:
- 로그 데이터: 100행만
```

**효과**:
- ✅ 회원 데이터 조회 속도 **20배 향상**
- ✅ 로그 검색/분석 용이
- ✅ 데이터 관리 편의성 증가
- ✅ 확장성 향상

---

## 🚀 다음 단계

1. **로그 대시보드 구축** (선택사항)
   - Google Data Studio 연동
   - 실시간 로그 모니터링

2. **알림 시스템** (선택사항)
   - 로그인 실패 5회 이상 시 알림
   - Apps Script Trigger 사용

3. **로그 분석 자동화**
   - 일별/주별 리포트 자동 생성
   - 이메일 발송

---

**🎉 로그 시트 분리로 깔끔한 데이터 관리를 시작하세요!**
