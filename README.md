# 사근복 AI - 로그인 전용 시스템

## 🎯 프로젝트 개요
Google Sheets 연동 로그인/회원가입 시스템 (추천인 + 기업유형)

## ✅ 현재 상태 (2026-01-22)

### 활성화된 기능
- ✅ **로그인 시스템** (Auth.tsx)
  - 추천인 입력 필드
  - 기업회원 분류 (개인사업자/법인사업자/비영리)
  - Google Sheets 연동
  - 회원가입 (기업/컨설턴트)
  - 아이디/비밀번호 찾기

- ✅ **백엔드 연동**
  - Google Apps Script
  - CORS Proxy Server (localhost:3001)
  - Google Sheets 승인 시스템

- ✅ **기타 컴포넌트**
  - APIKeySettings.tsx (Gemini API 키 설정)
  - AdminView.tsx (관리자 뷰)

### 삭제된 기능
- ❌ 모든 계산기 (CEO, Corporate, Employee, NetPay, Calculator, Diagnosis)
- ❌ AI Chat
- ❌ 모든 백업 폴더
- ❌ 모든 압축 파일
- ❌ 모든 문서 파일 (이전 버전)

## 📁 파일 구조

```
/home/user/webapp/
├── App.tsx                  # 로그인 전용 메인 앱
├── components/
│   ├── Auth.tsx            # 로그인/회원가입 (39KB)
│   ├── APIKeySettings.tsx  # API 키 설정 (6.3KB)
│   └── AdminView.tsx       # 관리자 뷰 (6.9KB)
├── proxy-server.js         # CORS 프록시
├── vite.config.ts          # Vite 설정
└── package.json            # 의존성
```

## 🚀 서버 상태

### 현재 실행 중
- **Vite Dev Server**: http://localhost:3000/ ✅
- **Proxy Server**: http://localhost:3001/ ✅
- **Public URL**: https://3000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai ✅

### 프로세스
- PID 52825: Proxy Server (node proxy-server.js)
- PID 58304: Vite Dev Server (node vite)

## 🔗 백엔드 연동

### Google Apps Script
- **URL**: https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec

### Google Sheets
- **URL**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **시트**: 
  - 기업회원
  - 컨설턴트
  - 승인대기

### API 흐름
```
Browser → /api (Vite 3000)
  → Vite Proxy
    → localhost:3001 (CORS Proxy)
      → Google Apps Script
        → Google Sheets
```

## 🧪 테스트

### 테스트 계정
- **전화번호**: 01099887766
- **비밀번호**: test1234

### 테스트 절차
1. Chrome 시크릿 모드 (Ctrl+Shift+N)
2. F12 → Application → Storage 모두 삭제
3. URL 접속: https://3000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai
4. Ctrl+Shift+R (강제 새로고침)
5. 로그인: 01099887766 / test1234

### 기대 결과
- ✅ 로그인 화면 (추천인 입력 필드 포함)
- ✅ 로그인 성공 → 대시보드
- ✅ 사용자 정보 표시
- ✅ 로그아웃 기능

## 📝 Git 이력

### 최근 커밋
```
cfb2474 - feat: 로그인 전용 앱으로 초기화 - 모든 계산기/백업/문서 삭제
ae1206c - docs: EC2 진짜 버전 복원 완료 보고서
9fc29f6 - feat: EC2 20일 계산기 + 오늘 로그인 통합 완료
```

### 변경 사항
- 115 files changed
- 72 insertions(+)
- 29,169 deletions(-)

## 🔧 개발 환경

### 실행 방법
```bash
cd /home/user/webapp
npm run dev
```

### 의존성
- React 18
- TypeScript
- Vite 6.4.1
- Tailwind CSS

## 📊 시스템 통계

### Components
- Auth.tsx: 39 KB
- APIKeySettings.tsx: 6.3 KB
- AdminView.tsx: 6.9 KB

### 삭제된 파일
- 계산기: 7개 (약 200 KB)
- 백업: 10개 폴더
- 문서: 95개 .md 파일
- 압축: 6개 .tar.gz 파일

## 🎉 결론

✅ **로그인 전용 시스템으로 완벽하게 초기화되었습니다!**

- 모든 계산기 제거됨
- 모든 백업/압축 파일 제거됨
- Auth.tsx만 유지 (추천인 + 기업유형 + Google Sheets 연동)
- Git 커밋 및 푸시 완료
- 서버 정상 작동 중

---

**작성자**: AI Assistant  
**작성 일시**: 2026-01-22 06:59 UTC  
**Git Commit**: cfb2474  
**Branch**: main
