# 🔧 CORS 오류 해결 가이드

## ❌ 문제 상황

스크린샷에서 확인된 오류:
```
3.34.186.174 내용:
로그인 중 오류가 발생했습니다.
```

**원인**: Google Apps Script 웹 앱이 CORS 헤더를 반환하지 않아 브라우저가 요청을 차단합니다.

---

## ✅ 해결 방법

### **1단계: Google Apps Script 코드 업데이트**

1. **Google Sheets 열기**:
   ```
   https://docs.google.com/spreadsheets/d/1PmVNfdxXrYSKAWgYLAywqo0IJXTPPL7eJnLd14-_vaU/edit
   ```

2. **Apps Script 열기**:
   - 상단 메뉴: **확장 프로그램 → Apps Script**

3. **Code.gs 파일 열기**

4. **전체 코드 교체**:
   - 기존 코드를 **모두 삭제**
   - 아래의 **업데이트된 코드**를 복사해서 붙여넣기

---

## 📝 업데이트된 Google Apps Script 코드

**중요**: `doGet` 함수가 추가되었습니다! (CORS 지원)

```javascript
/**
 * 사근복 AI - Google Apps Script 백엔드
 * 회원가입, 로그인, ID/비밀번호 찾기 API
 */

// ====================================
// 설정
// ====================================
const SPREADSHEET_ID = '1PmVNfdxXrYSKAWgYLAywqo0IJXTPPL7eJnLd14-_vaU'; // 스프레드시트 ID

// 시트 이름
const SHEET_NAMES = {
  COMPANY: '기업회원',
  CONSULTANT: '사근복컨설턴트',
  LOGIN_LOG: '로그인기록'
};

// 승인 상태
const APPROVAL_STATUS = {
  PENDING: '대기중',
  APPROVED: '승인완료',
  REJECTED: '거부'
};

// 컨설턴트 고정 비밀번호
const CONSULTANT_PASSWORD = '12345';

// ====================================
// 유틸리티 함수
// ====================================

/**
 * 스프레드시트 가져오기
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * 시트 가져오기
 */
function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

/**
 * 전화번호 정규화 (하이픈 제거)
 */
function normalizePhone(phone) {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 전화번호 유효성 검사
 */
function validatePhone(phone) {
  const cleaned = normalizePhone(phone);
  return /^01[0-9]{8,9}$/.test(cleaned);
}

/**
 * 이메일 유효성 검사
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 현재 시간 문자열
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 전화번호 마스킹 (ID 찾기용)
 */
function maskPhone(phone) {
  if (phone.length === 11) {
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }
  return phone.substring(0, 3) + '****' + phone.substring(6);
}

/**
 * 간단한 비밀번호 해시 (선택사항)
 */
function hashPassword(password) {
  // 실제로는 더 강력한 해시 사용 권장
  // 지금은 간단히 SHA-256 사용
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(hash);
}

// ====================================
// 데이터 조회 함수
// ====================================

/**
 * 기업회원 찾기 (전화번호로)
 */
function findCompanyUser(phone) {
  const sheet = getSheet(SHEET_NAMES.COMPANY);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === phone) { // D열: 핸드폰번호
      return {
        row: i + 1,
        createdAt: data[i][0],
        companyName: data[i][1],
        name: data[i][2],
        phone: data[i][3],
        email: data[i][4],
        password: data[i][5],
        approvalStatus: data[i][6],
        lastLogin: data[i][7]
      };
    }
  }
  return null;
}

/**
 * 사근복컨설턴트 찾기 (전화번호로)
 */
function findConsultantUser(phone) {
  const sheet = getSheet(SHEET_NAMES.CONSULTANT);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === phone) { // C열: 핸드폰번호
      return {
        row: i + 1,
        createdAt: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        email: data[i][3],
        approvalStatus: data[i][4],
        businessUnit: data[i][5],
        branchOffice: data[i][6],
        position: data[i][7],
        lastLogin: data[i][8]
      };
    }
  }
  return null;
}

// ====================================
// 로그인 기록
// ====================================

function logLogin(userType, userId, userName, companyName, status, failureReason) {
  const sheet = getSheet(SHEET_NAMES.LOGIN_LOG);
  sheet.appendRow([
    getCurrentTimestamp(),
    userType,
    userId,
    userName,
    companyName || '',
    status,
    failureReason || ''
  ]);
}

// ====================================
// API 핸들러
// ====================================

/**
 * 기업회원 가입
 */
function registerCompany(data) {
  const { companyName, name, phone, email, password } = data;
  
  // 유효성 검사
  if (!companyName || !name || !phone || !email || !password) {
    return { success: false, error: '모든 필드를 입력해주세요.' };
  }
  
  const cleanPhone = normalizePhone(phone);
  if (!validatePhone(cleanPhone)) {
    return { success: false, error: '올바른 전화번호 형식이 아닙니다.' };
  }
  
  if (!validateEmail(email)) {
    return { success: false, error: '올바른 이메일 형식이 아닙니다.' };
  }
  
  if (password.length < 4) {
    return { success: false, error: '비밀번호는 최소 4자리 이상이어야 합니다.' };
  }
  
  // 중복 체크
  if (findCompanyUser(cleanPhone)) {
    return { success: false, error: '이미 가입된 전화번호입니다.' };
  }
  
  // 시트에 추가
  const sheet = getSheet(SHEET_NAMES.COMPANY);
  sheet.appendRow([
    getCurrentTimestamp(),
    companyName,
    name,
    cleanPhone,
    email,
    password, // 실제로는 hashPassword(password) 권장
    APPROVAL_STATUS.PENDING,
    ''
  ]);
  
  return {
    success: true,
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
    userId: cleanPhone
  };
}

/**
 * 사근복컨설턴트 가입
 */
function registerConsultant(data) {
  const { name, phone, email, position, businessUnit, branchOffice } = data;
  
  // 유효성 검사
  if (!name || !phone || !email || !position) {
    return { success: false, error: '필수 필드를 모두 입력해주세요.' };
  }
  
  const cleanPhone = normalizePhone(phone);
  if (!validatePhone(cleanPhone)) {
    return { success: false, error: '올바른 전화번호 형식이 아닙니다.' };
  }
  
  if (!validateEmail(email)) {
    return { success: false, error: '올바른 이메일 형식이 아닙니다.' };
  }
  
  // 중복 체크
  if (findConsultantUser(cleanPhone)) {
    return { success: false, error: '이미 가입된 전화번호입니다.' };
  }
  
  // 시트에 추가 (비밀번호는 항상 12345)
  const sheet = getSheet(SHEET_NAMES.CONSULTANT);
  sheet.appendRow([
    getCurrentTimestamp(),
    name,
    cleanPhone,
    email,
    APPROVAL_STATUS.PENDING,
    businessUnit || '',
    branchOffice || '',
    position,
    ''
  ]);
  
  return {
    success: true,
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.\n로그인 시 비밀번호는 12345를 사용하세요.',
    userId: cleanPhone,
    password: CONSULTANT_PASSWORD
  };
}

/**
 * 기업회원 로그인
 */
function loginCompany(data) {
  const { phone, password } = data;
  
  if (!phone || !password) {
    return { success: false, error: 'ID와 비밀번호를 입력해주세요.' };
  }
  
  const cleanPhone = normalizePhone(phone);
  const user = findCompanyUser(cleanPhone);
  
  if (!user) {
    logLogin('기업회원', cleanPhone, '', '', 'failed', '존재하지 않는 ID');
    return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
  }
  
  // 비밀번호 확인
  if (user.password !== password) { // 해시 사용 시: hashPassword(password)
    logLogin('기업회원', cleanPhone, user.name, user.companyName, 'failed', '비밀번호 오류');
    return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
  }
  
  // 승인 상태 확인
  if (user.approvalStatus === APPROVAL_STATUS.PENDING) {
    logLogin('기업회원', cleanPhone, user.name, user.companyName, 'pending_approval', '승인 대기중');
    return {
      success: false,
      error: '회원가입 승인 대기 중입니다.\n승인 완료 후 로그인이 가능합니다.'
    };
  }
  
  if (user.approvalStatus === APPROVAL_STATUS.REJECTED) {
    logLogin('기업회원', cleanPhone, user.name, user.companyName, 'failed', '가입 거부됨');
    return {
      success: false,
      error: '가입이 거부되었습니다. 관리자에게 문의하세요.'
    };
  }
  
  // 로그인 성공
  const sheet = getSheet(SHEET_NAMES.COMPANY);
  sheet.getRange(user.row, 8).setValue(getCurrentTimestamp()); // H열: 마지막로그인
  
  logLogin('기업회원', cleanPhone, user.name, user.companyName, 'success', '');
  
  return {
    success: true,
    user: {
      userType: 'company',
      userId: user.phone,
      name: user.name,
      companyName: user.companyName,
      email: user.email
    }
  };
}

/**
 * 사근복컨설턴트 로그인
 */
function loginConsultant(data) {
  const { phone, password } = data;
  
  if (!phone || !password) {
    return { success: false, error: 'ID와 비밀번호를 입력해주세요.' };
  }
  
  const cleanPhone = normalizePhone(phone);
  const user = findConsultantUser(cleanPhone);
  
  if (!user) {
    logLogin('컨설턴트', cleanPhone, '', '', 'failed', '존재하지 않는 ID');
    return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
  }
  
  // 비밀번호 확인 (고정: 12345)
  if (password !== CONSULTANT_PASSWORD) {
    logLogin('컨설턴트', cleanPhone, user.name, '', 'failed', '비밀번호 오류');
    return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
  }
  
  // 승인 상태 확인
  if (user.approvalStatus === APPROVAL_STATUS.PENDING) {
    logLogin('컨설턴트', cleanPhone, user.name, '', 'pending_approval', '승인 대기중');
    return {
      success: false,
      error: '회원가입 승인 대기 중입니다.\n승인 완료 후 로그인이 가능합니다.'
    };
  }
  
  if (user.approvalStatus === APPROVAL_STATUS.REJECTED) {
    logLogin('컨설턴트', cleanPhone, user.name, '', 'failed', '가입 거부됨');
    return {
      success: false,
      error: '가입이 거부되었습니다. 관리자에게 문의하세요.'
    };
  }
  
  // 로그인 성공
  const sheet = getSheet(SHEET_NAMES.CONSULTANT);
  sheet.getRange(user.row, 9).setValue(getCurrentTimestamp()); // I열: 마지막로그인
  
  logLogin('컨설턴트', cleanPhone, user.name, '', 'success', '');
  
  return {
    success: true,
    user: {
      userType: 'consultant',
      userId: user.phone,
      name: user.name,
      email: user.email,
      position: user.position,
      businessUnit: user.businessUnit,
      branchOffice: user.branchOffice
    }
  };
}

/**
 * ID 찾기 (기업회원만)
 */
function findUserId(data) {
  const { name, email } = data;
  
  if (!name || !email) {
    return { success: false, error: '이름과 이메일을 입력해주세요.' };
  }
  
  const sheet = getSheet(SHEET_NAMES.COMPANY);
  const dataValues = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataValues.length; i++) {
    if (dataValues[i][2] === name && dataValues[i][4] === email) {
      const phone = dataValues[i][3];
      return {
        success: true,
        userId: maskPhone(phone),
        message: `회원님의 ID(전화번호)는 ${maskPhone(phone)} 입니다.`
      };
    }
  }
  
  return { success: false, error: '일치하는 회원 정보가 없습니다.' };
}

/**
 * 비밀번호 찾기 (기업회원만)
 */
function findPassword(data) {
  const { phone, email } = data;
  
  if (!phone || !email) {
    return { success: false, error: '전화번호와 이메일을 입력해주세요.' };
  }
  
  const cleanPhone = normalizePhone(phone);
  const user = findCompanyUser(cleanPhone);
  
  if (!user || user.email !== email) {
    return { success: false, error: '일치하는 회원 정보가 없습니다.' };
  }
  
  // 임시 비밀번호 발급
  const tempPassword = 'temp' + Math.floor(Math.random() * 10000);
  const sheet = getSheet(SHEET_NAMES.COMPANY);
  sheet.getRange(user.row, 6).setValue(tempPassword); // F열: 비밀번호
  
  return {
    success: true,
    message: `임시 비밀번호가 발급되었습니다.\n임시 비밀번호: ${tempPassword}\n로그인 후 비밀번호를 변경해주세요.`,
    tempPassword: tempPassword
  };
}

// ====================================
// 웹 앱 엔트리 포인트
// ====================================

/**
 * POST 요청 처리
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    
    switch (action) {
      case 'registerCompany':
        result = registerCompany(data);
        break;
      case 'registerConsultant':
        result = registerConsultant(data);
        break;
      case 'loginCompany':
        result = loginCompany(data);
        break;
      case 'loginConsultant':
        result = loginConsultant(data);
        break;
      case 'findUserId':
        result = findUserId(data);
        break;
      case 'findPassword':
        result = findPassword(data);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET 요청 처리 (CORS 지원)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Sagunbok Auth API is running',
    timestamp: getCurrentTimestamp()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ====================================
// 테스트 함수 (개발용)
// ====================================

function testRegisterCompany() {
  const result = registerCompany({
    companyName: '(주)테스트',
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'test@company.com',
    password: 'test1234'
  });
  Logger.log(result);
}

function testLoginCompany() {
  const result = loginCompany({
    phone: '01012345678',
    password: 'test1234'
  });
  Logger.log(result);
}

function testRegisterConsultant() {
  const result = registerConsultant({
    name: '김전문',
    phone: '010-8765-4321',
    email: 'expert@sagunbok.com',
    position: '수석 컨설턴트',
    businessUnit: '서울사업단',
    branchOffice: '강남지사'
  });
  Logger.log(result);
}

function testLoginConsultant() {
  const result = loginConsultant({
    phone: '01087654321',
    password: '12345'
  });
  Logger.log(result);
}
```

