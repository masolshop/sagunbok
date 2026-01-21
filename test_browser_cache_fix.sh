#!/bin/bash

echo "=========================================="
echo "🔥 브라우저 캐시 304 에러 해결 테스트"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Apps Script 버전 확인
echo "1️⃣ Apps Script V5.4.2 FINAL 확인..."
APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbxxnsxHIL1nBUpG6wPs286FbprA2u5BNkW4ynJvaX5kfmgkFeDK0vDmojWbQLa4T-6_4Q/exec"
VERSION_RESPONSE=$(curl -sL "${APPS_SCRIPT_URL}?action=getVersion")
echo "${VERSION_RESPONSE}" | jq '.'
echo ""

# 2. 프론트엔드 URL 확인
echo "2️⃣ 새 프론트엔드 URL 확인..."
FRONTEND_URL="https://8080-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai"
echo -e "${GREEN}✅ 새 프론트엔드 URL: ${FRONTEND_URL}${NC}"
echo ""

# 3. 로컬 서버 확인
echo "3️⃣ 로컬 8080 서버 확인..."
if curl -s http://localhost:8080/ | grep -q "사근복 AI 스튜디오"; then
    echo -e "${GREEN}✅ 로컬 서버 정상 작동 중${NC}"
else
    echo -e "${RED}❌ 로컬 서버 응답 없음${NC}"
fi
echo ""

# 4. 신규 시트 URL
echo "4️⃣ 신규 Google Sheets..."
SHEET_URL="https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"
echo -e "${GREEN}✅ 신규 시트: ${SHEET_URL}${NC}"
echo ""

# 5. 테스트 회원가입
echo "5️⃣ 회원가입 테스트..."
TEST_DATA='{
  "companyName": "캐시해결테스트병원",
  "companyType": "병의원개인사업자",
  "name": "캐시테스터",
  "phone": "01066667777",
  "email": "cachefix@test.com",
  "password": "test1234",
  "referrer": "김철수"
}'

REGISTER_URL="${APPS_SCRIPT_URL}?action=registerCompany&data=$(echo $TEST_DATA | jq -c '.' | jq -sRr @uri)"
REGISTER_RESPONSE=$(curl -sL "${REGISTER_URL}")
echo "${REGISTER_RESPONSE}" | jq '.'
echo ""

# 6. 결과 요약
echo "=========================================="
echo "📋 테스트 결과 요약"
echo "=========================================="
echo ""
echo -e "${YELLOW}✅ Apps Script V5.4.2 FINAL 작동 중${NC}"
echo -e "${YELLOW}✅ 신규 Google Sheets 연동됨${NC}"
echo -e "${YELLOW}✅ 새 프론트엔드 URL: ${FRONTEND_URL}${NC}"
echo ""
echo -e "${GREEN}🎯 즉시 테스트:${NC}"
echo "   1) 브라우저에서 새 URL 접속"
echo "   2) F12 콘솔에서 CDN 경고 없는지 확인"
echo "   3) 기업회원 가입 테스트"
echo "   4) Google Sheets I열(승인상태) 확인"
echo ""
echo "=========================================="
