# 🚨 긴급: 로그인 404 에러 해결 방법

## 문제 확인
스크린샷에서 확인된 문제:
- **404 에러 발생**: API 호출 실패
- **URL**: `https://script.googleusercontent.com/macros/echo?...`
- **에러**: `(failed) net::ERR_BLOCKED_BY_RESPONSE`

## 원인
Apps Script가 **구버전(v6.2.8 또는 그 이전)**을 사용하고 있거나, 잘못된 배포 URL이 사용되고 있습니다.

---

## ✅ 즉시 해결 방법

### 1단계: 올바른 API URL 확인

브라우저 개발자 도구(F12) → Console 탭에서 확인:
- **현재 사용 중인 URL**: 스크린샷의 네트워크 요청 확인
- **예상 URL**: `https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec`

### 2단계: Apps Script v6.2.12 재배포 (필수!)

1. **Apps Script 에디터 열기**:
   ```
   https://script.google.com/home/projects/1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r/edit
   ```

2. **Code.gs 전체 교체**:
   - 현재 Code.gs 내용 **전체 삭제** (Ctrl+A → Delete)
   - 로컬 파일 열기: `/home/user/webapp/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js`
   - **전체 복사** (Ctrl+A → Ctrl+C)
   - Code.gs에 **붙여넣기** (Ctrl+V)
   - **저장** (Ctrl+S)

3. **첫 줄 확인**:
   ```javascript
   * 버전 6.2.12 - 시트 이름 수정 (올바른 이름으로 변경)
   ```

4. **새 버전으로 배포** (매우 중요!):
   - Deploy → Manage Deployments
   - 기존 배포 옆의 **연필(✏️) 아이콘** 클릭
   - ⚠️ **"New version" 선택** (필수!)
   - Version description: `v6.2.12 FINAL - 로그인 수정`
   - **Deploy** 클릭
   - MailApp 권한 재승인

5. **배포 URL 확인**:
   - 배포 완료 후 표시되는 Web App URL 복사
   - 예상 URL: `https://script.google.com/macros/s/AKfycbzeunTWd_3je.../exec`

6. **1-2분 대기**

### 3단계: API 테스트

브라우저에서 직접 API 호출:
```
https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec?action=getAllMembers&_t=1737714000
```

**성공 응답** (v6.2.12):
```json
{
  "success": true,
  "members": [
    {
      "userType": "company",
      "approvalStatus": "승인",
      ...
    }
  ]
}
```

**실패 응답** (구버전 또는 에러):
```json
{
  "success": false,
  "error": "..."
}
```
또는
```json
{
  "members": [
    {
      "type": "company",  // 구버전 필드!
      "status": "승인완료"
    }
  ]
}
```

---

## 🔍 추가 확인 사항

### 프론트엔드 API URL 확인

**방법 1**: 빌드된 파일 확인
```bash
cd /home/user/webapp
grep -o "AKfyc[a-zA-Z0-9_-]*" dist/assets/*.js
```

**예상 결과**:
```
AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH
```

**방법 2**: 브라우저 캐시 완전 삭제
1. `Ctrl + Shift + Delete`
2. "전체 기간" 선택
3. "캐시된 이미지 및 파일" 체크
4. 삭제
5. 강력 새로고침: `Ctrl + Shift + F5`

**방법 3**: 시크릿 모드 테스트
- `Ctrl + Shift + N`으로 시크릿 모드 열기
- `http://3.34.186.174/` 접속
- 로그인 시도
- F12 → Network 탭에서 API URL 확인

---

## 🐛 로그인 특정 문제 해결

### 문제 1: 기업회원 로그인 실패
**해결**:
- Google Sheets → `기업회원` 시트 확인
- I열(8번째 열) = `승인` (또는 `승인완료`가 아닌 `승인`)
- G열(6번째 열) = 비밀번호 (올바른 비밀번호 입력)

### 문제 2: 매니저/컨설턴트 로그인 실패
**원인**: 
- 고정 비밀번호 `12345` 사용
- G열 값과 무관

**해결**:
1. Google Sheets 확인:
   - `사근복매니저` 시트 (이름 정확히 일치해야 함)
   - `사근복컨설턴트` 시트 (이름 정확히 일치해야 함)
   - I열 = `승인`

2. 로그인 시도:
   - 전화번호: 시트의 B열 값
   - 비밀번호: **12345** (고정)

### 문제 3: 슈퍼관리자 로그인 루프
**이미 v6.2.12에서 수정됨**:
- `Auth.tsx`에 `isSuperAdmin` 필드 추가
- 전화번호 `01063529091` 자동 인식

**확인**:
- v6.2.12 배포 후 해결됨
- 프론트엔드 재배포 필요

---

## 📊 체크리스트

### Apps Script 배포 확인
- [ ] Code.gs가 v6.2.12 코드임
- [ ] 첫 줄: `* 버전 6.2.12`
- [ ] Deploy → New version 선택
- [ ] MailApp 권한 승인
- [ ] 배포 URL 복사

### API 테스트
- [ ] 브라우저에서 API 직접 호출
- [ ] `userType`, `approvalStatus` 필드 확인
- [ ] `type`, `status` 필드 없음 확인

### 프론트엔드 확인
- [ ] 브라우저 캐시 완전 삭제
- [ ] 강력 새로고침 (Ctrl+Shift+F5)
- [ ] 시크릿 모드 테스트
- [ ] F12 → Network 탭에서 API URL 확인

### Google Sheets 확인
- [ ] 시트 이름: `기업회원`, `사근복매니저`, `사근복컨설턴트`
- [ ] I열 = `승인` (승인완료 아님)
- [ ] 매니저/컨설턴트 B열 = 전화번호

---

## 🚀 빠른 테스트 계정

### 슈퍼관리자
- 전화번호: `01063529091`
- 비밀번호: (기존 설정된 비밀번호)

### 테스트 순서
1. Apps Script v6.2.12 재배포
2. API 직접 호출로 배포 확인
3. 브라우저 캐시 삭제
4. 시크릿 모드로 로그인 테스트
5. 슈퍼관리자 계정으로 테스트

---

## ❓ 여전히 로그인 안 되는 경우

다음 정보를 확인해주세요:

1. **개발자 도구 Console 탭**:
   - 에러 메시지 전체 텍스트
   - API URL (Network 탭에서)
   
2. **Apps Script 로그**:
   - Apps Script 에디터 → View → Logs
   - 최근 실행 로그 확인

3. **Google Sheets 데이터**:
   - 로그인 시도하는 전화번호가 시트에 존재하는지
   - I열 값이 `승인`인지
   - G열 비밀번호가 올바른지

---

**작성 일시**: 2026-01-24  
**긴급도**: 🔴 높음  
**예상 해결 시간**: 5-10분