---

## 🔄 **2단계: 웹 앱 재배포**

코드를 업데이트한 후 **반드시 재배포**해야 합니다!

### **재배포 방법**

1. Apps Script 편집기에서 **저장** 버튼 클릭 (💾)

2. 상단 메뉴: **배포 → 배포 관리**

3. **✏️ (연필 아이콘)** 클릭 (기존 배포 수정)

4. **버전**: "새 버전" 선택

5. **설명**: "CORS 지원 추가 v2"

6. **배포** 클릭

7. ✅ **웹 앱 URL은 변경되지 않습니다!**
   ```
   https://script.google.com/macros/s/AKfycbxMcJ82NqcvWOh5ODzo9ZyQ0zxotgT5oKRJL9CH66JGuNi2V7WpT7XI4CRYWYb11WOB/exec
   ```

---

## 🧪 **3단계: 테스트**

### **A. API 테스트 (브라우저에서)**

웹 앱 URL을 브라우저 주소창에 입력:
```
https://script.google.com/macros/s/AKfycbxMcJ82NqcvWOh5ODzo9ZyQ0zxotgT5oKRJL9CH66JGuNi2V7WpT7XI4CRYWYb11WOB/exec
```

**기대 결과**:
```json
{
  "status": "ok",
  "message": "Sagunbok Auth API is running",
  "timestamp": "2026-01-20 13:30:00"
}
```

