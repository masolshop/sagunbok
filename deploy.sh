#!/bin/bash

echo "🚀 프런트엔드 배포 시작..."

# 빌드
echo "1️⃣  빌드 중..."
npm run build

# 백업
echo "2️⃣  기존 파일 백업 중..."
mkdir -p .backup
cp index.html .backup/index.html.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# assets 폴더 백업 및 정리
if [ -d "assets" ]; then
  mv assets .backup/assets.$(date +%Y%m%d_%H%M%S)
fi

# dist 내용을 루트로 복사
echo "3️⃣  배포 중..."
cp -r dist/* .

echo "✅ 배포 완료!"
echo ""
echo "파일 확인:"
ls -lh index.html assets/

echo ""
echo "🧪 테스트:"
echo "  curl http://localhost/ | grep -o 'cdn.tailwindcss'"

