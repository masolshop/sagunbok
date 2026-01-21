#!/bin/bash

echo "=== Nginx 설치 및 설정 ==="

# 1. Nginx 설치 확인
if ! command -v nginx &> /dev/null; then
    echo "Nginx를 설치합니다..."
    sudo apt-get update
    sudo apt-get install -y nginx
else
    echo "✅ Nginx가 이미 설치되어 있습니다."
fi

# 2. Nginx 설정 복사
echo "Nginx 설정 파일을 복사합니다..."
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo cp /home/user/webapp/nginx-site.conf /etc/nginx/sites-available/sagunbok

# 3. 심볼릭 링크 생성
echo "설정을 활성화합니다..."
sudo ln -sf /etc/nginx/sites-available/sagunbok /etc/nginx/sites-enabled/sagunbok

# 4. 기본 설정 비활성화
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Nginx 설정 테스트
echo "Nginx 설정을 테스트합니다..."
sudo nginx -t

# 6. Nginx 시작 또는 재시작
if sudo systemctl is-active --quiet nginx; then
    echo "Nginx를 재시작합니다..."
    sudo systemctl reload nginx
else
    echo "Nginx를 시작합니다..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

echo "✅ Nginx 설정 완료!"
echo ""
echo "테스트:"
echo "  curl http://localhost/api/health"

