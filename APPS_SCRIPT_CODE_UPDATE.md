# 🔧 Apps Script 전체 코드 업데이트 가이드

## ⚠️ 문제 상황

Apps Script에 **doGet 함수만** 있고 나머지 코드(doPost, loginCompany 등)가 없는 상태입니다.

---

## ✅ **해결 방법: 전체 코드 복사**

### **1단계: Apps Script 편집기 열기**

```
Google Sheets → 확장 프로그램 → Apps Script
```

---

### **2단계: 기존 코드 전체 삭제**

1. **Ctrl + A** (또는 **Cmd + A**) - 전체 선택
2. **Delete** 키 - 삭제

---

### **3단계: 새 코드 붙여넣기**

다음 위치에서 전체 코드를 복사:

```
/home/user/webapp/google-apps-script-backend.js
```

**또는** 아래 GitHub 링크에서 복사:

```
https://raw.githubusercontent.com/masolshop/sagunbok/main/google-apps-script-backend.js
```

---

### **4단계: 저장**

**💾 저장** 버튼 클릭 (또는 Ctrl + S)

---

### **5단계: 재배포**

1. **배포 → 배포 관리**
2. **✏️ (연필 아이콘)** 클릭
3. **버전**: "새 버전" 선택
4. **설명**: "전체 코드 업데이트 v4"
5. **배포** 클릭

---

### **6단계: 테스트**

1. **함수 선택**: `testLoginCompany`
2. **▶️ 실행** 버튼 클릭
3. **실행 로그** 확인

---

## 🎯 **예상 결과**

### **성공 시**:
```javascript
{
  success: true,
  user: {
    userType: "company",
    userId: "01012345678",
    name: "홍길동",
    companyName: "(주)테스트",
    email: "test@company.com"
  }
}
```

---

## 📋 **체크리스트**

- [ ] Apps Script 편집기 열기
- [ ] 기존 코드 전체 삭제 (Ctrl + A → Delete)
- [ ] 새 코드 붙여넣기 (전체 549줄)
- [ ] SPREADSHEET_ID 확인: `1PmVNfdxXrYSKAWgYLAywqo0IJXTPPL7eJnLd14-_vaU`
- [ ] 저장 (💾)
- [ ] 재배포 (배포 관리 → 수정 → 새 버전)
- [ ] testLoginCompany 함수 실행
- [ ] 실행 로그 확인

---

**전체 코드를 붙여넣은 후 testLoginCompany 함수를 실행하여 결과를 확인해주세요!** 🚀
