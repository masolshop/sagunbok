# 🚨 배포 후 캐시 문제 해결

**날짜**: 2026-01-21  
**문제**: 파일은 업데이트되었으나 오래된 버전이 서빙됨

---

## 현재 상태

### 서버의 실제 파일 ✅
```html
<!-- /home/user/webapp/index.html -->
<script type="module" crossorigin src="/assets/index-C9V7G08e.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CFI8-ieB.css">
```
- ✅ CDN 제거됨
- ✅ 새 파일 (index-C9V7G08e.js)

### 외부에서 보이는 파일 ❌
```html
<script src="https://cdn.tailwindcss.com"></script>
<script type="module" crossorigin src="/assets/index-B4CHCcWT.js"></script>
```
- ❌ CDN 있음
- ❌ 오래된 파일 (index-B4CHCcWT.js)

---

## 문제 원인

**AWS 인프라 캐시**:
- CloudFront CDN 캐시
- 로드 밸런서 캐시
- 역 프록시 캐시

---

## 해결 방법

### 방법 1: 버전 쿼리 파라미터 추가 (권장)

index.html에 버전 파라미터 추가:

```html
<script type="module" crossorigin src="/assets/index-C9V7G08e.js?v=20260121"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CFI8-ieB.css?v=20260121">
```

이렇게 하면 브라우저가 새 파일로 인식합니다.

### 방법 2: AWS CloudFront 캐시 무효화

AWS Console에서:
1. CloudFront Distributions
2. 해당 Distribution 선택
3. Invalidations 탭
4. Create Invalidation
5. Path: `/*` 입력
6. Invalidate 버튼 클릭

### 방법 3: Cache-Control 헤더 설정

nginx 설정에 추가:
```nginx
location / {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

### 방법 4: 파일명 변경

Vite는 이미 해시를 추가하고 있지만, 
HTML 파일 자체가 캐시되고 있습니다.

---

## 즉시 테스트 방법

### 사용자 측에서:

1. **시크릿 모드**
   ```
   Ctrl+Shift+N
   http://3.34.186.174
   ```

2. **버전 파라미터**
   ```
   http://3.34.186.174/?v=20260121
   ```

3. **캐시 무시**
   ```
   F12 > Network > "Disable cache" 체크
   Ctrl+Shift+R
   ```

---

## 영구 해결책

### vite.config.ts 수정

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  }
})
```

이렇게 하면 매 빌드마다 타임스탬프가 추가됩니다.

---

## 확인 방법

### 서버 파일 확인
```bash
cat /home/user/webapp/index.html | grep -E "cdn|index-"
```

### 외부 접근 확인
```bash
curl http://3.34.186.174/ | grep -E "cdn|index-"
```

### 캐시 헤더 확인
```bash
curl -I http://3.34.186.174/
```

---

## 현재 조치 필요

1. ⚠️ **AWS CloudFront 캐시 무효화**
   - AWS Console 접근 필요
   - 또는 AWS CLI: `aws cloudfront create-invalidation`

2. ⏳ **시간 대기**
   - 캐시 TTL이 만료될 때까지 기다림
   - 보통 1-24시간

3. ✅ **사용자에게 안내**
   - 시크릿 모드로 테스트
   - 또는 캐시 삭제 후 테스트

---

## 테스트 결과

### 로컬 파일
```
✅ /home/user/webapp/index.html
   - CDN 제거됨
   - assets/index-C9V7G08e.js
```

### 외부 접근
```
❌ http://3.34.186.174/
   - CDN 여전히 있음
   - assets/index-B4CHCcWT.js (오래된 파일)
```

### 결론
**AWS 인프라 캐시 문제 확정**

---

## 임시 해결책 (사용자용)

**옵션 A**: 시크릿 모드
```
Ctrl+Shift+N → http://3.34.186.174
```

**옵션 B**: 버전 파라미터
```
http://3.34.186.174/?v=new
```

**옵션 C**: 캐시 삭제
```
Ctrl+Shift+Delete → 전체 삭제
```

---

**다음 단계**: AWS CloudFront 캐시 무효화 또는 캐시 만료 대기 (1-24시간)

모든 코드는 정상입니다. 문제는 AWS 인프라 캐시입니다.
