# 🚀 v6.2.12 배포 완료 가이드

## 📦 빌드 완료 ✅

### 빌드 정보
- **빌드 시각**: 2026-01-24 17:19
- **빌드 크기**: 
  - `index-C3aa0pzc.js`: 670.65 kB (gzip: 155.47 kB)
  - `index-D7f1ZBkG.css`: 18.17 kB (gzip: 3.99 kB)
- **API URL 검증**: ✅ 새 v6.2.12 URL 포함 확인

### 새 API URL (빌드에 포함됨)
```
https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec
```

---

## 🖥️ EC2 배포 방법

### ⭐ 방법 1: SCP 배포 (가장 간단)

```bash
# 1. 디렉토리 생성 (처음 한 번만)
ssh ubuntu@3.34.186.174 "mkdir -p /var/www/sagunbok"

# 2. 빌드 파일 복사
scp -r ./dist/* ubuntu@3.34.186.174:/var/www/sagunbok/

# 3. Nginx 재시작 (필요 시)
ssh ubuntu@3.34.186.174 "sudo systemctl restart nginx"
```

### 방법 2: rsync 배포 (증분 업데이트)

```bash
rsync -avz --delete ./dist/ ubuntu@3.34.186.174:/var/www/sagunbok/
```

### 방법 3: Git을 통한 배포 (EC2에서 빌드)

```bash
# 1. EC2에 SSH 접속
ssh ubuntu@3.34.186.174

# 2. 저장소로 이동
cd /var/www/sagunbok

# 3. 최신 코드 Pull
git fetch origin
git checkout genspark_ai_developer
git pull origin genspark_ai_developer

# 4. 빌드
npm install
npm run build

# 5. Nginx 재시작
sudo systemctl restart nginx
```

---

## ✅ 배포 후 확인 사항

### 1. 웹사이트 접속 확인
브라우저에서 열기:
```
http://3.34.186.174/
```

### 2. API URL 확인
1. **F12** 키로 개발자 도구 열기
2. **Network** 탭 이동
3. 로그인 또는 회원가입 시도
4. API 요청 확인:
   - URL에 `AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH` 포함 여부 확인
   - ✅ 새 URL 사용 = 배포 성공
   - ❌ 구 URL 사용 = 캐시 문제 (Ctrl+F5로 강력 새로고침)

### 3. 캐시 클리어 (필요 시)
브라우저 캐시 때문에 구버전이 보일 수 있습니다:
- **Chrome/Edge**: `Ctrl + Shift + Delete` → 캐시 삭제
- **강력 새로고침**: `Ctrl + F5` 또는 `Shift + F5`
- **시크릿 모드**: `Ctrl + Shift + N`으로 테스트

---

## 🧪 배포 후 테스트 체크리스트

### 필수 테스트 항목

#### ✅ 1. 로그인 테스트
- [ ] **기업회원 로그인**
  - 전화번호 + 커스텀 비밀번호
  - 로그인 성공 후 대시보드 접근
  
- [ ] **매니저 로그인**
  - 전화번호 + 비밀번호 **12345**
  - 매니저 대시보드 접근
  
- [ ] **컨설턴트 로그인**
  - 전화번호 + 비밀번호 **12345**
  - 컨설턴트 대시보드 접근
  
- [ ] **슈퍼관리자 로그인**
  - 전화번호: **01063529091** (이종근)
  - 비밀번호: 기존 비밀번호
  - ⚠️ 로그인 루프 없이 정상 접근 (v6.2.12 버그 수정)

#### ✅ 2. 회원가입 테스트
- [ ] **기업회원 가입**
  - 모든 필수 필드 입력
  - 추천인: 등록된 매니저/컨설턴트 이름 (예: "이종근")
  - 가입 성공 메시지 확인
  
- [ ] **매니저 가입**
  - 필수 필드 입력
  - 비밀번호 12345 안내 확인
  - 가입 성공 메시지 확인
  
- [ ] **컨설턴트 가입**
  - 필수 필드 입력
  - 비밀번호 12345 안내 확인
  - 가입 성공 메시지 확인

#### ✅ 3. 이메일 발송 테스트 (중요!)
- [ ] **기업회원 가입 시 이메일 3건**
  - 가입한 회원에게: 가입 완료 이메일
  - 추천인(매니저/컨설턴트)에게: 추천 회원 가입 알림
  - 관리자에게: 승인 요청 이메일
  - 발신자: **TY사근복헬스케어사업단 <tysagunbok@gmail.com>**
  
- [ ] **매니저/컨설턴트 가입 시 이메일 2건**
  - 가입한 회원에게: 가입 완료 이메일
  - 관리자에게: 승인 요청 이메일
  
- [ ] **승인/반려 이메일**
  - 관리자가 승인 시: 해당 회원에게 승인 이메일
  - 관리자가 반려 시: 해당 회원에게 반려 이메일

#### ✅ 4. 추천인 검증 테스트
- [ ] **유효한 추천인**
  - Google Sheets에 등록된 매니저/컨설턴트 이름 입력
  - 가입 성공
  
- [ ] **유효하지 않은 추천인**
  - 등록되지 않은 이름 입력
  - 오류 메시지: "유효하지 않은 추천인입니다..."
  - 가입 실패

