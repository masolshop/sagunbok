# 🔧 API URL 수정 완료

## 문제점
- AdminView와 Auth 컴포넌트가 `http://3.34.186.174/api`를 호출
- 이 엔드포인트는 Nginx 프록시 설정이 없어 404 오류 발생
- JSON 동기화/다운로드 버튼이 작동하지 않음

## 해결 방법
- API URL을 Apps Script 직접 호출로 변경
- `https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec`

## 변경 파일
1. **components/AdminView.tsx**
   - `const API_URL = 'https://script.google.com/...'` 추가
   - 모든 fetch 호출을 `API_URL`로 변경

2. **components/Auth.tsx**
   - `const API_URL = 'https://script.google.com/...'` 추가
   - `PROXY_URL` 제거
   - `callAPI` 함수에서 `API_URL` 사용

## 배포 완료
- **배포 시간**: 2026-01-23 09:22 UTC
- **배포 파일**: dist-api-fix-20260123092233.tar.gz
- **접속 URL**: http://3.34.186.174/
- **커밋**: 81fc801

## ⚠️ 중요: Apps Script 업데이트 필요!

현재 프론트엔드는 수정되었지만, **Apps Script v6.0 코드를 Google Sheets에 업데이트해야** JSON 동기화 기능이 작동합니다!

### Apps Script 업데이트 방법

1. **Google Sheets 열기**
   ```
   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
   ```

2. **Apps Script 에디터 열기**
   - 메뉴: 확장 프로그램 → Apps Script

3. **코드 교체**
   - `/home/user/webapp/google-apps-script-v6-json-backup.js` 파일 내용 복사
   - Apps Script 에디터에 전체 붙여넣기 (기존 코드 삭제)

4. **새 배포**
   - 배포 → 새 배포
   - 유형 선택: 웹 앱
   - 설명: "v6.0 - JSON DB 이중 백업 시스템"
   - 다음 계정으로 실행: **나**
   - 액세스 권한: **누구나**
   - 배포 클릭

5. **권한 승인**
   - Apps Script 에디터에서 함수 선택: `syncAllJsonFiles`
   - 실행 버튼 클릭
   - 권한 요청 팝업:
     - "계속" 클릭
     - Google 계정 선택
     - "고급" 클릭
     - "앱 이름(안전하지 않음)으로 이동" 클릭
     - "허용" 클릭

6. **테스트**
   - http://3.34.186.174/ 접속
   - 01063529091 로그인
   - "💾 JSON 동기화" 버튼 클릭
   - 성공 메시지 확인

## 테스트 체크리스트

### ✅ 프론트엔드 (완료)
- [x] API URL 수정
- [x] 빌드 성공
- [x] EC2 배포 완료
- [x] Git 커밋/푸시

### ⏳ Apps Script (필요)
- [ ] Apps Script v6.0 코드 업데이트
- [ ] 새 배포 (웹 앱)
- [ ] 권한 승인 (Google Drive)
- [ ] `syncAllJsonFiles` 함수 테스트

### 🧪 통합 테스트 (Apps Script 업데이트 후)
- [ ] 로그인 테스트
- [ ] 회원 조회 테스트
- [ ] JSON 동기화 버튼 테스트
- [ ] JSON 다운로드 버튼 테스트
- [ ] Google Drive에서 JSON 파일 확인

## API 엔드포인트 정리

### 기존 (잘못된 설정)
```typescript
// ❌ 404 오류 발생
const API_URL = 'http://3.34.186.174/api';
```

### 수정 (올바른 설정)
```typescript
// ✅ Apps Script 직접 호출
const API_URL = 'https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec';
```

## 지원 액션

| 액션 | 상태 | 설명 |
|------|------|------|
| `loginCompany` | ✅ | 기업회원 로그인 |
| `loginConsultant` | ✅ | 컨설턴트 로그인 |
| `registerCompany` | ✅ | 기업회원 가입 |
| `registerConsultant` | ✅ | 컨설턴트 가입 |
| `getAllMembers` | ⏳ | 전체 회원 조회 (Apps Script v6.0 필요) |
| `updateMemberStatus` | ⏳ | 승인 상태 변경 (Apps Script v6.0 필요) |
| `syncJson` | ⏳ | JSON 수동 동기화 (Apps Script v6.0 필요) |
| `getJsonUrls` | ⏳ | JSON 다운로드 URL (Apps Script v6.0 필요) |

## 문제 해결

### Q: JSON 동기화/다운로드 버튼이 여전히 작동하지 않아요
**A**: Apps Script v6.0이 배포되지 않았을 가능성이 높습니다.
1. Apps Script 에디터에서 코드 확인
2. 버전이 6.0인지 확인 (파일 상단 주석)
3. 새 배포 필요

### Q: "권한이 필요합니다" 오류
**A**: Google Drive 권한 승인 필요
1. Apps Script에서 `syncAllJsonFiles` 실행
2. 권한 요청 팝업에서 허용

### Q: CORS 오류가 발생해요
**A**: 이제 CORS 문제가 없습니다. Apps Script는 CORS를 지원합니다.

---

**업데이트 시간**: 2026-01-23 09:22 UTC  
**커밋**: 81fc801  
**상태**: ✅ 프론트엔드 완료, ⏳ Apps Script 업데이트 필요
