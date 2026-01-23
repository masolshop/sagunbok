# 📋 사근복 AI - JSON DB 이중 백업 시스템 배포 가이드

> **버전**: v6.0  
> **배포일**: 2026-01-23  
> **작성자**: 사근복 AI 개발팀

---

## 🎯 시스템 개요

### 이중 백업 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                   사근복 AI 회원 관리                      │
└─────────────────────────────────────────────────────────┘
                          ▼
        ┌─────────────────────────────────┐
        │   Google Sheets (메인 DB)        │
        │   - 기업회원 시트                  │
        │   - 사근복컨설턴트 시트             │
        │   - 로그기록 시트                  │
        └─────────────────────────────────┘
                          ▼
                  [자동 동기화]
                          ▼
        ┌─────────────────────────────────┐
        │   Google Drive (JSON 백업)       │
        │   - sagunbok_members_all.json    │
        │   - sagunbok_members_by_         │
        │     consultant.json              │
        └─────────────────────────────────┘
```

### 주요 특징

1. **메인 DB**: Google Sheets (수동 관리 용이)
2. **백업 DB**: JSON 파일 (빠른 조회, API 성능 향상)
3. **자동 동기화**: 회원가입, 승인 변경 시 JSON 자동 업데이트
4. **컨설턴트별 DB**: 각 컨설턴트가 추천한 회원 목록 별도 관리

---

## 📦 Apps Script v6.0 배포

### 1단계: Google Sheets 접속

```
URL: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2단계: Apps Script 에디터 열기

1. **확장 프로그램** → **Apps Script** 클릭
2. 기존 코드 전체 삭제
3. `google-apps-script-v6-json-backup.js` 파일 내용 복사
4. Apps Script 에디터에 붙여넣기

### 3단계: 배포

1. **배포** → **새 배포** 클릭
2. **유형 선택** → **웹 앱** 선택
3. 설정:
   - **새 설명**: "v6.0 - JSON DB 이중 백업 시스템"
   - **다음 계정으로 실행**: **나**
   - **액세스 권한**: **누구나**
4. **배포** 클릭
5. **웹 앱 URL** 복사 (중요!)

### 4단계: API URL 업데이트

프론트엔드에서 API URL을 새 웹 앱 URL로 변경:

