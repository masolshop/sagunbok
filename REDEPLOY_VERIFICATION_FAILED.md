# 🚨 긴급: 여전히 구버전 코드 동작 중!

**테스트 날짜**: 2026-01-24 16:51  
**새 API URL**: https://script.google.com/macros/s/AKfycbyjO7ZGlzqTBw1lNa8sAYZtxfOZvlPs5Oj4LNCQnaWnFTX6Tw3ZkuzZyqqSjiEycTBy/exec  
**상태**: ❌ **구버전 코드 확인됨!**

---

## 🔍 테스트 결과

### 현재 API 응답 (구버전):
```json
{
  "name": "이종근",
  "phone": "01063529091",
  "type": "company",        // ❌ 구버전! (v6.2.12는 "userType")
  "status": "승인"          // ❌ 구버전! (v6.2.12는 "approvalStatus")
}
```

### v6.2.12 예상 응답:
```json
{
  "name": "이종근",
  "phone": "01063529091",
  "userType": "company",       // ✅ 신규
  "approvalStatus": "승인"     // ✅ 신규
}
```

---

## ⚠️ 문제 진단

### 가능한 원인:

1. **Code.gs 파일이 업데이트되지 않음**
   - Apps Script 에디터에서 Code.gs 내용이 여전히 구버전

2. **배포가 새 버전으로 되지 않음**
   - Deploy → Manage Deployments에서 "New version" 선택 안 함
   - 이전 버전이 활성 상태로 유지됨

3. **잘못된 Apps Script 프로젝트에 배포**
   - 다른 프로젝트 ID에 배포했을 가능성

4. **캐싱 문제**
   - Google 서버 측 캐싱 (드물지만 가능)

---

## 🔧 확실한 재배포 절차

### Step 1: 현재 Code.gs 내용 확인

1. **Apps Script 에디터 열기**:
   ```
   https://script.google.com/home/projects/1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r/edit
   ```

2. **Code.gs 파일 클릭**

3. **첫 몇 줄 확인**:
   ```javascript
   // v6.2.12가 맞다면:
   /**
    * 사근복 AI - Google Apps Script 백엔드
    * 버전 6.2.12 - 시트 이름 수정 (올바른 이름으로 변경)
    ...

   // 구버전이라면 다른 버전 번호거나 코멘트 다름
   ```

4. **`getAllMembers` 함수 찾기** (Ctrl+F로 검색):
   ```javascript
   // v6.2.12가 맞다면:
   userType: 'company' // 또는 'manager', 'consultant'
   approvalStatus: row[8]

   // 구버전이라면:
   type: 'company'
   status: row[8]
   ```

### Step 2: Code.gs 완전 교체

**현재 코드가 구버전이라면:**

1. **전체 선택** (Ctrl+A)
2. **삭제** (Delete)
3. **로컬 파일 열기**: `/home/user/webapp/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js`
4. **전체 복사** (Ctrl+A, Ctrl+C)
5. **Code.gs에 붙여넣기** (Ctrl+V)
6. **저장** (Ctrl+S)

### Step 3: 기존 배포 삭제 및 새 배포

**중요: 기존 배포를 삭제하고 완전히 새로 배포합니다!**

1. **Deploy** → **Manage Deployments** 클릭

2. **현재 모든 배포 확인**:
   - Active deployments 목록 확인
   - Web app URL 확인

3. **기존 배포 보관 (URL 변경 방지)**:
   - 기존 배포 옆 **✏️ Edit** 버튼 클릭
   - **New version** 선택 (중요!)
   - **Version description**: `v6.2.12 - FINAL - Email + Referrer + Sheet Names + G Column`
   - **Deploy** 클릭

4. **권한 재승인** (필요 시):
   - "Authorization required" 뜨면 클릭
   - Google 계정 선택
   - "Advanced" → "Go to [프로젝트명]" 클릭
   - **Allow** 클릭 (MailApp 권한 필요)

5. **배포 URL 확인**:
   - Web app URL이 동일한지 확인
   - 새 URL이면 알려주세요

### Step 4: 배포 직후 즉시 테스트

배포 완료 후 **1-2분 대기** (Google 서버 업데이트 시간)

