# 🚀 Apps Script v6.2.6 배포 가이드

## 📋 v6.2.6 주요 변경사항

### ✅ 추가된 기능
1. **로그 기록 기능 복원**
   - 모든 로그인/회원가입 시도를 '로그' 시트에 기록
   - 타임스탬프, 액션, 구분, 대상, 세부정보, 결과 포함

2. **승인상태 유연성**
   - "승인" 또는 "승인완료" 모두 허용
   - 현재 구글 시트의 "승인완료" 값도 정상 인식

3. **디버깅 강화**
   - 로그인 시도 시 상세 로그 출력
   - 승인상태 값의 원본, trim 후, 길이 등 디버깅 정보 포함

4. **로그 시트 자동 생성**
   - '로그' 시트가 없으면 자동으로 생성
   - 헤더 자동 설정

---

## 🔧 배포 절차

### 1단계: Apps Script 에디터 열기
```
구글 시트 열기
→ 확장 프로그램
→ Apps Script
```

### 2단계: 코드 전체 교체
1. 기존 코드 **전체 선택** (Ctrl+A)
2. **삭제**
3. `/home/user/webapp/APPS_SCRIPT_V6.2.6_WITH_LOGGING.js` 파일 내용 **전체 복사**
4. Apps Script 에디터에 **붙여넣기**
5. **저장** (Ctrl+S)

### 3단계: 권한 승인
1. 상단 함수 드롭다운에서 `testSpreadsheetAccess` 선택
2. **실행** 버튼 클릭 ▶
3. 권한 승인 팝업:
   - **"Authorization required"** → Review permissions
   - Google 계정 선택
   - ⚠️ "Google hasn't verified this app" → **Advanced**
   - **"Go to [프로젝트 이름] (unsafe)"** 클릭
   - **Allow** 클릭
4. 실행 로그 확인 (Ctrl+Enter):
   ```
   ✅ 성공! 스프레드시트: ...
   ✅ 기업회원 행 수: ...
   ```

### 4단계: 배포
1. 우측 상단 **배포** 버튼 클릭
2. **새 배포** 선택
3. 설정:
   - **유형**: 웹 앱
   - **설명**: `v6.2.6 - 로그 기록 및 승인상태 개선`
   - **실행 계정**: 나
   - **액세스 권한**: 모든 사용자
4. **배포** 클릭
5. **새 배포 URL 복사**

---

## 🧪 테스트

### 터미널 테스트
```bash
# 새 배포 URL로 교체하여 실행
curl -L 'https://script.google.com/macros/s/[새URL]/exec?action=loginCompany&phone=01063529091&password=12345'
```

**예상 결과 (성공)**:
```json
{
  "success": true,
  "user": {
    "userType": "company",
    "companyName": "페마연",
    "companyType": "법인",
    "referrer": "이종근",
    "name": "이종근",
    "phone": "01063529091",
    "email": "tysagunbok@gmail.com"
  }
}
```

### 로그 확인
1. 구글 시트로 돌아가기
2. 하단 탭에서 **'로그'** 시트 선택
3. 최근 로그인 시도 기록 확인:
   ```
   타임스탬프 | 액션 | 구분 | 대상 | 세부정보 | 결과
   2026-01-24 ... | 로그인 | 기업회원 | 01063529091 | 페마연 | 성공
   ```

---

## 📊 로그 시트 구조

새로 생성되는 '로그' 시트의 구조:

| 컬럼 | 설명 | 예시 |
|------|------|------|
| 타임스탬프 | 이벤트 발생 시각 (KST) | 2026-01-24 10:30:15 |
| 액션 | 수행된 작업 | 로그인, 회원가입 |
| 구분 | 사용자 유형 | 기업회원, 컨설턴트, 매니저 |
| 대상 | 전화번호 또는 식별자 | 01063529091 |
| 세부정보 | 추가 정보 | 페마연, 승인상태: 대기 |
| 결과 | 성공/실패 | 성공, 실패, 승인대기, 오류 |

---

## 🔍 승인상태 허용 값

v6.2.6부터 다음 두 가지 값을 모두 허용:

✅ **"승인"** - 기존 표준 값  
✅ **"승인완료"** - 새로 추가된 허용 값

❌ 다른 값들은 여전히 거부:
- "대기"
- "승인 대기"
- "pending"
- 빈 칸

---

## 🎯 프론트엔드 업데이트

### 새 API URL 적용
1. `components/Auth.tsx` 파일 수정:
```typescript
const API_URL = 'https://script.google.com/macros/s/[새URL]/exec';
```

2. 빌드 및 배포:
```bash
cd /home/user/webapp
npm run build
# EC2 배포
```

---

## 🐛 문제 해결

### "승인 대기 중입니다" 오류가 계속 나타나는 경우

#### 원인 1: Apps Script 캐시
**해결**: 새 배포 생성 (위 4단계 참조)

#### 원인 2: 승인상태 값 문제
**해결**: 
1. Apps Script 에디터에서 `diagnoseSheet()` 실행
2. 실행 로그에서 승인상태 값 확인
3. 필요 시 구글 시트에서 "승인" 또는 "승인완료"로 변경

#### 원인 3: 전화번호 불일치
**해결**:
1. `diagnoseSheet()` 실행
2. 로그에서 전화번호가 실제로 존재하는지 확인
3. 필요 시 회원가입 먼저 진행

---

## 📝 체크리스트

배포 후 확인사항:

- [ ] Apps Script v6.2.6 코드 복사 완료
- [ ] `testSpreadsheetAccess()` 실행 및 권한 승인 완료
- [ ] 새 배포 생성 완료
- [ ] 새 배포 URL 복사 완료
- [ ] 터미널에서 API 테스트 (success: true 확인)
- [ ] 구글 시트 '로그' 탭에서 로그 기록 확인
- [ ] 프론트엔드에 새 URL 적용
- [ ] 프론트엔드 빌드 및 배포
- [ ] 브라우저에서 로그인 테스트

---

## 🔗 관련 파일

- `/home/user/webapp/APPS_SCRIPT_V6.2.6_WITH_LOGGING.js` - v6.2.6 전체 코드
- `QUICK_FIX.md` - 빠른 해결 가이드
- `DIAGNOSIS_REPORT.md` - 종합 진단 보고서
- `CHECK_SHEET_STRUCTURE.md` - 시트 구조 확인 가이드

---

## ⚡ 빠른 명령어

### API 테스트
```bash
# 로그인 테스트
curl -L 'https://script.google.com/macros/s/[새URL]/exec?action=loginCompany&phone=01063529091&password=12345'

# 버전 확인
curl -L 'https://script.google.com/macros/s/[새URL]/exec'
```

### 프론트엔드 배포
```bash
cd /home/user/webapp
npm run build
# (EC2 배포 스크립트 실행)
```

---

**다음 단계**: 새 배포 URL을 알려주시면 프론트엔드에 적용하겠습니다! 🚀
