# ✅ 사근복 AI - Google Sheets 설정 체크리스트

## 📝 빠른 설정 가이드 (10분 소요)

### 1단계: Google Sheets 생성 ✅

1. **새 스프레드시트 만들기**
   ```
   https://sheets.google.com → 빈 스프레드시트
   이름: "사근복_회원DB"
   ```

2. **시트 1: 기업회원** (Sheet1 이름 변경)
   ```
   A1~H1에 다음 입력:
   가입일시 | 회사명 | 이름 | 핸드폰번호(ID) | 이메일 | 비밀번호 | 승인상태 | 마지막로그인
   ```

3. **시트 2: 사근복컨설턴트** (새 시트 추가)
   ```
   A1~I1에 다음 입력:
   가입일시 | 이름 | 핸드폰번호(ID) | 이메일 | 승인상태 | 소속사업단 | 소속지사 | 직함 | 마지막로그인
   ```

4. **시트 3: 로그인기록** (새 시트 추가)
   ```
   A1~G1에 다음 입력:
   시간 | 회원구분 | 사용자ID | 이름 | 회사명 | 상태 | 실패사유
   ```

5. **테스트 데이터 입력** (A2 행에 입력)
   
   **기업회원 시트 A2~H2:**
   ```
   2026-01-20 10:00:00
   (주)테스트
   홍길동
   01012345678
   test@company.com
   test1234
   승인완료
   (빈칸)
   ```

   **사근복컨설턴트 시트 A2~I2:**
   ```
   2026-01-20 10:00:00
   김전문
   01087654321
   expert@sagunbok.com
   승인완료
   서울사업단
   강남지사
   수석컨설턴트
   (빈칸)
   ```

6. **스프레드시트 ID 복사**
   ```
   URL에서 복사:
   https://docs.google.com/spreadsheets/d/[여기부분]/edit
   
   예시: 1ABCdefGHIjklMNOpqrSTUvwxYZ123456789
   ```

---

### 2단계: Google Apps Script 배포 ✅

1. **Apps Script 열기**
   ```
   Google Sheets 메뉴 → 확장 프로그램 → Apps Script
   ```

2. **코드 붙여넣기**
   ```
   - 기본 Code.gs 내용 전체 삭제
   - google-apps-script-backend.js 파일 내용 복사
   - Code.gs에 붙여넣기
   ```

3. **스프레드시트 ID 수정**
   ```javascript
   // 2번째 줄 수정:
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   
   // 실제 ID로 교체:
   const SPREADSHEET_ID = '1ABCdefGHIjklMNOpqrSTUvwxYZ123456789';
   ```

4. **웹 앱으로 배포**
   ```
   상단 메뉴: 배포 → 새 배포
   
   설정:
   - 유형: 웹 앱
   - 설명: "사근복 회원 인증 API v1"
   - 실행 권한: 나
   - 액세스 권한: 모든 사용자 ⚠️ (중요!)
   
   배포 클릭 → 권한 부여
   ```

5. **웹 앱 URL 복사**
   ```
   형식: https://script.google.com/macros/s/AKfycby.../exec
   
   ⚠️ 이 URL을 복사해두세요! (다음 단계에서 사용)
   ```

---

### 3단계: 프론트엔드 설정 ✅

**Auth.tsx 파일 수정:**

파일 위치: `/home/user/webapp/components/Auth.tsx`

```typescript
// 5번째 줄 찾기:
const BACKEND_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

// 다음과 같이 수정 (2단계에서 복사한 URL 사용):
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

---

### 4단계: 빌드 및 배포 ✅

```bash
# 1. 프론트엔드 빌드
cd /home/user/webapp
npm run build

# 2. 압축
cd dist
tar -czf ../dist.tar.gz .

# 3. AWS로 전송
cd ..
scp -i lightsail-key.pem dist.tar.gz ubuntu@3.34.186.174:/var/www/sagunbok/

# 4. AWS에서 배포
ssh -i lightsail-key.pem ubuntu@3.34.186.174
cd /var/www/sagunbok
tar -xzf dist.tar.gz
rm dist.tar.gz
sudo systemctl reload nginx
exit

# 5. 브라우저에서 확인
# http://3.34.186.174
```

---

### 5단계: 테스트 ✅

1. **로그인 화면 확인**
   - http://3.34.186.174 접속
   - 로그인 화면이 표시되어야 함

2. **기업회원 로그인 테스트**
   ```
   ID: 01012345678
   비밀번호: test1234
   → 로그인 성공
   ```

3. **컨설턴트 로그인 테스트**
   ```
   ID: 01087654321
   비밀번호: 12345
   → 로그인 성공
   ```

4. **회원가입 테스트**
   ```
   "회원가입" 클릭
   → 기업회원/컨설턴트 탭 전환 확인
   → 정보 입력 후 가입
   → Google Sheets에서 데이터 확인
   → 승인상태 "대기중" 확인
   ```

5. **승인 및 로그인 테스트**
   ```
   Google Sheets에서 승인상태 → "승인완료" 변경
   → 해당 ID로 로그인 시도
   → 로그인 성공 확인
   ```

---

## 🚨 주의사항

### Apps Script 배포 시:
- ✅ **액세스 권한을 "모든 사용자"로 설정** (필수!)
- ✅ 권한 부여 시 "고급" 클릭 → "안전하지 않음으로 이동" 허용
- ✅ 웹 앱 URL 끝에 `/exec` 확인

### Auth.tsx 설정 시:
- ✅ BACKEND_URL에 정확한 Apps Script URL 입력
- ✅ URL 끝에 `/exec` 포함 확인
- ✅ 따옴표 안에 URL 입력

### Google Sheets 시트 이름:
- ✅ 정확히 "기업회원" (띄어쓰기 없음)
- ✅ 정확히 "사근복컨설턴트" (띄어쓰기 없음)
- ✅ 정확히 "로그인기록" (띄어쓰기 없음)

---

## 📞 문제 해결

### 로그인이 안 될 때:
1. 브라우저 F12 → Console 탭 확인
2. BACKEND_URL이 올바른지 확인
3. Apps Script 실행 로그 확인
4. Google Sheets 승인상태 확인

### "승인 대기 중" 메시지:
- Google Sheets에서 승인상태를 "승인완료"로 변경

### CORS 에러:
- Apps Script 배포 시 액세스 권한이 "모든 사용자"인지 확인

---

## ✅ 완료 체크리스트

배포 완료 확인:
- [ ] Google Sheets 3개 시트 생성 완료
- [ ] 테스트 데이터 입력 완료
- [ ] Apps Script 웹 앱 배포 완료
- [ ] 웹 앱 URL 복사 완료
- [ ] Auth.tsx BACKEND_URL 수정 완료
- [ ] 프론트엔드 빌드 완료
- [ ] AWS 배포 완료
- [ ] 로그인 화면 표시 확인
- [ ] 테스트 계정 로그인 성공
- [ ] 회원가입 테스트 성공

---

**모든 단계를 완료하셨나요?** 

다음 단계를 진행하시거나, 문제가 있으면 알려주세요! 🚀
