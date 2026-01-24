#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec"

echo "=========================================="
echo "✅ 사근복 AI v6.2.3 최종 테스트"
echo "=========================================="
echo ""

# TEST 1: 매니저 로그인 성공
echo "TEST 1: 매니저 로그인 (010-1111-9999)"
RESPONSE=$(curl -L -s "${API_URL}?action=loginConsultant&phone=010-1111-9999&password=12345")
echo "$RESPONSE" | jq '.'
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 성공: 매니저 로그인"
else
  echo "❌ 실패: 매니저 로그인"
fi
echo ""

# TEST 2: 컨설턴트 로그인 성공
echo "TEST 2: 컨설턴트 로그인 (010-2222-9999)"
RESPONSE=$(curl -L -s "${API_URL}?action=loginConsultant&phone=010-2222-9999&password=12345")
echo "$RESPONSE" | jq '.'
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 성공: 컨설턴트 로그인"
else
  echo "❌ 실패: 컨설턴트 로그인"
fi
echo ""

# TEST 3: 잘못된 전화번호 (normalizedPhone 오류 수정 확인)
echo "TEST 3: 잘못된 전화번호 (010-9999-9999) - normalizedPhone 오류 수정 확인"
RESPONSE=$(curl -L -s "${API_URL}?action=loginConsultant&phone=010-9999-9999&password=12345")
echo "$RESPONSE" | jq '.'
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
ERROR=$(echo "$RESPONSE" | jq -r '.error')
if [ "$SUCCESS" = "false" ] && [ "$ERROR" = "등록되지 않은 전화번호입니다." ]; then
  echo "✅ 성공: 정상적인 오류 메시지 (normalizedPhone 오류 없음)"
else
  echo "❌ 실패: 예상과 다른 응답"
fi
echo ""

# TEST 4: 하이픈 없는 전화번호
echo "TEST 4: 하이픈 없는 전화번호 (01011119999)"
RESPONSE=$(curl -L -s "${API_URL}?action=loginConsultant&phone=01011119999&password=12345")
echo "$RESPONSE" | jq '.'
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 성공: 전화번호 정규화 작동"
else
  echo "❌ 실패: 전화번호 정규화"
fi
echo ""

# TEST 5: 기업회원 로그인
echo "TEST 5: 기업회원 로그인 테스트"
RESPONSE=$(curl -L -s "${API_URL}?action=loginCompany&phone=010-77-000836&password=12345")
echo "$RESPONSE" | jq '.'
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 성공: 기업회원 로그인"
else
  echo "⚠️  주의: 기업회원 로그인 (테스트 계정 없을 수 있음)"
fi
echo ""

echo "=========================================="
echo "🎉 테스트 완료!"
echo "=========================================="
echo ""
echo "배포 정보:"
echo "- API URL: $API_URL"
echo "- 버전: v6.2.3"
echo "- 수정 사항: normalizedPhone 오류 수정"
echo "- 프론트엔드: http://3.34.186.174/"
echo ""
