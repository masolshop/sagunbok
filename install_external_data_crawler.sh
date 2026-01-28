#!/bin/bash
# 외부데이터 크롤러 UI 설치 스크립트

echo "🔄 외부데이터 크롤러 페이지 설치 중..."

# 기존 외부데이터 관련 스크립트 모두 제거
sed -i '/<script id="crawler-insight-with-biznum">/,/<\/script>/d' /var/www/sagunbok/index.html
sed -i '/<script id="external-data-dom-override">/,/<\/script>/d' /var/www/sagunbok/index.html
sed -i '/<script id="external-data-crawler-page">/,/<\/script>/d' /var/www/sagunbok/index.html
sed -i '/<script id="external-data-new-crawler">/,/<\/script>/d' /var/www/sagunbok/index.html

echo "✅ 기존 외부데이터 스크립트 제거 완료"

# 새 크롤러 UI 삽입
sed -i '/<\/body>/r external_data_new_crawler.html' /var/www/sagunbok/index.html

echo "✅ 외부데이터 크롤러 UI 설치 완료"
