#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec"

echo "========================================="
echo "🧪 슈퍼어드민 로그인 테스트"
echo "========================================="
echo ""

# 테스트 1: 슈퍼어드민 로그인
echo "📱 테스트 1: 슈퍼어드민 로그인 (010-6352-9091)"
echo "Request: action=loginCompany&phone=01063529091&password=test1234"
echo ""

RESPONSE=$(curl -s "${API_URL}?action=loginCompany&phone=01063529091&password=test1234&_t=$(date +%s)")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 성공 여부 확인
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ 슈퍼어드민 로그인 성공!"
    
    # isSuperAdmin 플래그 확인
    if echo "$RESPONSE" | grep -q '"isSuperAdmin":true'; then
        echo "✅ isSuperAdmin 플래그 확인됨"
    else
        echo "⚠️  isSuperAdmin 플래그가 없습니다"
    fi
else
    echo "❌ 슈퍼어드민 로그인 실패"
fi

echo ""
echo "========================================="
echo ""

# 테스트 2: 일반 전화번호 형식 테스트
echo "📱 테스트 2: 하이픈 포함 형식 (010-6352-9091)"
echo "Request: action=loginCompany&phone=010-6352-9091&password=test1234"
echo ""

RESPONSE2=$(curl -s "${API_URL}?action=loginCompany&phone=010-6352-9091&password=test1234&_t=$(date +%s)")

echo "Response:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

if echo "$RESPONSE2" | grep -q '"success":true'; then
    echo "✅ 하이픈 포함 형식도 정상 작동!"
else
    echo "❌ 하이픈 포함 형식 로그인 실패"
fi

echo ""
echo "========================================="
echo "테스트 완료!"
echo "========================================="
