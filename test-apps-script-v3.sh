#!/bin/bash

APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec"
EC2_URL="http://3.34.186.174/api"

echo "=========================================="
echo "🔍 Apps Script v3.0 테스트 시작"
echo "=========================================="
echo ""

# 1. Apps Script 직접 버전 확인 (GET)
echo "📌 1. Apps Script 버전 확인 (GET)"
echo "URL: $APPS_SCRIPT_URL"
echo ""
curl -s "$APPS_SCRIPT_URL" | head -20
echo ""
echo "------------------------------------------"
echo ""

# 2. 기업회원 회원가입 테스트 (Apps Script 직접)
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "📌 2. 기업회원 회원가입 테스트 (Apps Script 직접)"
REGISTER_DATA='{
  "action": "registerCompany",
  "companyName": "테스트회사'$TIMESTAMP'",
  "companyType": "법인",
  "referrer": "이종근",
  "name": "홍길동",
  "phone": "0108888'$TIMESTAMP'",
  "email": "test'$TIMESTAMP'@test.com",
  "password": "test1234"
}'
echo "요청 데이터: $REGISTER_DATA"
echo ""
curl -X POST "$APPS_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" | python3 -m json.tool
echo ""
echo "------------------------------------------"
echo ""

# 3. 기업회원 로그인 테스트 (Apps Script 직접)
echo "📌 3. 기업회원 로그인 테스트 (Apps Script 직접)"
LOGIN_DATA='{
  "action": "loginCompany",
  "phone": "01099887766",
  "password": "test1234"
}'
echo "요청 데이터: $LOGIN_DATA"
echo ""
curl -X POST "$APPS_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" | python3 -m json.tool
echo ""
echo "------------------------------------------"
echo ""

# 4. EC2 Proxy를 통한 로그인 테스트
echo "📌 4. EC2 Proxy를 통한 로그인 테스트"
echo "URL: $EC2_URL"
echo "요청 데이터: $LOGIN_DATA"
echo ""
curl -X POST "$EC2_URL" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" | python3 -m json.tool
echo ""
echo "------------------------------------------"
echo ""

# 5. 사근복 컨설턴트 회원가입 테스트 (Apps Script 직접)
echo "📌 5. 사근복 컨설턴트 회원가입 테스트 (Apps Script 직접)"
CONSULTANT_DATA='{
  "action": "registerConsultant",
  "name": "김컨설턴트'$TIMESTAMP'",
  "phone": "0109999'$TIMESTAMP'",
  "email": "consultant'$TIMESTAMP'@test.com",
  "position": "수석 컨설턴트",
  "division": "서울사업단",
  "branch": "강남지사"
}'
echo "요청 데이터: $CONSULTANT_DATA"
echo ""
curl -X POST "$APPS_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d "$CONSULTANT_DATA" | python3 -m json.tool
echo ""
echo "------------------------------------------"
echo ""

echo "✅ Apps Script v3.0 테스트 완료!"
echo ""
echo "📊 확인 사항:"
echo "1. Google Sheets 로그기록 시트에 새 로그가 추가되었는지 확인"
echo "2. 기업회원 시트의 J열(로그기록)이 비어있는지 확인"
echo "3. 사근복컨설턴트 시트의 J열(로그기록)이 비어있는지 확인"
echo ""
echo "🔗 Google Sheets:"
echo "https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"

