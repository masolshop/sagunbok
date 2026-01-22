#!/bin/bash

APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbyXNblmD7q9iu1Ye91WuU2X2u3iAqi8P-YgG6WaZ-19gPfctqesCS9fQLjQFx9Pv0Go/exec"
EC2_URL="http://3.34.186.174/api"

echo "=========================================="
echo "🕐 Apps Script v4.0 - 한국 시간(KST) 테스트"
echo "=========================================="
echo ""

# 1. Apps Script 버전 확인 (GET)
echo "📌 1. Apps Script 버전 확인 (GET)"
echo "URL: $APPS_SCRIPT_URL"
echo ""
curl -s "$APPS_SCRIPT_URL" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))" 2>/dev/null || echo "⚠️ JSON 파싱 실패 (HTML 응답일 수 있음)"
echo ""
echo "------------------------------------------"
echo ""

# 2. 기업회원 회원가입 테스트
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "📌 2. 기업회원 회원가입 테스트 (한국 시간 확인)"
REGISTER_DATA='{
  "action": "registerCompany",
  "companyName": "KST테스트회사'$TIMESTAMP'",
  "companyType": "법인",
  "referrer": "이종근",
  "name": "홍길동",
  "phone": "0107777'$TIMESTAMP'",
  "email": "kst'$TIMESTAMP'@test.com",
  "password": "test1234"
}'
echo "요청 데이터:"
echo "$REGISTER_DATA" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))"
echo ""
echo "응답:"
curl -X POST "$EC2_URL" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))"
echo ""
echo "------------------------------------------"
echo ""

# 3. 현재 한국 시간 확인
echo "📌 3. 현재 시간 비교"
echo "🕐 시스템 시간 (UTC): $(date -u '+%Y-%m-%d %H:%M:%S')"
echo "🕐 한국 시간 (KST): $(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "------------------------------------------"
echo ""

# 4. 로그인 테스트
echo "📌 4. 기업회원 로그인 테스트"
LOGIN_DATA='{
  "action": "loginCompany",
  "phone": "01099887766",
  "password": "test1234"
}'
echo "요청 데이터:"
echo "$LOGIN_DATA" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))"
echo ""
echo "응답:"
curl -X POST "$EC2_URL" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))"
echo ""
echo "------------------------------------------"
echo ""

echo "✅ Apps Script v4.0 테스트 완료!"
echo ""
echo "📊 확인 사항:"
echo "1. ✅ Google Sheets 로그기록 시트 열기"
echo "   → 타임스탬프가 한국 시간(KST)으로 표시되는지 확인"
echo "   → 예: 2026-01-22 17:31:58 (17시 = 오후 5시)"
echo ""
echo "2. ✅ 기업회원 시트 확인"
echo "   → 가입일(H열)이 한국 시간으로 표시되는지 확인"
echo "   → J열(로그기록)에 데이터가 추가되지 않았는지 확인"
echo ""
echo "3. ✅ 사근복컨설턴트 시트 확인"
echo "   → 가입일(H열)이 한국 시간으로 표시되는지 확인"
echo "   → J열(로그기록)에 데이터가 추가되지 않았는지 확인"
echo ""
echo "🔗 Google Sheets:"
echo "https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"
echo ""
echo "🕐 현재 시간 기준:"
echo "   UTC: $(date -u '+%Y-%m-%d %H:%M:%S')"
echo "   KST: $(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M:%S')"
