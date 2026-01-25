# 🚀 올바른 Apps Script 프로젝트 발견!

## ✅ 정확한 정보

### Apps Script 프로젝트
- **URL**: https://script.google.com/u/0/home/projects/1FqLBX8t_0XG-wGzbc5bt9UCXYUn68iomWNceY3P5ICYArM6rPj97-HIw/edit
- **Project ID**: `1FqLBX8t_0XG-wGzbc5bt9UCXYUn68iomWNceY3P5ICYArM6rPj97-HIw`

### Google Sheets
- **URL**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **Spreadsheet ID**: `1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc`

### 현재 배포 URL
```
https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec
```

---

## 📋 즉시 실행: v6.2.12 배포

### 1단계: Code.gs 업데이트

1. **Apps Script 에디터 열기**:
   ```
   https://script.google.com/u/0/home/projects/1FqLBX8t_0XG-wGzbc5bt9UCXYUn68iomWNceY3P5ICYArM6rPj97-HIw/edit
   ```

2. **현재 Code.gs 내용 전체 삭제**:
   - `Ctrl + A` → `Delete`

3. **v6.2.12 코드 복사**:
   - 로컬 파일 열기: `/home/user/webapp/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js`
   - 전체 선택 (`Ctrl + A`) 및 복사 (`Ctrl + C`)

4. **Code.gs에 붙여넣기**:
   - `Ctrl + V`

5. **저장**:
   - `Ctrl + S` 또는 **File → Save**

6. **첫 줄 확인**:
   ```javascript
   * 버전 6.2.12 - 시트 이름 수정 (올바른 이름으로 변경)
   ```

---

### 2단계: 새 버전 배포

1. **Deploy → Manage Deployments**

2. **기존 배포 수정**:
   - 활성 배포 옆 **연필(✏️) 아이콘** 클릭

3. **⚠️ 가장 중요! New version 선택**:
   ```
   Version: [New version ▼]  ← 이것을 선택!
   ```

4. **Description**:
   ```
   v6.2.12 FINAL - userType, approvalStatus, email, referrer validation
   ```

5. **Deploy 클릭**

6. **MailApp 권한 재승인** (필요 시)

7. **배포 완료 확인**:
   - Web App URL이 동일한지 확인:
     ```
     https://script.google.com/macros/s/AKfycbzeunTWd_3je.../exec
     ```

8. **1-2분 대기**

---

### 3단계: 배포 확인

브라우저 새 탭에서 API 호출:
```
https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec?action=getAllMembers&_t=1737715500
```

**✅ 성공 응답** (v6.2.12):
```json
{
  "success": true,
  "members": [
    {
      "userType": "company",
      "approvalStatus": "승인",
      "companyName": "페마연",
      "name": "이종근",
      ...
    }
  ]
}
```

**❌ 실패 응답** (아직 구버전):
```json
{
  "type": "company",
  "status": "승인"
}
```

---

### 4단계: 프론트엔드 테스트

1. **브라우저 캐시 삭제**:
   - `Ctrl + Shift + Delete`
   - "전체 기간" → "캐시된 이미지 및 파일" 체크 → 삭제

2. **프론트엔드 접속**:
   ```
   http://3.34.186.174/
   ```

3. **로그인 테스트**:
   - 슈퍼관리자: `01063529091`
   - 개발자 도구 (F12) → Network 탭
   - API 호출 200 응답 확인

---

## 📊 체크리스트

### Apps Script 업데이트
- [ ] 올바른 프로젝트 열기 (1FqLBX8t_0XG...)
- [ ] Code.gs 전체 교체
- [ ] v6.2.12 코드 붙여넣기
- [ ] 저장 (Ctrl+S)
- [ ] 첫 줄에 "버전 6.2.12" 확인

### 새 버전 배포
- [ ] Deploy → Manage Deployments
- [ ] Edit (연필 아이콘) 클릭
- [ ] **"New version" 선택** (중요!)
- [ ] Description 입력
- [ ] Deploy 클릭
- [ ] MailApp 권한 승인
- [ ] 1-2분 대기

### 배포 확인
- [ ] API 직접 호출
- [ ] `userType`, `approvalStatus` 필드 확인
- [ ] 구버전 필드 (`type`, `status`) 없음 확인
- [ ] 브라우저 캐시 삭제
- [ ] 프론트엔드 로그인 테스트
- [ ] 404 에러 해결 확인

---

## 🎯 예상 결과

배포 완료 후:
- ✅ 로그인 404 에러 해결
- ✅ v6.2.12 기능 모두 작동:
  - 올바른 시트 이름 사용
  - 이메일 발송 (TY사근복헬스케어사업단)
  - 추천인 검증
  - 슈퍼관리자 로그인 루프 해결
  - 매니저/컨설턴트 비밀번호 12345

---

**이제 올바른 Apps Script 프로젝트를 찾았습니다!** 위의 단계대로 진행하시면 모든 기능이 정상 작동합니다! 🎉
