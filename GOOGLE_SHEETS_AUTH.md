# 🔐 Google Sheets 회원 인증 연동 가이드

## 📋 개요

사근복 AI 스튜디오에 Google Sheets를 활용한 회원가입 및 로그인 시스템을 구축합니다.

## 🎯 목표

1. **회원 구분**: 사근복 전문가 / 기업 담당자
2. **인증 방식**: 이메일 기반 간편 인증
3. **데이터 저장**: Google Sheets (무료, 간편)
4. **보안**: API 키는 서버사이드에서 관리

---

## 🛠️ 구현 방법

### 옵션 1: Google Sheets API (추천)

#### 장점:
- ✅ 완전 무료
- ✅ 실시간 데이터 관리 (스프레드시트에서 직접 확인)
- ✅ 간단한 백엔드 구조

#### 단점:
- ❌ API 할당량 제한 (분당 100 요청)
- ❌ 복잡한 쿼리 어려움

#### 필요 구성요소:
1. **Google Cloud Project** 생성
2. **Google Sheets API** 활성화
3. **Service Account** 생성 및 키 발급
4. **Sheets 공유** (Service Account 이메일에게)
5. **간단한 백엔드** (Node.js/Express 또는 Serverless Functions)

---

### 옵션 2: Google Apps Script (더 간단)

#### 장점:
- ✅ 완전 무료
- ✅ 코딩 최소화
- ✅ 별도 서버 불필요
- ✅ Google 생태계 통합

#### 단점:
- ❌ 성능 제한
- ❌ 커스터마이징 제한적

---

## 📊 Google Sheets 구조

### 시트 1: Users (회원 정보)

| Column | 설명 | 예시 |
|--------|------|------|
| A: id | 고유 ID | uuid-1234 |
| B: email | 이메일 | user@example.com |
| C: name | 이름 | 홍길동 |
| D: role | 역할 | expert / company |
| E: company | 회사명 | (주)사근복컨설팅 |
| F: phone | 연락처 | 010-1234-5678 |
| G: created_at | 가입일시 | 2026-01-20 10:30:00 |
| H: api_key_set | API 키 설정 여부 | true/false |
| I: last_login | 마지막 로그인 | 2026-01-20 15:45:00 |

### 시트 2: Sessions (세션 관리)

| Column | 설명 | 예시 |
|--------|------|------|
| A: session_id | 세션 ID | sess-uuid-5678 |
| B: user_id | 사용자 ID | uuid-1234 |
| C: created_at | 생성 시간 | 2026-01-20 10:30:00 |
| D: expires_at | 만료 시간 | 2026-01-21 10:30:00 |
| E: ip_address | IP 주소 | 3.34.186.174 |

### 시트 3: Activity_Log (활동 로그)

| Column | 설명 | 예시 |
|--------|------|------|
| A: timestamp | 시간 | 2026-01-20 10:30:00 |
| B: user_id | 사용자 ID | uuid-1234 |
| C: action | 액션 | login / calculate / diagnose |
| D: details | 상세 정보 | {"module": "corp"} |

---

## 🚀 구현 단계

### 1단계: Google Cloud 설정

```bash
1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성: "sagunbok-auth"
3. API 및 서비스 → 라이브러리
4. "Google Sheets API" 검색 및 활성화
5. "Google Drive API" 활성화 (필요시)
```

### 2단계: Service Account 생성

```bash
1. API 및 서비스 → 사용자 인증 정보
2. 사용자 인증 정보 만들기 → 서비스 계정
3. 이름: sagunbok-service
4. 역할: Editor
5. JSON 키 생성 및 다운로드
```

### 3단계: Google Sheets 생성 및 공유

```bash
1. Google Sheets에서 새 스프레드시트 생성
2. 이름: "사근복 회원 데이터베이스"
3. 3개 시트 생성: Users, Sessions, Activity_Log
4. Service Account 이메일에게 편집 권한 부여
   (예: sagunbok-service@sagunbok-auth.iam.gserviceaccount.com)
```

### 4단계: 백엔드 API 구현

