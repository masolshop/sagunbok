#!/bin/bash

# 빌드 후 dist/index.html에 캐시 비활성화 헤더 추가

echo "🔧 dist/index.html에 캐시 비활성화 헤더 추가 중..."

# dist/index.html 확인
if [ ! -f "dist/index.html" ]; then
    echo "❌ dist/index.html 파일이 없습니다!"
    exit 1
fi

# 백업
cp dist/index.html dist/index.html.backup

# 캐시 비활성화 메타 태그 추가
# <meta name="viewport"... 다음에 삽입
sed -i '/<meta name="viewport"/a\    <!-- 캐시 비활성화 (304 에러 방지) -->\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n    <meta http-equiv="Pragma" content="no-cache">\n    <meta http-equiv="Expires" content="0">' dist/index.html

echo "✅ 캐시 비활성화 헤더 추가 완료!"
echo ""
echo "확인:"
head -15 dist/index.html | grep -A 3 "Cache-Control"
