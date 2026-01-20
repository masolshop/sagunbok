# 🚀 사근복 AI - Google Sheets 회원 시스템 배포 가이드

## 📋 전체 단계

1. ✅ Google Sheets 생성 및 구조 설정
2. ✅ Google Apps Script 배포
3. ✅ 프론트엔드 설정 및 배포
4. ✅ 테스트 및 운영

---

## 1단계: Google Sheets 생성

### 1-1. 새 스프레드시트 생성

```
1. https://sheets.google.com 접속
2. 빈 스프레드시트 생성
3. 이름: "사근복_회원DB"
4. URL 복사 (나중에 필요)
```

### 1-2. 시트 생성 및 헤더 설정

**시트 1: 기업회원**
```
하단 탭에서 "Sheet1" 우클릭 → 이름 바꾸기 → "기업회원"

A1: 가입일시
B1: 회사명
C1: 이름
D1: 핸드폰번호(ID)
E1: 이메일
F1: 비밀번호
G1: 승인상태
H1: 마지막로그인
```

**시트 2: 사근복컨설턴트**
```
하단 탭에서 "+" 클릭 → 새 시트 생성 → 이름: "사근복컨설턴트"

A1: 가입일시
B1: 이름
C1: 핸드폰번호(ID)
D1: 이메일
E1: 승인상태
F1: 소속사업단
G1: 소속지사
H1: 직함
I1: 마지막로그인
```

**시트 3: 로그인기록**
```
하단 탭에서 "+" 클릭 → 새 시트 생성 → 이름: "로그인기록"

A1: 시간
B1: 회원구분
C1: 사용자ID
D1: 이름
E1: 회사명
F1: 상태
G1: 실패사유
```

### 1-3. 샘플 데이터 입력 (테스트용)

**기업회원 시트 (A2:H2)**:
```
2026-01-20 10:00:00 | (주)테스트 | 홍길동 | 01012345678 | test@company.com | test1234 | 승인완료 | 
```

**사근복컨설턴트 시트 (A2:I2)**:
```
2026-01-20 10:00:00 | 김전문 | 01087654321 | expert@sagunbok.com | 승인완료 | 서울사업단 | 강남지사 | 수석컨설턴트 | 
```

### 1-4. 스프레드시트 ID 복사

```
URL 예시: https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
스프레드시트 ID: 1ABC...XYZ 부분 복사
```

---

## 2단계: Google Apps Script 배포

### 2-1. Apps Script 편집기 열기

```
1. Google Sheets에서 상단 메뉴: 확장 프로그램 → Apps Script
2. 새 프로젝트가 열림
3. 프로젝트 이름: "사근복_인증API"
```

### 2-2. 코드 붙여넣기

```
1. 기본 Code.gs 파일 내용 전체 삭제
2. `google-apps-script-backend.js` 파일 내용 복사
3. Code.gs에 붙여넣기
4. 2번째 줄의 SPREADSHEET_ID를 실제 ID로 교체:
   const SPREADSHEET_ID = '여기에_스프레드시트_ID_붙여넣기';
```

### 2-3. 웹 앱으로 배포

```
1. 상단 메뉴: 배포 → 새 배포
2. 유형 선택: 웹 앱
3. 설명: "사근복 회원 인증 API v1"
4. 실행 권한: "나"
5. 액세스 권한: "모든 사용자" (중요!)
6. 배포 클릭
7. 권한 부여:
   - Google 계정 선택
   - 고급 클릭
   - "사근복_인증API(안전하지 않음)"로 이동
   - 허용 클릭
8. **웹 앱 URL 복사**: https://script.google.com/macros/s/.../exec
```

### 2-4. 배포 테스트 (선택사항)

Apps Script 편집기에서 테스트 함수 실행:
```
1. 함수 선택: testRegisterCompany
2. 실행 클릭
3. 로그 확인: 하단 실행 로그에서 결과 확인
4. Google Sheets에서 "기업회원" 시트 확인 → 새 행 추가 확인
```

---

## 3단계: 프론트엔드 설정

### 3-1. Auth.tsx 수정

`/home/user/webapp/components/Auth.tsx` 파일 열기:

```typescript
// 5번째 줄 수정:
const BACKEND_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

// 실제 URL로 교체 (2-3에서 복사한 URL):
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

### 3-2. 로컬 테스트

```bash
cd /home/user/webapp
npm run dev
```

브라우저에서 http://localhost:5173 접속:
- 회원가입 테스트 (기업회원 / 컨설턴트)
- 로그인 테스트
- ID/비밀번호 찾기 테스트

### 3-3. 프로덕션 빌드

```bash
cd /home/user/webapp
npm run build
```

---

## 4단계: AWS 배포

### 4-1. 빌드 파일 압축 및 전송

```bash
cd /home/user/webapp/dist
tar -czf ../dist.tar.gz .

scp -i lightsail-key.pem ../dist.tar.gz ubuntu@3.34.186.174:/var/www/sagunbok/
```

### 4-2. AWS 서버에서 배포

```bash
ssh -i lightsail-key.pem ubuntu@3.34.186.174

cd /var/www/sagunbok
tar -xzf dist.tar.gz
rm dist.tar.gz

sudo systemctl reload nginx
```

### 4-3. 배포 확인

```
브라우저에서 http://3.34.186.174 접속
→ 로그인 화면이 나타나야 함
```

---

## 5단계: 회원 승인 관리

### 5-1. 신규 회원가입 확인

```
1. Google Sheets "기업회원" 또는 "사근복컨설턴트" 시트 열기
2. 새로 가입한 회원 확인
3. "승인상태" 열 확인: "대기중"
```

### 5-2. 회원 승인

```
1. 승인할 회원의 "승인상태" 셀 선택
2. 드롭다운 또는 직접 입력:
   - "승인완료" 입력 → 로그인 가능
   - "거부" 입력 → 로그인 차단