```typescript
// AdminView.tsx, Auth.tsx 등에서
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

---

## 📊 JSON 파일 구조

### 1. sagunbok_members_all.json (전체 회원)

```json
{
  "members": [
    {
      "type": "company",
      "companyName": "○○병원",
      "companyType": "병원",
      "referrer": "이종근",
      "name": "홍길동",
      "phone": "01012345678",
      "email": "test@example.com",
      "registeredAt": "2026-01-23 10:30:00",
      "status": "승인완료"
    },
    {
      "type": "consultant",
      "name": "이종근",
      "phone": "01063529091",
      "email": "consultant@example.com",
      "position": "본부장",
      "division": "서울사업단",
      "branch": "강남지사",
      "registeredAt": "2026-01-20 09:00:00",
      "status": "승인완료"
    }
  ],
  "lastUpdated": "2026-01-23 15:45:30",
  "totalCount": 127,
  "companyCount": 105,
  "consultantCount": 22,
  "stats": {
    "pending": 15,
    "approved": 108,
    "rejected": 4
  }
}
```

### 2. sagunbok_members_by_consultant.json (컨설턴트별)

```json
{
  "consultants": {
    "이종근": {
      "consultantName": "이종근",
      "members": [
        {
          "type": "company",
          "companyName": "○○병원",
          "name": "홍길동",
          "phone": "01012345678",
          "email": "test@example.com",
          "registeredAt": "2026-01-23 10:30:00",
          "status": "승인완료"
        }
      ],
      "totalCount": 45,
      "stats": {
        "pending": 5,
        "approved": 38,
        "rejected": 2
      }
    },
    "김철수": {
      "consultantName": "김철수",
      "members": [...],
      "totalCount": 32,
      "stats": {...}
    }
  },
  "lastUpdated": "2026-01-23 15:45:30",
  "consultantCount": 22
}
```

---

## 🔄 JSON 동기화 방법

### 1. 자동 동기화 (권장)

JSON은 다음 이벤트에서 **자동으로** 동기화됩니다:
- ✅ 기업회원 신규 가입
- ✅ 컨설턴트 신규 가입
- ✅ 승인 상태 변경 (승인/거부)

### 2. 수동 동기화

관리자 대시보드에서:
1. **💾 JSON 동기화** 버튼 클릭
2. 확인 팝업에서 **확인** 클릭
3. "✅ JSON 파일 동기화가 완료되었습니다!" 메시지 확인

### 3. Apps Script에서 직접 실행

Apps Script 에디터에서:
1. 함수 선택: `syncAllJsonFiles`
2. **실행** 버튼 클릭
3. 권한 승인 (최초 1회)
4. 실행 로그 확인

---

## 📥 JSON 파일 다운로드

### 방법 1: 관리자 대시보드

1. 전체 관리자(01063529091)로 로그인
2. **📥 JSON 다운로드** 버튼 클릭
3. 팝업에서 다운로드 URL 확인
4. URL을 브라우저 주소창에 붙여넣기
5. JSON 파일 자동 다운로드

### 방법 2: Google Drive 직접 접근

1. Google Drive 접속
2. 검색창에 "sagunbok_members" 입력
3. JSON 파일 찾기:
   - `sagunbok_members_all.json`
   - `sagunbok_members_by_consultant.json`
4. 파일 우클릭 → **다운로드**

### 방법 3: Apps Script API 호출

```bash
curl -X POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec \
  -H "Content-Type: application/json" \
  -d '{"action": "getJsonUrls"}'