#### ✅ 5. 관리자 대시보드 테스트
- [ ] **회원 목록 표시**
  - 기업회원 목록
  - 매니저 목록 (시트명: `사근복매니저`)
  - 컨설턴트 목록 (시트명: `사근복컨설턴트`)
  
- [ ] **승인/반려 기능**
  - 승인 대기 회원 승인
  - 승인 상태 변경 확인
  - 이메일 발송 확인
  
- [ ] **JSON 동기화 기능** (슈퍼관리자만)
  - JSON 동기화 버튼 클릭
  - 성공 메시지 확인

#### ✅ 6. G열 이슈 검증
- [ ] Google Sheets에서 매니저/컨설턴트 G열 확인
- [ ] G열 값이 '?' 인 계정으로 로그인
- [ ] 비밀번호 **12345**로 로그인 성공 (G열 값과 무관)

---

## 🔧 문제 해결

### 문제 1: 구버전 API URL이 보임
**증상**: Network 탭에서 구버전 URL 호출
```
❌ AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate
```

**해결**:
1. 브라우저 캐시 완전 삭제
2. 강력 새로고침: `Ctrl + Shift + F5`
3. 시크릿 모드로 테스트
4. EC2 서버 파일 확인:
   ```bash
   ssh ubuntu@3.34.186.174 "grep -r 'AKfyc' /var/www/sagunbok/assets/*.js"
   ```

### 문제 2: API 응답이 구버전 필드 사용
**증상**: API 응답에 `type`, `status` 필드
```json
{
  "type": "company",
  "status": "승인완료"
}
```

**해결**: Apps Script 재배포 필요
1. https://script.google.com/home/projects/1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r/edit
2. Code.gs 전체를 `APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js`로 교체
3. **Deploy → Manage Deployments → Edit → New version**
4. 1-2분 대기 후 재테스트

### 문제 3: 슈퍼관리자 로그인 루프
**증상**: 01063529091로 로그인 후 계속 로그인 화면

**해결**: 이미 v6.2.12에서 수정됨
- `Auth.tsx`에 `isSuperAdmin` 필드 추가
- 재배포 후 해결됨

### 문제 4: 이메일 발송 안 됨
**원인**: MailApp 권한 없음

**해결**:
1. Apps Script 에디터에서 재배포 시 MailApp 권한 재승인
2. Gmail 계정으로 로그인 후 권한 허용

---

## 📊 배포 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| v6.2.12 코드 | ✅ 완성 | APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js |
| 프론트엔드 빌드 | ✅ 완료 | dist/ 디렉토리 |
| 새 API URL 포함 | ✅ 확인 | 빌드 파일에 포함 |
| Git 커밋 & 푸시 | ✅ 완료 | genspark_ai_developer 브랜치 |
| PR 업데이트 | ✅ 완료 | #1 |
| EC2 배포 준비 | ✅ 완료 | 배포 스크립트 실행 |
| EC2 실제 배포 | 🔄 대기 | 사용자 실행 필요 |
| 통합 테스트 | 🔄 대기 | 배포 후 체크리스트 |

---

## 🎯 즉시 실행 가능한 배포 명령어

### 빠른 배포 (SCP)
```bash
# 현재 위치: /home/user/webapp

# 1. 빌드 파일 복사 (한 줄 명령어)
scp -r ./dist/* ubuntu@3.34.186.174:/var/www/sagunbok/

# 2. Nginx 재시작
ssh ubuntu@3.34.186.174 "sudo systemctl restart nginx"

# 3. 브라우저에서 확인
# http://3.34.186.174/
```

---

## 📞 지원 및 문서

### 관련 문서
- `FRONTEND_UPDATE_COMPLETE.md` - 프론트엔드 업데이트 완료 보고
- `V6.2.12_FINAL_DEPLOYMENT_UPDATE.md` - 배포 업데이트 가이드
- `DEPLOY_V6.2.12_URGENT.md` - 긴급 배포 가이드
- `V6.2.12_MANUAL_TEST_GUIDE.md` - 수동 테스트 가이드
- `DEPLOY_INFO_v6.2.12.txt` - 배포 정보 파일

### 관련 링크
- **PR**: https://github.com/masolshop/sagunbok/pull/1
- **Apps Script**: https://script.google.com/home/projects/1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r/edit
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **EC2 프론트엔드**: http://3.34.186.174/

---

## ✅ 최종 체크리스트

- [x] v6.2.12 코드 작성
- [x] 프론트엔드 API URL 업데이트
- [x] 프론트엔드 빌드 (npm run build)
- [x] 빌드 파일 검증 (새 API URL 포함)
- [x] Git 커밋 및 PR 업데이트
- [x] 배포 스크립트 작성
- [x] 배포 문서 작성
- [ ] EC2 실제 배포 (SCP/rsync/Git 중 선택)
- [ ] 브라우저 캐시 클리어
- [ ] 전체 기능 테스트 (체크리스트)
- [ ] 이메일 발송 확인
- [ ] Apps Script 배포 확인

---

**배포 준비 완료!** 🎉  
위의 **"빠른 배포"** 명령어로 즉시 배포 가능합니다.

**작성 일시**: 2026-01-24 17:19  
**PR**: https://github.com/masolshop/sagunbok/pull/1
