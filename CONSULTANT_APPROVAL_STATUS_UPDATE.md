# ✅ 사근복컨설턴트 승인상태 추가 완료!

**업데이트 버전**: V5.4.2  
**커밋**: e2db22f  
**작성일**: 2026-01-21 19:00

---

## 🎯 변경 요약

사근복컨설턴트 시트에 **I열: 승인상태** 컬럼이 추가되었습니다!

이제 기업회원과 컨설턴트 모두 동일하게 I열에 승인상태를 저장합니다.

---

## 📊 시트 구조

### **이전 (V5.4.1)**
```
[사근복컨설턴트] A~H:
A: 이름
B: 핸드폰번호
C: 이메일
D: 직함
E: 소속 사업단
F: 비밀번호
G: 소속 지사
H: 가입일시
```

### **현재 (V5.4.2)**
```
[사근복컨설턴트] A~I:
A: 이름
B: 핸드폰번호
C: 이메일
D: 직함
E: 소속 사업단
F: 비밀번호
G: 소속 지사
H: 가입일시
I: 승인상태 ✨ (승인전표/승인완료)
```

---

## 🔧 코드 변경

### **1. registerConsultant() 함수**

가입 시 I열에 **'승인전표'** 기본값이 자동으로 저장됩니다.

```javascript
sheet.appendRow([
  name,              // A: 이름
  formattedPhone,    // B: 핸드폰번호
  email,             // C: 이메일
  title,             // D: 직함
  department,        // E: 소속 사업단
  password || '12345', // F: 비밀번호
  branch,            // G: 소속 지사
  timestamp,         // H: 가입일시
  '승인전표'         // I: 승인상태 ✨ NEW!
]);
```

### **2. loginConsultant() 함수**

로그인 시 `approvalStatus`를 반환합니다.

```javascript
// 읽기 범위 확장
const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

// 반환 데이터
userData: {
  name: row[0],
  phone: formatPhone(row[1]).replace("'", ""),
  email: row[2],
  title: row[3],
  department: row[4],
  branch: row[6],
  registeredAt: row[7],
  approvalStatus: row[8] || '승인전표'  ✨ NEW!
}
```

---

## 📝 Google Sheets 설정 (필수!)

### **Step 1: 헤더 업데이트**

사근복컨설턴트 시트의 **I1 셀**에 다음 헤더를 추가하세요:

```
승인상태
```

### **Step 2: 테스트 데이터 업데이트**

기존 테스트 데이터(A2~H4)를 다음과 같이 I열까지 확장:

```
김철수	'010-1234-5678	kim@sagunbok.com	팀장	서울사업단	12345	서울지사	2026-01-21 09:00:00	승인전표
이영희	'010-5678-1234	lee@sagunbok.com	과장	부산사업단	12345	부산지사	2026-01-21 09:00:00	승인전표
박민수	'010-9876-5432	park@sagunbok.com	대리	대구사업단	12345	대구지사	2026-01-21 09:00:00	승인전표
```

**복사해서 A2에 붙여넣기!**

---

## 🚀 배포 절차 (10분)

### **Step 1: Apps Script 업데이트 (3분)**

1. Google Sheets 열기
2. **확장 프로그램** → **Apps Script**
3. 기존 코드를 모두 삭제
4. 새 코드 복사:
   - 파일: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`
5. **Ctrl+S** 저장
6. **배포** → **새 배포** → ⚙️ → **웹 앱**
7. 설명: `V5.4.2 컨설턴트 승인상태 추가`
8. **배포** → 권한 승인
9. **배포 URL 복사** 📋

### **Step 2: 프록시 서버 업데이트 (2분)**

```bash
cd /home/user/webapp
./quick_update_proxy.sh
# 새 배포 URL 입력
```

자동으로 다음 작업이 실행됩니다:
- ✅ proxy-server.js 업데이트
- ✅ PM2 재시작
- ✅ 로그 확인

### **Step 3: 브라우저 테스트 (5분)**

#### **A. 컨설턴트 가입 테스트**

1. http://3.34.186.174 접속
2. **컨설턴트 가입** 탭
3. 입력:
   - 이름: 테스트컨설턴트
   - 핸드폰: 01099998888
   - 이메일: test@consultant.com
   - 직함: 대리
   - 소속 사업단: 테스트사업단
   - 비밀번호: test1234
   - 소속 지사: 테스트지사
4. **가입** 버튼 클릭
5. **Google Sheets 확인**:
   - I열: "승인전표" ✅

#### **B. 컨설턴트 로그인 테스트**

1. http://3.34.186.174 접속
2. **컨설턴트 로그인** 탭
3. 입력:
   - 핸드폰: 01099998888
   - 비밀번호: test1234
4. **로그인** 버튼 클릭
5. **F12 → Network 탭** 확인:

```json
{
  "success": true,
  "message": "로그인 성공",
  "userData": {
    "name": "테스트컨설턴트",
    "phone": "010-9999-8888",
    "email": "test@consultant.com",
    "title": "대리",
    "department": "테스트사업단",
    "branch": "테스트지사",
    "registeredAt": "2026-01-21 19:00:00",
    "approvalStatus": "승인전표"  ✨ 이게 보여야 함!
  }
}
```

---

## 📁 업데이트된 파일

```
/home/user/webapp/
├── docs/apps-script-v5/
│   ├── APPS_SCRIPT_V5.4_FINAL.js (V5.4.2) ✅
│   ├── CLEAN_RESTART_GUIDE.md (업데이트) ✅
│   └── V5.4.2_CONSULTANT_APPROVAL_STATUS.md (신규) ✅
└── CONSULTANT_APPROVAL_STATUS_UPDATE.md (이 문서)
```

---

## ✅ 체크리스트

시작하기 전에 다음을 확인하세요:

- [ ] Google Sheets에 I1 셀에 "승인상태" 헤더 추가
- [ ] 테스트 데이터 I열에 "승인전표" 추가
- [ ] Apps Script 코드 업데이트 (V5.4.2)
- [ ] Apps Script 재배포 완료
- [ ] 프록시 서버 업데이트 완료
- [ ] 컨설턴트 가입 테스트 성공
- [ ] 컨설턴트 로그인 테스트 성공
- [ ] 로그인 응답에서 `approvalStatus` 확인

---

## 🎉 완료!

이제 **기업회원**과 **사근복컨설턴트** 모두 **I열에 승인상태**를 저장하고,  
로그인 시 `approvalStatus`를 반환합니다!

### **시트 구조 통일:**

| 시트 | I열 |
|------|-----|
| 기업회원 | 승인상태 ✅ |
| 사근복컨설턴트 | 승인상태 ✅ |

---

## 📚 참고 문서

- 상세 변경 내역: `/home/user/webapp/docs/apps-script-v5/V5.4.2_CONSULTANT_APPROVAL_STATUS.md`
- 재설정 가이드: `/home/user/webapp/docs/apps-script-v5/CLEAN_RESTART_GUIDE.md`
- Apps Script 코드: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`

---

**커밋**: e2db22f  
**버전**: V5.4.2 FINAL  
**소요 시간**: 약 10분 (배포 포함)
