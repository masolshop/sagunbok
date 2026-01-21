#!/bin/bash

echo "새 Apps Script URL을 입력하세요:"
read NEW_URL

echo "프록시 서버 URL 업데이트 중..."
sed -i "s|const APPS_SCRIPT_URL = '.*';|const APPS_SCRIPT_URL = '$NEW_URL';|" proxy-server.js

echo "변경 내용 확인:"
grep "APPS_SCRIPT_URL" proxy-server.js

echo ""
echo "프록시 서버 재시작 중..."
pm2 restart proxy-server

echo ""
echo "✅ 완료! 로그 확인:"
pm2 logs proxy-server --nostream --lines 5

