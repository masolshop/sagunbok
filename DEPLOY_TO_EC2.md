# 🚀 EC2 배포 가이드 (로그인 기능 포함)

## 📦 배포 파일
- **파일명**: `dist-login-20260121152348.tar.gz`
- **크기**: 137KB
- **포함 내용**: 
  - 정상 로그인 페이지
  - 사근복 절세계산기 메인 앱
  - Google Sheets 연동
  - 모든 절세계산기 기능

---

## 🖥️ EC2 서버 정보
- **서버 주소**: http://3.34.186.174/
- **웹 서버**: nginx/1.18.0 (Ubuntu)
- **배포 경로**: `/var/www/html/` (예상)

---

## 📋 배포 단계

### 1️⃣ 배포 파일 다운로드
샌드박스에서 생성된 파일을 다운로드하거나, EC2 서버에 직접 전송:

```bash
# 방법 1: 로컬에 다운로드 후 EC2에 업로드
scp dist-login-20260121152348.tar.gz ubuntu@3.34.186.174:/tmp/

# 방법 2: EC2에서 직접 다운로드 (샌드박스 URL 사용)
# ssh ubuntu@3.34.186.174
# cd /tmp
# wget [샌드박스_파일_URL]
```

---

### 2️⃣ EC2 서버 접속

```bash
ssh ubuntu@3.34.186.174
# 또는
ssh -i your-key.pem ubuntu@3.34.186.174
```

---

### 3️⃣ 기존 파일 백업

```bash
# 현재 배포된 파일 백업
sudo cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d%H%M%S)

# 또는 특정 파일만 백업
sudo tar -czf /var/www/html.backup.$(date +%Y%m%d%H%M%S).tar.gz /var/www/html
```

---

### 4️⃣ 새 버전 배포

```bash
# 압축 해제
cd /tmp
tar -xzf dist-login-20260121152348.tar.gz

# 기존 파일 삭제 (조심!)
sudo rm -rf /var/www/html/*

# 새 파일 복사
sudo cp -r dist/* /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

---

### 5️⃣ nginx 설정 확인

```bash
# nginx 설정 확인
sudo nginx -t

# nginx 재시작 (필요 시)
sudo systemctl reload nginx
# 또는
sudo systemctl restart nginx
```

---

### 6️⃣ 배포 확인

```bash
# 로컬에서 확인
curl http://3.34.186.174/

# 브라우저에서 접속
# http://3.34.186.174/
```

---

## ✅ 배포 후 확인사항

### 1. 로그인 페이지 표시 확인
- ✅ "사근복 AI" 헤더 표시
- ✅ "기업회원" / "사근복 컨설턴트" 탭 표시
- ✅ ID/비밀번호 입력창 표시

### 2. 로그인 테스트
**기업회원 로그인:**
```
ID: 010-1234-5678 (실제 가입된 전화번호)
비밀번호: (회원가입 시 설정한 비밀번호)
```

**컨설턴트 로그인:**
```
ID: 010-8765-4321 (실제 가입된 전화번호)
비밀번호: 12345
```

### 3. Google Sheets 연동 확인
- ✅ 로그인 API 호출 성공
- ✅ Google Sheets에서 사용자 정보 조회
- ✅ 승인 상태 확인 (`승인완료`여야 로그인 가능)

### 4. 메인 앱 확인
로그인 성공 후:
- ✅ 기업절세계산기 화면 표시
- ✅ 왼쪽 사이드바 네비게이션 표시
- ✅ AI 챗봇 아이콘 표시
- ✅ 모든 절세계산기 기능 작동

---

## 🔧 문제 해결

### 문제 1: "로그인 화면이 안 보여요"
**원인**: 브라우저 캐시
**해결**:
```bash
# 하드 리프레시
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
```

### 문제 2: "API 호출이 안 돼요"
**원인**: CORS 문제
**해결**: nginx에 CORS 헤더 추가
```nginx
# /etc/nginx/sites-available/default 편집
location / {
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Content-Type';
    try_files $uri $uri/ /index.html;
}
```

### 문제 3: "로그인은 되는데 화면이 새로고침돼요"
**원인**: SPA 라우팅 문제
**해결**: nginx에서 모든 경로를 index.html로 리다이렉트
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 문제 4: "로그인 후 흰 화면만 보여요"
**원인**: JavaScript 파일 로드 실패
**확인**:
```bash
# 파일 존재 확인
ls -la /var/www/html/assets/

# 브라우저 개발자 도구 콘솔 확인
# F12 -> Console 탭
```

---

## 📊 배포 파일 구조

```
dist/
├── index.html              # 메인 HTML (1.07 KB)
└── assets/
    ├── index-BOaTuIUA.js  # 메인 JavaScript 번들 (577.97 KB)
    └── index-*.css        # CSS 파일 (있을 경우)
```

---

## 🔐 보안 설정 (권장)

### 1. HTTPS 설정
```bash
# Let's Encrypt 인증서 설치
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. 방화벽 설정
```bash
# HTTP/HTTPS 포트만 열기
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📝 배포 이력

| 날짜 | 버전 | 변경사항 |
|------|------|----------|
| 2026-01-21 15:23 | dist-login-20260121152348 | 정상 로그인 기능 배포 |
| 2026-01-21 14:02 | 이전 버전 | React 앱 초기 배포 |

---

## 🆘 지원 정보

### Google Sheets 정보
- **Spreadsheet ID**: `1PmVNfdxXrYSKAWgYLAywqo0IJXTPPL7eJnLd14-_vaU`
- **시트 URL**: https://docs.google.com/spreadsheets/d/1PmVNfdxXrYSKAWgYLAywqo0IJXTPPL7eJnLd14-_vaU/edit

### Apps Script 정보
- **Backend URL**: https://script.google.com/macros/s/AKfycbxMcJ82NqcvWOh5ODzo9ZyQ0zxotgT5oKRJL9CH66JGuNi2V7WpT7XI4CRYWYb11WOB/exec

---

## ✨ 완료!

배포가 완료되면 http://3.34.186.174/ 에서 **로그인 페이지**가 표시됩니다!

로그인 후 **사근복 절세계산기** 메인 화면으로 자동 이동합니다! 🎉