#### 옵션 A: Vercel Serverless Functions (추천)

```javascript
// api/auth/login.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, role, company } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 사용자 조회
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:I',
    });

    const rows = response.data.values || [];
    let user = rows.find(row => row[1] === email);

    if (!user) {
      // 신규 회원 가입
      const userId = `user-${Date.now()}`;
      const newUser = [
        userId,
        email,
        name,
        role,
        company,
        '',
        new Date().toISOString(),
        'false',
        new Date().toISOString(),
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Users!A:I',
        valueInputOption: 'RAW',
        resource: { values: [newUser] },
      });

      user = newUser;
    } else {
      // 마지막 로그인 업데이트
      const rowIndex = rows.indexOf(user) + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Users!I${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [[new Date().toISOString()]] },
      });
    }

    // 세션 생성
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      sessionId,
      userId: user[0],
      email: user[1],
      name: user[2],
      role: user[3],
      company: user[4],
    };

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 옵션 B: Google Apps Script (더 간단)

```javascript
// Google Apps Script 웹 앱으로 배포
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const { email, name, role, company, action } = data;
  
  const ss = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID');
  const usersSheet = ss.getSheetByName('Users');
  
  if (action === 'login') {
    // 사용자 찾기
    const users = usersSheet.getDataRange().getValues();
    let userRow = users.findIndex(row => row[1] === email);
    
    if (userRow === -1) {
      // 신규 가입
      const userId = 'user-' + new Date().getTime();
      usersSheet.appendRow([
        userId,
        email,
        name,
        role,
        company,
        '',
        new Date(),
        'false',
        new Date()
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        user: { userId, email, name, role, company, isNew: true }
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // 마지막 로그인 업데이트
      usersSheet.getRange(userRow + 1, 9).setValue(new Date());
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        user: {
          userId: users[userRow][0],
          email: users[userRow][1],
          name: users[userRow][2],
          role: users[userRow][3],
          company: users[userRow][4],
          isNew: false
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### 5단계: 프론트엔드 통합

```typescript
// components/Login.tsx
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'expert' | 'company'>('company');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('YOUR_BACKEND_URL/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, company }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('sagunbok_session', JSON.stringify(data.session));
        onLoginSuccess(data.session);
      } else {
        alert('로그인 실패');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">사근복 AI 로그인</h2>
      
      <div className="space-y-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl"
        />
        
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl"
        />
        
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'expert' | 'company')}
          className="w-full px-4 py-3 border rounded-xl"
        >
          <option value="company">기업 담당자</option>
          <option value="expert">사근복 전문가</option>
        </select>
        
        {role === 'company' && (
          <input
            type="text"
            placeholder="회사명"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          />
        )}
        
        <button
          onClick={handleLogin}
          disabled={loading || !email || !name}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인 / 회원가입'}
        </button>
      </div>
    </div>
  );
};

export default Login;
```

---

## 🔒 보안 고려사항

1. **HTTPS 필수**: SSL 인증서 적용
2. **Rate Limiting**: API 호출 제한
3. **입력 검증**: 이메일 형식, SQL Injection 방지
4. **세션 관리**: 세션 타임아웃 (24시간)
5. **Service Account 키 보호**: 환경 변수로 관리

---

## 📈 다음 단계

1. ✅ Google Cloud Project 생성
2. ✅ Google Sheets 템플릿 생성
3. ✅ Service Account 설정
4. ⏳ 백엔드 API 구현 (Vercel or Apps Script)
5. ⏳ 프론트엔드 로그인 UI 통합
6. ⏳ 세션 관리 시스템 구현
7. ⏳ 역할별 기능 제한 구현

---

## 💡 추천 사항

**Google Apps Script 방식을 먼저 시도하세요!**
- 설정이 간단하고 무료입니다.
- 초기 MVP에 충분합니다.
- 나중에 트래픽이 늘면 Node.js 백엔드로 전환 가능합니다.

---

**필요하시면 Google Apps Script 구현을 먼저 도와드리겠습니다!** 🚀
