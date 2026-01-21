#!/bin/bash
echo "=== 프록시 서버 URL 업데이트 ==="
echo ""
echo "현재 Apps Script URL:"
grep "APPS_SCRIPT_URL" proxy-server.js
echo ""
echo "새 URL을 입력하세요 (Ctrl+C로 취소):"
read -r NEW_URL

if [ -z "$NEW_URL" ]; then
    echo "❌ URL이 비어있습니다!"
    exit 1
fi

echo ""
echo "URL 업데이트 중..."
sed -i "s|const APPS_SCRIPT_URL = '.*'|const APPS_SCRIPT_URL = '$NEW_URL'|" proxy-server.js

echo "✅ 변경 완료! 새 URL:"
grep "APPS_SCRIPT_URL" proxy-server.js

echo ""
echo "프록시 서버 재시작 중..."
pm2 restart proxy-server

sleep 2
echo ""
echo "✅ 완료! 로그 확인:"
pm2 logs proxy-server --nostream --lines 3