```

응답:
```json
{
  "success": true,
  "urls": {
    "allMembers": "https://drive.google.com/uc?export=download&id=FILE_ID_1",
    "byConsultant": "https://drive.google.com/uc?export=download&id=FILE_ID_2"
  },
  "fileIds": {
    "allMembers": "FILE_ID_1",
    "byConsultant": "FILE_ID_2"
  }
}
```

---

## 🔌 API 엔드포인트

### Apps Script API URL
```
https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec
```

### 지원 액션

| 액션 | 설명 | JSON 동기화 |
|------|------|------------|
| `getAllMembers` | 전체 회원 조회 | ❌ |
| `updateMemberStatus` | 승인 상태 변경 | ✅ 자동 |
| `registerCompany` | 기업회원 가입 | ✅ 자동 |
| `registerConsultant` | 컨설턴트 가입 | ✅ 자동 |
| `syncJson` | JSON 수동 동기화 | ✅ 수동 |
| `getJsonUrls` | JSON 다운로드 URL | ❌ |
| `loginCompany` | 기업회원 로그인 | ❌ |
| `loginConsultant` | 컨설턴트 로그인 | ❌ |

---

## 🎨 관리자 대시보드 UI

### 전체 관리자 (01063529091)

```
┌────────────────────────────────────────────────┐
│ 👑 전체 관리자 대시보드                            │
│ 모든 회원을 관리하고 승인할 수 있습니다.             │
│                                                 │
│ [💾 JSON 동기화] [📥 JSON 다운로드] [🔄 새로고침] │
├────────────────────────────────────────────────┤
│ 📊 통계                                         │
│ ┌──────┬──────┬──────┬──────┬──────┬──────┐    │
│ │ 전체  │ 승인  │ 완료  │ 거부  │ 기업  │ 컨설 │    │
│ │ 127  │  15  │ 108  │  4   │ 105  │  22  │    │
│ └──────┴──────┴──────┴──────┴──────┴──────┘    │
├────────────────────────────────────────────────┤
│ 💾 JSON DB 이중 백업 시스템                        │
│ • 메인 DB: Google Sheets (수동 관리 용이)          │
│ • 백업 DB: Google Drive JSON (자동 동기화)         │
│ • 자동 동기화: 회원가입/승인 시 JSON 업데이트        │
│ • 파일 종류: ① 전체 회원 DB ② 컨설턴트별 추천 DB    │
│                                                 │
│ [💾 수동 동기화] [📥 다운로드 링크 보기]            │
└────────────────────────────────────────────────┘
```

### 사근복 컨설턴트

```
┌────────────────────────────────────────────────┐
│ 👔 컨설턴트 대시보드                              │
│ 이종근님이 추천한 기업회원 리스트입니다.            │
│                                                 │
│                          [🔄 새로고침]            │
├────────────────────────────────────────────────┤
│ 📊 통계                                         │
│ ┌──────┬──────┬──────┬──────┐                  │
│ │ 전체  │ 승인  │ 완료  │ 거부  │                  │
│ │  45  │   5  │  38  │   2  │                  │
│ └──────┴──────┴──────┴──────┘                  │
├────────────────────────────────────────────────┤
│ 💡 컨설턴트 대시보드 안내                          │
│ • 내가 추천한 기업회원만 표시됩니다.               │
│ • 회원의 가입일, 승인 상태를 확인할 수 있습니다.    │
│ • 승인 권한은 전체 관리자만 가능합니다.            │
│ • 추천인 필드에 내 이름(이종근)이 입력된 회원만    │
│   표시됩니다.                                    │
└────────────────────────────────────────────────┘
```

---

## 🧪 테스트 시나리오

### 시나리오 1: JSON 자동 동기화 확인

1. ✅ 새 기업회원 가입
2. ✅ Google Drive에서 `sagunbok_members_all.json` 확인
3. ✅ 최신 회원 데이터 포함 여부 확인
4. ✅ `lastUpdated` 타임스탬프 확인

### 시나리오 2: 컨설턴트별 DB 확인

1. ✅ 추천인 "이종근"으로 기업회원 가입
2. ✅ `sagunbok_members_by_consultant.json` 확인
3. ✅ "이종근" 객체에 새 회원 포함 확인
4. ✅ 통계 카운트 정확도 확인

### 시나리오 3: 수동 동기화

1. ✅ Google Sheets에서 데이터 수동 수정
2. ✅ 관리자 대시보드에서 **💾 JSON 동기화** 클릭
3. ✅ JSON 파일에 변경사항 반영 확인

### 시나리오 4: JSON 다운로드

1. ✅ 관리자 대시보드에서 **📥 JSON 다운로드** 클릭
2. ✅ 다운로드 URL 복사
3. ✅ 브라우저에서 URL 열기
4. ✅ JSON 파일 자동 다운로드 확인

---

## 📝 로그 기록

### 로그 시트 컬럼

| 컬럼 | 설명 | 예시 |
|------|------|------|
| 타임스탬프 | KST 시간 | 2026-01-23 15:30:00 |
| 액션유형 | 액션 종류 | JSON업데이트, 회원가입, 로그인 |
| 사용자유형 | 회원 타입 | 기업회원, 사근복컨설턴트, 시스템 |
| 사용자ID | 전화번호 | 01012345678 |
| 상세내용 | 액션 설명 | 전체 회원 JSON 업데이트 완료 (127명) |
| IP주소 | (미사용) | - |
| 상태 | 성공/실패 | 성공, 실패 |
| 에러메시지 | 오류 내용 | - |

### JSON 동기화 로그 예시

```
타임스탬프: 2026-01-23 15:45:30
액션유형: JSON업데이트
사용자유형: 시스템
사용자ID: AUTO
상세내용: 전체 회원 JSON 업데이트 완료 (127명)
상태: 성공
```

---

## 🔒 권한 및 보안

### Google Drive 권한

- ✅ Apps Script가 Google Drive에 파일 생성/수정
- ✅ JSON 파일은 스크립트 소유자 계정에 저장
- ✅ 공유 설정은 기본값 (소유자만 접근)

### JSON 파일 공개 설정 (선택사항)

공개 API로 제공하려면:
1. Google Drive에서 JSON 파일 우클릭
2. **공유** → **링크 액세스 권한** → **링크가 있는 모든 사용자**
3. **뷰어** 권한 선택
4. **완료**

---

## 🚀 프론트엔드 통합

### AdminView.tsx에 이미 구현된 기능

```typescript
// JSON 동기화
const syncJsonFiles = async () => {
  const response = await fetch('http://3.34.186.174/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'syncJson' })
  });
  const data = await response.json();
  if (data.success) {
    alert('✅ JSON 파일 동기화가 완료되었습니다!');
  }
};

