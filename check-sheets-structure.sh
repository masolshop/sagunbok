#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec"

echo "========================================="
echo "📊 Google Sheets 구조 확인"
echo "========================================="
echo ""

# 테스트 계정으로 가입 시도 (슈퍼어드민 전화번호)
echo "🔍 테스트: 슈퍼어드민 전화번호로 기업회원 가입 시도"
echo "전화번호: 010-6352-9091"
echo ""

# 가입 시도
RESPONSE=$(curl -sL "${API_URL}?action=registerCompany&businessNumber=123-45-67890&companyName=슈퍼어드민테스트&ceoName=관리자&companyType=법인&position=대표&name=슈퍼어드민&phone=01063529091&email=admin@test.com&password=test1234&referrer=&_t=$(date +%s)")

echo "가입 응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ 슈퍼어드민 계정 가입 완료"
    echo ""
    echo "이제 로그인 테스트..."
    sleep 2
    
    # 로그인 시도
    LOGIN_RESPONSE=$(curl -sL "${API_URL}?action=loginCompany&phone=01063529091&password=test1234&_t=$(date +%s)")
    
    echo ""
    echo "로그인 응답:"
    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    if echo "$LOGIN_RESPONSE" | grep -q '"isSuperAdmin":true'; then
        echo ""
        echo "✅✅✅ 슈퍼어드민 로그인 성공!"
    fi
    
elif echo "$RESPONSE" | grep -q "이미 가입된"; then
    echo "⚠️  이미 가입된 전화번호입니다"
    echo ""
    echo "직접 로그인 시도..."
    
    LOGIN_RESPONSE=$(curl -sL "${API_URL}?action=loginCompany&phone=01063529091&password=test1234&_t=$(date +%s)")
    
    echo ""
    echo "로그인 응답:"
    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        if echo "$LOGIN_RESPONSE" | grep -q '"isSuperAdmin":true'; then
            echo ""
            echo "✅ 슈퍼어드민 플래그 확인됨!"
        else
            echo ""
            echo "⚠️  로그인은 성공했지만 슈퍼어드민 플래그가 없습니다"
            echo "   → Apps Script 코드가 제대로 배포되지 않았을 수 있습니다"
        fi
    else
        echo ""
        echo "❌ 로그인 실패 - 비밀번호가 다를 수 있습니다"
        echo ""
        echo "💡 Google Sheets에서 직접 확인 필요:"
        echo "   1. https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc"
        echo "   2. '기업회원' 시트에서 전화번호 '01063529091' 찾기"
        echo "   3. I열(비밀번호) 확인"
    fi
else
    echo "❌ 가입 실패"
fi

echo ""
echo "========================================="
echo ""
echo "📌 중요 체크리스트:"
echo ""
echo "1️⃣ Apps Script 배포 확인:"
echo "   - 배포 관리 → 수정 → 새 버전 선택했는지"
echo "   - 저장 후 배포 버튼 클릭했는지"
echo ""
echo "2️⃣ Google Sheets 구조 확인:"
echo "   - 기업회원 시트 열 순서:"
echo "     A:사업자번호 B:회사명 C:대표자명 D:기업회원분류"
echo "     E:직함 F:이름 G:전화번호 H:이메일"
echo "     I:비밀번호 J:가입일 K:승인여부 L:추천인"
echo ""
echo "3️⃣ 로그 시트 확인:"
echo "   - 최근 로그에서 디버그 정보 확인"
echo "   - 슈퍼어드민 체크 로그 있는지 확인"
echo ""
echo "========================================="