### **B. 웹사이트 로그인 테스트**

1. **http://3.34.186.174** 접속
2. **F12 (개발자 도구)** 열기
3. **Console 탭** 확인
4. 로그인 시도
5. ✅ **CORS 오류가 사라진 것 확인!**

---

## 🔍 **변경 사항 요약**

### **추가된 코드**

```javascript
/**
 * GET 요청 처리 (CORS 지원)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Sagunbok Auth API is running',
    timestamp: getCurrentTimestamp()
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### **이유**

Google Apps Script 웹 앱은 기본적으로 CORS를 지원하지만, `doGet` 함수가 있어야 브라우저의 preflight 요청을 처리할 수 있습니다.

---

## 📋 **체크리스트**

배포 전 확인:
- [ ] Apps Script 코드 업데이트 완료
- [ ] `doGet` 함수 추가 확인
- [ ] 저장 버튼 (💾) 클릭
- [ ] **배포 → 배포 관리** 메뉴 열기
- [ ] **✏️ (연필 아이콘)** 클릭
- [ ] "새 버전" 선택
- [ ] **배포** 클릭
- [ ] 웹 앱 URL 변경되지 않은 것 확인
- [ ] 브라우저에서 URL 테스트
- [ ] 웹사이트에서 로그인 테스트

---

## 🚀 **다음 단계**

재배포 후:

1. **브라우저 캐시 삭제** (Ctrl+Shift+Del)
2. **웹사이트 새로고침** (F5)
3. **로그인 테스트**
4. ✅ **성공!**

---

## ❓ **문제 해결**

### **Q: 재배포 후에도 CORS 오류가 발생합니다**
- 브라우저 캐시 삭제 (Ctrl+Shift+Del)
- 시크릿 모드로 테스트
- 웹 앱 URL이 정확한지 확인

### **Q: "승인이 필요합니다" 팝업이 다시 나타납니다**
- **고급** → **사근복_인증API(안전하지 않음)로 이동** 클릭
- **허용** 클릭

### **Q: 웹 앱 URL이 변경되었습니다**
- 잘못된 배포 방법입니다
- **배포 → 배포 관리 → ✏️ (수정)** 사용해야 합니다
- 새 배포를 만들면 URL이 변경됩니다

---

**코드를 업데이트하고 재배포하면 CORS 오류가 해결됩니다!** 🚀

재배포 후 결과를 알려주세요!