// JSON 다운로드 URL 조회
const downloadJsonFiles = async () => {
  const response = await fetch('http://3.34.186.174/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getJsonUrls' })
  });
  const data = await response.json();
  if (data.success && data.urls) {
    alert(`JSON 파일 다운로드 링크:\n\n` +
      `전체 회원: ${data.urls.allMembers}\n\n` +
      `컨설턴트별: ${data.urls.byConsultant}`);
  }
};
```

---

## 📋 체크리스트

### 배포 전

- [ ] Apps Script v6.0 코드 업로드
- [ ] 웹 앱 배포 완료
- [ ] API URL 복사
- [ ] 프론트엔드 API URL 업데이트
- [ ] Google Drive 권한 확인

### 배포 후

- [ ] GET 요청 테스트 (버전 확인)
- [ ] `syncJson` API 테스트
- [ ] `getJsonUrls` API 테스트
- [ ] JSON 파일 생성 확인
- [ ] 관리자 대시보드에서 동기화 테스트
- [ ] 컨설턴트 대시보드 접근 테스트

### 운영 중

- [ ] 주기적으로 JSON 백업 다운로드
- [ ] 로그 시트 모니터링
- [ ] JSON 파일 용량 확인
- [ ] 동기화 실패 로그 확인

---

## 🆘 문제 해결

### Q1: JSON 파일이 생성되지 않아요

**A**: Apps Script 권한 확인
1. Apps Script 에디터에서 `syncAllJsonFiles` 실행
2. 권한 요청 팝업에서 **계속** 클릭
3. Google 계정 선택
4. **고급** → **앱 이름(안전하지 않음)으로 이동** 클릭
5. **허용** 클릭

### Q2: JSON 동기화가 실패해요

**A**: 로그 시트 확인
1. Google Sheets → **로그기록** 시트 열기
2. 최근 로그에서 "JSON업데이트" 액션 찾기
3. **에러메시지** 컬럼 확인
4. 오류 내용에 따라 대응

### Q3: 다운로드 URL이 작동하지 않아요

**A**: 파일 공유 설정 확인
1. Google Drive에서 JSON 파일 찾기
2. 우클릭 → **공유**
3. **링크 액세스 권한** → **링크가 있는 모든 사용자** 선택
4. **뷰어** 권한 확인

### Q4: 컨설턴트별 DB에 회원이 안 나와요

**A**: 추천인 필드 확인
1. Google Sheets → **기업회원** 시트 열기
2. **추천인** 컬럼(C열) 확인
3. 컨설턴트 이름 **정확히 일치** 여부 확인
4. 대소문자, 띄어쓰기 주의

---

## 📞 문의

- **개발팀 이메일**: support@sagunbok.ai
- **GitHub**: https://github.com/masolshop/sagunbok
- **Google Sheets**: [1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc](https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit)

---

**작성일**: 2026-01-23  
**문서 버전**: 1.0  
**Apps Script 버전**: 6.0
