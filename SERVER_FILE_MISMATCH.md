# 🚨 긴급: 서버 파일 불일치 문제 발견

**발견일**: 2026-01-21 11:02  
**문제**: 서버가 `/home/user/webapp`가 아닌 다른 디렉토리의 오래된 파일을 서빙  
**GitHub**: https://github.com/masolshop/sagunbok/commit/02b49f8

---

## 🔍 문제 진단

### 로컬 파일 (우리가 배포한 파일)
```bash
/home/user/webapp/index.html
- 캐시 헤더: ✅ 포함
- JS 파일: /assets/index-CWmGMzsT.js?v=20260121-1101
- CSS 파일: /assets/index-CFI8-ieB.css?v=20260121-1101
- Tailwind CDN: ❌ 없음
```

### 서버가 실제로 서빙하는 파일
```bash
http://3.34.186.174/
- 캐시 헤더: ❌ 없음
- JS 파일: /assets/index-B4CHCcWT.js (매우 오래된 파일!)
- Tailwind CDN: ✅ 있음 (문제의 원인!)
```

---

## 🎯 결론

**서버 설정 문제**: 웹 서버(nginx 또는 CloudFront)가 `/home/user/webapp`가 아니라 **다른 디렉토리**를 문서 루트로 사용하고 있습니다.

---

## ✅ 임시 해결 방법 적용

### 1. 자산 파일에 버전 쿼리스트링 추가
```html
<script src="/assets/index-CWmGMzsT.js?v=20260121-1101"></script>
<link href="/assets/index-CFI8-ieB.css?v=20260121-1101"></link>
```

### 2. 캐시 비활성화 메타 태그
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

---

## 🔥 필수 조치 (AWS 관리자 또는 DevOps 팀)

### Option 1: nginx 설정 업데이트 (권장)

#### 1-1. nginx 문서 루트 확인
```bash
sudo cat /etc/nginx/sites-enabled/default | grep "root "
```

#### 1-2. nginx 설정 변경
```nginx
server {
    listen 80;
    root /home/user/webapp;  # ← 이 경로로 변경
    index index.html;
    
    # 캐시 비활성화
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 1-3. nginx 재시작
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Option 2: 실제 서빙 디렉토리 찾기

#### 2-1. 오래된 파일 찾기
```bash
find /var/www -name "index-B4CHCcWT.js" 2>/dev/null
find /usr/share/nginx/html -name "index-B4CHCcWT.js" 2>/dev/null
```

#### 2-2. 찾은 디렉토리에 새 파일 복사
```bash
# 예: 실제 디렉토리가 /var/www/html 인 경우
cp -r /home/user/webapp/* /var/www/html/
```

---

### Option 3: CloudFront 캐시 무효화 (AWS 콘솔)

#### 3-1. AWS CloudFront 콘솔 접속

#### 3-2. Distribution 선택

#### 3-3. "Invalidations" 탭 클릭

#### 3-4. "Create Invalidation" 클릭

#### 3-5. Object Paths 입력:
```
/*
```

#### 3-6. "Create Invalidation" 클릭

#### 3-7. 무효화 완료 대기 (5-15분)

---

### Option 4: 심볼릭 링크 생성

```bash
# 실제 서빙 디렉토리 찾기
REAL_DIR=$(find /var -name "index-B4CHCcWT.js" -exec dirname {} \; 2>/dev/null | head -1)

# 해당 디렉토리의 기존 파일 백업
sudo mv "$REAL_DIR" "${REAL_DIR}.backup"

# /home/user/webapp으로 심볼릭 링크
sudo ln -s /home/user/webapp "$REAL_DIR"
```

---

## 🧪 테스트 방법

### 1. 서버 응답 확인
```bash
curl -s http://3.34.186.174/ | grep "index-CWmGMzsT"
```

**예상 결과**:
```html
<script src="/assets/index-CWmGMzsT.js?v=20260121-1101"></script>
```

### 2. CDN 확인
```bash
curl -s http://3.34.186.174/ | grep "cdn.tailwindcss"
```

**예상 결과**: (아무것도 출력되지 않아야 함)

---

## 📋 현재 상태

| 항목 | 로컬 (/home/user/webapp) | 서버 (http://3.34.186.174) |
|------|-------------------------|---------------------------|
| **JS 파일** | index-CWmGMzsT.js ✅ | index-B4CHCcWT.js ❌ |
| **캐시 헤더** | 포함 ✅ | 없음 ❌ |
| **Tailwind CDN** | 제거됨 ✅ | 있음 ❌ |
| **버전** | V5.4.2 FINAL ✅ | 오래된 버전 ❌ |

---

## 🎯 성공 지표

### ✅ 모두 체크되어야 성공
- [x] 로컬 파일 업데이트 완료
- [x] 캐시 헤더 추가 완료
- [x] fetch() 리다이렉트 옵션 추가 완료
- [x] 버전 쿼리스트링 추가 완료
- [x] Git 커밋 및 푸시 완료
- [ ] **서버 설정 업데이트 필요** ⚠️
- [ ] 서버가 올바른 파일 서빙 확인 필요
- [ ] 브라우저 테스트 성공 필요

---

## 🚀 즉시 수행 사항 (우선순위)

### 높음 (필수)
1. **nginx 설정 확인** 또는 **실제 서빙 디렉토리 찾기**
2. **nginx 문서 루트를 `/home/user/webapp`로 변경**
3. **nginx 재시작**
4. **서버 파일 확인**: `curl http://3.34.186.174/ | grep CWmGMzsT`

### 중간 (권장)
1. **CloudFront 캐시 무효화** (AWS 콘솔)
2. **브라우저 캐시 완전 삭제** (Ctrl+Shift+Delete)
3. **시크릿 모드로 테스트**

### 낮음 (선택)
1. **다른 컴퓨터에서 테스트**
2. **폰에서 테스트**

---

## 📁 관련 파일

- **로컬 최신 파일**: `/home/user/webapp/index.html`
- **임시 해결책**: 버전 쿼리스트링 추가
- **GitHub**: https://github.com/masolshop/sagunbok/commit/02b49f8

---

## 💡 참고

**핵심 문제**: 코드는 완벽하게 수정되었지만, **서버가 오래된 파일을 서빙**하고 있습니다.

**해결 키**: nginx 설정 또는 CloudFront 캐시를 업데이트해야 합니다.

---

**AWS 관리자에게 문의하거나, SSH 접속 권한이 있다면 위 Option 1-4 중 하나를 수행하세요.**
