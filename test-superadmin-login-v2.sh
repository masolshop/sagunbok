#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec"

echo "========================================="
echo "🧪 슈퍼어드민 로그인 테스트 (v7.2.2)"
echo "========================================="
echo ""

# 테스트 1: 슈퍼어드민 로그인 (리다이렉트 따라가기)
echo "📱 테스트 1: 슈퍼어드민 로그인 (01063529091)"
echo ""

RESPONSE=$(curl -sL "${API_URL}?action=loginCompany&phone=01063529091&password=test1234&_t=$(date +%s)")

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
    
    # 사용자 정보 추출
    echo ""
    echo "📋 사용자 정보:"
    echo "$RESPONSE" | jq -r '.user | "회사명: \(.companyName // "N/A")\n이름: \(.name // "N/A")\n전화번호: \(.phone // "N/A")\n슈퍼어드민: \(.isSuperAdmin // false)"' 2>/dev/null
    
else
    echo "❌ 슈퍼어드민 로그인 실패"
    echo ""
    echo "📋 에러 정보:"
    echo "$RESPONSE" | jq -r '.message // "알 수 없는 오류"' 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "========================================="
echo ""

# 테스트 2: 하이픈 포함 형식
echo "📱 테스트 2: 하이픈 포함 형식 (010-6352-9091)"
echo ""

RESPONSE2=$(curl -sL "${API_URL}?action=loginCompany&phone=010-6352-9091&password=test1234&_t=$(date +%s)")

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