그 후 즉시 테스트:
```bash
curl -sL "https://script.google.com/macros/s/AKfycbyjO7ZGlzqTBw1lNa8sAYZtxfOZvlPs5Oj4LNCQnaWnFTX6Tw3ZkuzZyqqSjiEycTBy/exec?action=getAllMembers&_t=$(date +%s)" > test.json

# 첫 번째 회원 데이터 확인
python3 -c "
import json
with open('test.json') as f:
    data = json.load(f)
    if data.get('success') and data.get('members'):
        m = data['members'][0]
        print('필드 확인:')
        print(f'  - userType 존재: {\"userType\" in m}')
        print(f'  - approvalStatus 존재: {\"approvalStatus\" in m}')
        print(f'  - type 존재: {\"type\" in m}')
        print(f'  - status 존재: {\"status\" in m}')
        if 'userType' in m:
            print('\\n✅ v6.2.12 배포 성공!')
        else:
            print('\\n❌ 여전히 구버전!')
"
```

---

## 📝 배포 체크리스트

배포 전:
- [ ] Apps Script 프로젝트 ID 확인: `1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r`
- [ ] Code.gs 내용이 v6.2.12인지 확인 (첫 줄 주석)
- [ ] `getAllMembers` 함수에서 `userType`, `approvalStatus` 사용 확인

배포 중:
- [ ] Deploy → Manage Deployments
- [ ] 기존 배포의 **Edit** 클릭
- [ ] **New version** 선택
- [ ] Deploy 클릭
- [ ] 권한 승인 (MailApp)

배포 후:
- [ ] 1-2분 대기
- [ ] API 테스트 (userType, approvalStatus 필드 확인)
- [ ] "v6.2.12 배포 성공!" 메시지 확인

---

## 🎯 v6.2.12 코드 특징 (확인용)

**Code.gs 첫 몇 줄**:
```javascript
/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.12 - 시트 이름 수정 (올바른 이름으로 변경)
 * 
 * 주요 변경사항 (v6.2.12):
 * - 시트 이름 수정: '사근복매니저', '사근복컨설턴트' (실제 시트 이름)
 * - 이전 버전에서 잘못된 이름 사용 ('사근복컨설턴트(매니저)' ❌)
 * - 모든 함수에서 올바른 시트 이름으로 통일
 */
```

**getAllMembers 함수 (Line ~223-247)**:
```javascript
// 회원 데이터 매핑 - v6.2.12
const member = {
  name: row[0],
  phone: row[1],
  email: row[2] || row[3],
  userType: 'manager',           // ✅ v6.2.12
  approvalStatus: row[8],        // ✅ v6.2.12
  position: row[3],
  businessUnit: row[4],
  branch: row[5],
  registeredAt: row[7]
};
```

**시트 이름 (Line ~202-203)**:
```javascript
const managerSheet = ss.getSheetByName('사근복매니저');      // ✅
const consultantSheet = ss.getSheetByName('사근복컨설턴트'); // ✅
```

---

## 💡 디버깅 팁

### Code.gs에서 직접 실행해보기:

1. Apps Script 에디터에서 함수 선택: `getAllMembers`
2. **Run** 버튼 클릭
3. Execution log 확인
4. 반환된 데이터에서 `userType`, `approvalStatus` 필드 확인

### 수동 배포 확인:

Apps Script 에디터 상단 URL이 정확한지 확인:
```
script.google.com/home/projects/1BXU0ZcDj81zpKfSBGDnbFpPWFUhZqp_X3zzqLXPpf9C2CxP-kvKY3n5r
```

---

## 🔗 관련 파일

- **로컬 v6.2.12 코드**: `/home/user/webapp/APPS_SCRIPT_V6.2.12_CORRECT_SHEET_NAMES.js`
- **Pull Request**: https://github.com/masolshop/sagunbok/pull/1
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

---

## ⏭️ 다음 단계

1. **지금 즉시**: 위 Step 1-4 절차 따라 재배포
2. **1-2분 대기**: Google 서버 업데이트 시간
3. **테스트 실행**: 위 테스트 명령어로 확인
4. **"성공" 알림**: v6.2.12 배포 성공하면 알려주세요!

**배포 완료되면 전체 자동 테스트를 실행하겠습니다!** 🚀

---

**현재 상태**: ❌ 구버전 (`type`, `status` 필드)  
**목표 상태**: ✅ v6.2.12 (`userType`, `approvalStatus` 필드)
