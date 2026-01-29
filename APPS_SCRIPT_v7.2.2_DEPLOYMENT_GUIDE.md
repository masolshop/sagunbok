# 📋 Apps Script v7.2.2 배포 가이드

## 🚨 긴급 수정 사항

**문제**: 기업회원 로그인 시 비밀번호 매칭 실패  
**원인**: 비밀번호 비교 로직 문제  
**해결**: v7.2.2에서 비밀번호 매칭 로직 개선 + 슈퍼 어드민 추가

---

## ✨ v7.2.2 주요 변경사항

### 1. 로그인 문제 수정
- 비밀번호 비교 시 `.trim()` 추가 (앞뒤 공백 제거)
- 디버깅 로그 대폭 강화
- 전화번호 매칭 시 상세 로그 출력

### 2. 슈퍼 어드민 추가
- 전화번호: **01063529091**
- 승인 대기 없이 즉시 로그인 가능
- 모든 메뉴 접근 가능
- `isSuperAdmin: true` 플래그 반환

### 3. 디버깅 로그
로그 시트에 다음 정보 기록:
```
- 전체 데이터 행 수
- 각 행의 전화번호 비교 결과
- 비밀번호 매칭 상세 정보
- 승인 상태 확인
```

---

## 🚀 배포 방법

### 1. Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
```

### 2. Apps Script 에디터 열기
```
확장 프로그램 → Apps Script
```

### 3. 기존 코드 전체 선택 및 삭제
```
Ctrl+A (Windows) / Cmd+A (Mac)
Delete
```

### 4. 새 코드 붙여넣기
```
APPS_SCRIPT_v7.2.2_LOGIN_FIX.gs 파일 내용 복사 → 붙여넣기
```

### 5. 저장
```
파일 → 저장
또는 Ctrl+S (Windows) / Cmd+S (Mac)
```

### 6. 새 배포 생성
```
1. 배포 → 웹 앱으로 배포
2. "새 배포" 클릭
3. 설명: "v7.2.2 - 로그인 문제 수정 및 슈퍼 어드민 추가"
4. 액세스 권한: "모든 사용자"
5. "배포" 클릭
```

### 7. 새 배포 URL 복사
```
예시: https://script.google.com/macros/s/AKfycby.../exec
```

### 8. Frontend Auth.tsx 업데이트
`components/Auth.tsx` 파일의 13번 라인 수정:
```typescript
const API_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_URL/exec';
```

---

## 🧪 테스트 시나리오

### 테스트 1: 슈퍼 어드민 로그인
```
1. https://sagunbok.com 접속
2. 로그인 클릭
3. 기업 탭 선택
4. 입력:
   - 전화번호: 010-6352-9091
   - 비밀번호: (본인 비밀번호)
5. 로그인 버튼 클릭
6. 기대 결과: 즉시 로그인 성공 (승인 대기 없음)
```

### 테스트 2: 일반 기업회원 로그인
```
1. 기존에 가입된 기업회원 계정으로 로그인 시도
2. 비밀번호가 정확히 매칭되는지 확인
3. 로그 시트에서 DEBUG 로그 확인
```

### 테스트 3: 로그 확인
```
1. Google Sheets → 로그 시트
2. 최신 로그 확인:
   - 액션: loginCompany
   - 상태: DEBUG, SUCCESS, FAIL
   - 메시지: 상세한 디버깅 정보
```

---

## 🔍 로그 분석 예시

### 성공적인 로그인
```
타임스탬프: 2026-01-29 10:30:00
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: START
메시지: 기업회원 로그인 시도

타임스탬프: 2026-01-29 10:30:01
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: DEBUG
메시지: 전체 데이터 행 수: 5

타임스탬프: 2026-01-29 10:30:01
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: DEBUG
메시지: 행 1: 전화='01012345678, 비밀번호매칭=true

타임스탬프: 2026-01-29 10:30:01
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: DEBUG
메시지: 전화번호 매칭 성공! 입력비밀번호=1234, DB비밀번호=1234

타임스탬프: 2026-01-29 10:30:01
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: SUCCESS
메시지: 로그인 성공: 테스트컴퍼니
```

### 비밀번호 불일치
```
타임스탬프: 2026-01-29 10:31:00
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: DEBUG
메시지: 전화번호 매칭 성공! 입력비밀번호=wrongpass, DB비밀번호=1234

타임스탬프: 2026-01-29 10:31:00
액션: loginCompany
회원타입: company
전화번호: 01012345678
상태: FAIL
메시지: 비밀번호 불일치: 입력=wrongpass, DB=1234
```

---

## 🛠️ 문제 해결

### 문제 1: 여전히 로그인 안 됨
**해결책**:
1. 로그 시트 확인
2. DEBUG 메시지에서 비밀번호 확인
3. Google Sheets에서 직접 비밀번호 확인
4. 필요시 비밀번호 재설정

### 문제 2: 슈퍼 어드민 권한 안 보임
**해결책**:
1. 전화번호가 정확히 `01063529091`인지 확인
2. Frontend에서 `user.isSuperAdmin` 확인
3. 로그아웃 후 재로그인

### 문제 3: 배포 URL이 작동 안 함
**해결책**:
1. 배포 시 "액세스 권한"이 "모든 사용자"인지 확인
2. 새 배포를 생성했는지 확인 (기존 배포 업데이트 아님)
3. 캐시 삭제 후 재시도

---

## 📝 체크리스트

배포 전:
- [ ] APPS_SCRIPT_v7.2.2_LOGIN_FIX.gs 파일 준비
- [ ] Google Sheets 백업

배포 중:
- [ ] Apps Script 에디터에서 코드 교체
- [ ] 저장 완료
- [ ] 새 배포 생성 (v7.2.2 설명 입력)
- [ ] 새 배포 URL 복사

배포 후:
- [ ] Frontend Auth.tsx URL 업데이트
- [ ] Frontend 빌드 & 배포
- [ ] 슈퍼 어드민 로그인 테스트
- [ ] 일반 회원 로그인 테스트
- [ ] 로그 시트 확인

---

## 🔗 관련 파일

- **Apps Script**: `APPS_SCRIPT_v7.2.2_LOGIN_FIX.gs`
- **배포 가이드**: `APPS_SCRIPT_v7.2.2_DEPLOYMENT_GUIDE.md`
- **Frontend**: `components/Auth.tsx`
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc

---

## ⚠️ 중요 참고사항

1. **비밀번호는 평문 저장**됩니다 (개선 필요)
2. **슈퍼 어드민 전화번호**: 01063529091 (하드코딩)
3. **디버깅 로그**는 프로덕션에서도 활성화됨 (민감 정보 주의)

---

**배포 완료 후**: 슈퍼 어드민으로 로그인하여 모든 기능 테스트 ✅
