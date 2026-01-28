#!/bin/bash
# 백엔드 API 경로 수정 스크립트

echo "📝 백엔드 API 경로 수정"
echo "변경: /api/external → /api/external-data"
echo ""
echo "실행 커맨드:"
echo "cd /var/www/sagunbok-api"
echo "sudo cp index.js index.js.backup17"
echo "sudo sed -i \"s|app.use('/api/external'|app.use('/api/external-data'|g\" index.js"
echo "pm2 restart sagunbok-api"
echo ""
echo "✅ 백엔드 재시작 완료"
