# ⚠️ 긴급: Apps Script v6.2.12 재배포 필요!

**날짜**: 2026-01-24  
**현재 상태**: ❌ 구버전 코드 동작 중  
**필요 조치**: v6.2.12 코드 재배포

---

## 🔍 문제 발견

### API 테스트 결과:
```bash
API URL: https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec
```

### 현재 배포된 코드 (구버전):
```json
{
  "name": "이종근",
  "phone": "01063529091",
  "type": "company",           // ❌ v6.2.12는 "userType" 사용
  "status": "승인",            // ❌ v6.2.12는 "approvalStatus" 사용
  "email": "tysagunbok@gmail.com",
  "companyName": "페마연",
  "registeredAt": "2026-01-22"
}
```

### v6.2.12 예상 데이터:
```json
{
  "name": "이종근",
  "phone": "01063529091",
  "userType": "company",       // ✅ 올바른 필드명
  "approvalStatus": "승인",    // ✅ 올바른 필드명
  "email": "tysagunbok@gmail.com",
  "companyName": "페마연",
  "registeredAt": "2026-01-22"
}
```

---

## 📋 확인 사항

### ❌ 구버전 코드의 문제점:
1. `type` 대신 `userType` 사용해야 함
2. `status` 대신 `approvalStatus` 사용해야 함  
3. 시트 이름이 올바른지 불확실
4. 이메일 기능 없음
5. 추천인 검증 없음
6. G열 문서화 없음

### ✅ v6.2.12의 개선사항:
1. ✅ 올바른 필드명 (`userType`, `approvalStatus`)
2. ✅ 시트 이름 수정 (`사근복매니저`, `사근복컨설턴트`)
3. ✅ 이메일 발송 시스템
4. ✅ 추천인 검증
5. ✅ G열 문서화 (매니저/컨설턴트는 고정 비밀번호 12345)
6. ✅ 이메일 타입 라벨 (전체 시트 이름 사용)

---

## 🚀 재배포 절차

### Step 1: Apps Script 에디터 열기
```
https://script.google.com/home/projects/1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r/edit
```

### Step 2: 코드 교체
1. **Code.gs** 파일 열기
2. **전체 내용 삭제**
3. `/home/user/webapp/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js` 파일 열기
4. **전체 내용 복사**
5. **Code.gs에 붙여넣기**
6. **저장** (Ctrl+S 또는 💾 버튼)

### Step 3: 새 버전 배포
1. 상단 메뉴: **Deploy** → **Manage Deployments**
2. 현재 배포 옆 **✏️ Edit** 버튼 클릭
3. **New version** 선택
4. **Version description** 입력:
   ```
   v6.2.12 - Email system, referrer validation, correct sheet names, G column docs
   ```
5. **Deploy** 버튼 클릭
6. 권한 재승인 필요 시:
   - "Review Permissions" 클릭
   - Google 계정 선택
   - "Advanced" → "Go to [프로젝트명]" 클릭
   - "Allow" 클릭 (MailApp 사용 권한)

### Step 4: 배포 확인
배포 완료 후 Web App URL이 동일한지 확인:
```
https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec
```

---

## ✅ 재배포 후 테스트

### 1. API 응답 확인
```bash
curl -sL "https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=getAllMembers&_t=$(date +%s)" | python3 -m json.tool
```

**예상 결과**:
- ✅ `userType` 필드 존재 (`company`, `manager`, `consultant`)
- ✅ `approvalStatus` 필드 존재 (`승인`, `승인 대기`, `반려`)

### 2. 매니저/컨설턴트 로그인 테스트
```bash
# 매니저 로그인
curl -sL "https://script.google.com/macros/s/.../exec?action=loginConsultant&phone=01063850700&password=12345"

# 예상: 로그인 성공
```

### 3. 시트 이름 확인
- Google Sheets에서 시트 이름 확인:
  - ✅ "사근복매니저" 존재
  - ✅ "사근복컨설턴트" 존재
  - ❌ "사근복컨설턴트(매니저)" 없어야 함

### 4. 회원 가입 테스트
프론트엔드 (http://3.34.186.174/)에서:
- 기업회원 가입 → 이메일 3개 발송 확인
- 매니저 가입 → 이메일 2개 발송 확인
- 이메일 타입 라벨 = "사근복매니저", "사근복컨설턴트" (전체 이름)

---

## 📊 현재 회원 데이터 (구버전에서)

```
총 8명:
1. 이종근 (01063529091) - company
2. 김민수 (01063850700) - (중복)
3. 이종근 (01063529091) - (중복)
4. 문지용 (01086199091) - (중복)
5. 김민수 (01063850700) - (중복)
6. 이종근 (01063529091) - (중복)
7. 문지용 (01086199091) - (중복)
8. 김민수 (01063850700) - (중복)
```

**슈퍼관리자**: 이종근 (01063529091)

재배포 후 이 데이터들이 올바른 필드명으로 표시될 것입니다.

---

## 🔧 v6.2.12 코드 위치

**로컬 파일**:
```
/home/user/webapp/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js
```

**GitHub**:
```
https://github.com/masolshop/sagunbok/blob/genspark_ai_developer/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js
```

**Pull Request**:
```
https://github.com/masolshop/sagunbok/pull/1
```

---

## ⚠️ 중요 알림

**현재 API는 작동하지만 구버전입니다!**

v6.2.12의 모든 기능을 테스트하려면 반드시 **재배포**가 필요합니다:
- ✅ 이메일 발송
- ✅ 추천인 검증
- ✅ 올바른 시트 이름
- ✅ G열 문서화
- ✅ 이메일 타입 라벨

**재배포 후 알려주시면 전체 테스트를 진행하겠습니다!** 🚀

---

## 📞 다음 단계

1. **지금 즉시**: Apps Script에 v6.2.12 재배포
2. **재배포 완료 후**: "재배포 완료" 알림
3. **자동 테스트 실행**: 모든 기능 검증
4. **테스트 통과**: Pull Request 승인 및 병합

재배포 완료되면 알려주세요!