```

### 5-3. 로그인 로그 확인

```
1. "로그인기록" 시트 열기
2. 로그인 시도 내역 확인:
   - success: 로그인 성공
   - failed: 로그인 실패
   - pending_approval: 승인 대기 중
```

---

## 6단계: 운영 가이드

### 회원 관리 일일 체크리스트

**매일 아침**:
1. ✅ 신규 가입 회원 확인 (대기중 상태)
2. ✅ 회원 정보 검토 (회사명, 이름, 이메일 등)
3. ✅ 승인 처리 (승인완료 / 거부)
4. ✅ 로그인 로그 확인 (이상 패턴 감지)

**주간 리뷰**:
1. ✅ 총 회원 수 확인
2. ✅ 활성 사용자 수 (최근 7일 로그인)
3. ✅ 거부된 회원 리스트 검토
4. ✅ 데이터 백업

### 회원 정보 수정

**비밀번호 재설정 (기업회원)**:
```
1. "기업회원" 시트에서 해당 회원 찾기
2. "비밀번호" 열 (F열) 직접 수정
3. 사용자에게 새 비밀번호 전달
```

**승인 상태 변경**:
```
1. 해당 회원 찾기
2. "승인상태" 열 (G 또는 E열) 수정:
   - 승인완료 → 대기중 (일시 중지)
   - 승인완료 → 거부 (차단)
   - 거부 → 승인완료 (복구)
```

### 데이터 백업

**주간 백업 (권장)**:
```
1. Google Sheets 메뉴: 파일 → 다운로드 → Microsoft Excel (.xlsx)
2. 파일명: 사근복_회원DB_2026-01-20.xlsx
3. 안전한 위치에 보관
```

**자동 백업 설정 (고급)**:
```
Google Drive에서 자동 버전 관리 활성화
- 파일 → 버전 기록 → 변경사항 보기
- 30일간 자동 저장
```

---

## 7단계: 트러블슈팅

### 문제 1: 로그인이 안 됨

**증상**: "로그인 실패" 또는 무반응

**해결 방법**:
```
1. Google Sheets 확인:
   - 전화번호가 정확히 입력되었는지 확인
   - 비밀번호가 일치하는지 확인
   - 승인상태가 "승인완료"인지 확인

2. Apps Script 확인:
   - Apps Script 편집기 열기
   - 실행 → 로그 확인
   - 오류 메시지 확인

3. 브라우저 콘솔 확인:
   - F12 → Console 탭
   - 빨간색 오류 확인
   - BACKEND_URL이 올바른지 확인
```

### 문제 2: "승인 대기 중" 메시지

**증상**: 로그인 시 "관리자 승인 대기 중입니다" 표시

**해결 방법**:
```
1. Google Sheets에서 해당 회원 찾기
2. "승인상태" 열이 "대기중"인지 확인
3. "승인완료"로 변경
4. 사용자에게 재로그인 요청
```

### 문제 3: Apps Script 권한 오류

**증상**: "권한이 없습니다" 또는 403 에러

**해결 방법**:
```
1. Apps Script 편집기 열기
2. 배포 → 배포 관리
3. 액세스 권한이 "모든 사용자"인지 확인
4. 아니면 "수정" 클릭 → "모든 사용자" 선택 → 배포
5. 새 URL 복사 → 프론트엔드에 업데이트
```

### 문제 4: CORS 에러

**증상**: 브라우저 콘솔에 "CORS policy" 오류

**해결 방법**:
```
Apps Script는 CORS를 자동 지원합니다.
만약 오류 발생 시:
1. BACKEND_URL이 정확한지 확인
2. URL 끝에 /exec가 있는지 확인 (없으면 추가)
3. 새 배포 생성 → 새 URL 사용
```

---

## 8단계: 보안 강화 (선택사항)

### 비밀번호 해시화

현재는 평문으로 저장됩니다. 해시화 권장:

```javascript
// google-apps-script-backend.js 수정

// 가입 시:
password, // → hashPassword(password)로 변경

// 로그인 시:
if (user.password !== password) {
  // →
if (user.password !== hashPassword(password)) {
```

### 로그인 시도 제한

5회 실패 시 10분 잠금:

```javascript
// Apps Script에 카운터 추가
// PropertiesService 사용
const failedAttempts = PropertiesService.getScriptProperties()
  .getProperty('failed_' + cleanPhone) || '0';
```

---

## 9단계: 모니터링

### Google Apps Script 실행 로그

```
1. Apps Script 편집기 열기
2. 상단 메뉴: 실행 → 실행 로그
3. 최근 API 호출 내역 확인
4. 오류 발생 시 빨간색으로 표시
```

### Google Sheets 활동 로그

```
1. "로그인기록" 시트 열기
2. 데이터 → 필터 만들기
3. "상태" 열 필터:
   - "failed" 선택 → 실패한 로그인 확인
   - "success" 선택 → 성공한 로그인 확인
```

---

## 🎉 완료!

이제 사근복 AI에 회원가입/로그인 시스템이 적용되었습니다!

### 다음 단계:
1. ✅ 실제 사용자 테스트
2. ✅ 피드백 수집 및 개선
3. ⏳ SSL/HTTPS 적용 (도메인 연결 시)
4. ⏳ 이메일 인증 추가 (선택사항)
5. ⏳ 소셜 로그인 추가 (선택사항)

**문의사항이 있으면 언제든지 알려주세요!** 🚀
