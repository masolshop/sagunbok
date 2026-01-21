#!/bin/bash

echo "🎯 최종 버전 테스트"
echo "===================================="
echo ""

# 최신 Apps Script URL
BACKEND_URL="https://script.google.com/macros/s/AKfycbxxnsxHIL1nBUpG6wPs286FbprA2u5BNkW4ynJvaX5kfmgkFeDK0vDmojWbQLa4T-6_4Q/exec"

# 신규 시트 URL
SHEET_URL="https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"

# 프론트엔드 URL
FRONTEND_URL="https://8080-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai"

echo "📊 신규 시트: $SHEET_URL"
echo "🔗 Apps Script: $BACKEND_URL"
echo "🌐 프론트엔드: $FRONTEND_URL"
echo ""

# 테스트 데이터
TEST_DATA='{
  "companyName": "최최최종테스트병원",
  "companyType": "병의원개인사업자",
  "name": "최최최종테스터",
  "phone": "01011112222",
  "email": "finalfinal@test.com",
  "password": "test1234",
  "referrer": "김철수"
}'

echo "1️⃣  Apps Script 버전 확인"
VERSION_RESPONSE=$(curl -L -s "${BACKEND_URL}")
echo "$VERSION_RESPONSE" | jq -r '.version, .message'
echo ""

echo "2️⃣  기업회원 가입 테스트"
echo "테스트 데이터: 최최최종테스트병원 / 010-1111-2222"
echo ""

ENCODED_DATA=$(echo "$TEST_DATA" | jq -c '.' | jq -sRr @uri)
RESPONSE=$(curl -L -s "${BACKEND_URL}?action=registerCompany&data=${ENCODED_DATA}")

echo "📥 응답:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ 회원가입 성공!"
    echo ""
    echo "🔍 신규 Google Sheets 확인:"
    echo "   $SHEET_URL"
    echo ""
    echo "✅ 확인 사항:"
    echo "   - [기업회원] 시트에 새 행 추가됨"
    echo "   - I열(승인상태): '승인전표' ⭐"
    echo ""
    echo "🌐 브라우저 테스트:"
    echo "   $FRONTEND_URL"
    echo ""
    echo "   예상 결과:"
    echo "   - Console: CDN 경고 없음 ✅"
    echo "   - Network: index-BlSWeQQK.js 로드 ✅"
    echo "   - 회원가입 성공 ✅"
    echo "   - Google Sheets I열: 승인전표 ✅"
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // .message')
    echo "⚠️  응답: $ERROR"
  fi
else
  echo "❌ 회원가입 실패 또는 중복"
  echo "$RESPONSE"
fi

echo ""
echo "===================================="
echo "✅ CLI 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 열기"
echo "2. $FRONTEND_URL 접속"
echo "3. F12 > Console: CDN 경고 없음 확인"
echo "4. 기업회원 가입 테스트"
echo "5. Google Sheets에서 I열 확인"
