#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec"
TIMESTAMP=$(date +%s)

echo "============================================"
echo "   사근복 AI v6.2.2 종합 시스템 테스트"
echo "============================================"
echo ""

# TEST 1: 매니저 회원가입
echo "=== TEST 1: 매니저 회원가입 ==="
MANAGER_PHONE="010-88-${TIMESTAMP:5:6}"
echo "전화번호: ${MANAGER_PHONE}"
curl -s "${API_URL}?action=registerManager&name=테스트매니저_${TIMESTAMP}&phone=${MANAGER_PHONE}&email=manager${TIMESTAMP}@test.com&position=팀장&division=테스트부&branch=테스트지점"
echo ""
echo ""

# TEST 2: 컨설턴트 회원가입
echo "=== TEST 2: 컨설턴트 회원가입 ==="
CONSULTANT_PHONE="010-99-${TIMESTAMP:5:6}"
echo "전화번호: ${CONSULTANT_PHONE}"
curl -s "${API_URL}?action=registerConsultant&name=테스트컨설턴트_${TIMESTAMP}&phone=${CONSULTANT_PHONE}&email=consultant${TIMESTAMP}@test.com&position=수석&division=영업부&branch=본사"
echo ""
echo ""

# TEST 3: 매니저 승인
echo "=== TEST 3: 매니저 승인 ==="
curl -s "${API_URL}?action=updateMemberStatus&phone=${MANAGER_PHONE}&type=manager&status=승인완료"
echo ""
echo ""

# TEST 4: 컨설턴트 승인
echo "=== TEST 4: 컨설턴트 승인 ==="
curl -s "${API_URL}?action=updateMemberStatus&phone=${CONSULTANT_PHONE}&type=consultant&status=승인완료"
echo ""
echo ""

# TEST 5: 매니저 로그인 (하이픈 포함)
echo "=== TEST 5: 매니저 로그인 (010-88-XXXXXX) ==="
curl -s "${API_URL}?action=loginConsultant&phone=${MANAGER_PHONE}&password=12345"
echo ""
echo ""

# TEST 6: 매니저 로그인 (하이픈 제거)
echo "=== TEST 6: 매니저 로그인 (01088XXXXXX) ==="
NO_DASH_PHONE=$(echo $MANAGER_PHONE | tr -d '-')
curl -s "${API_URL}?action=loginConsultant&phone=${NO_DASH_PHONE}&password=12345"
echo ""
echo ""

# TEST 7: 컨설턴트 로그인
echo "=== TEST 7: 컨설턴트 로그인 ==="
curl -s "${API_URL}?action=loginConsultant&phone=${CONSULTANT_PHONE}&password=12345"
echo ""
echo ""

echo "============================================"
echo "   테스트 완료!"
echo "============================================"
echo ""
echo "생성된 테스트 계정:"
echo "- 매니저: ${MANAGER_PHONE} / 12345"
echo "- 컨설턴트: ${CONSULTANT_PHONE} / 12345"
echo ""
echo "프론트엔드 로그인 테스트: http://3.34.186.174/"
