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
curl -s "${API_URL}?action=registerManager&name=테스트매니저_${TIMESTAMP}&phone=${MANAGER_PHONE}&email=manager${TIMESTAMP}@test.com&position=팀장&division=테스트부&branch=테스트지점" | jq '.'
echo ""

# TEST 2: 컨설턴트 회원가입
echo "=== TEST 2: 컨설턴트 회원가입 ==="
CONSULTANT_PHONE="010-99-${TIMESTAMP:5:6}"
curl -s "${API_URL}?action=registerConsultant&name=테스트컨설턴트_${TIMESTAMP}&phone=${CONSULTANT_PHONE}&email=consultant${TIMESTAMP}@test.com&position=수석&division=영업부&branch=본사" | jq '.'
echo ""

# TEST 3: 매니저 승인
echo "=== TEST 3: 매니저 승인 ==="
curl -s "${API_URL}?action=updateMemberStatus&phone=${MANAGER_PHONE}&type=manager&status=승인완료" | jq '.'
echo ""

# TEST 4: 컨설턴트 승인
echo "=== TEST 4: 컨설턴트 승인 ==="
curl -s "${API_URL}?action=updateMemberStatus&phone=${CONSULTANT_PHONE}&type=consultant&status=승인완료" | jq '.'
echo ""

# TEST 5: 매니저 로그인 (다양한 형식)
echo "=== TEST 5: 매니저 로그인 테스트 ==="
echo "5-1. 형식: 010-88-XXXXXX"
curl -s "${API_URL}?action=loginConsultant&phone=${MANAGER_PHONE}&password=12345" | jq '.'
echo ""

echo "5-2. 형식: 01088XXXXXX"
NO_DASH_PHONE=$(echo $MANAGER_PHONE | tr -d '-')
curl -s "${API_URL}?action=loginConsultant&phone=${NO_DASH_PHONE}&password=12345" | jq '.'
echo ""

# TEST 6: 컨설턴트 로그인
echo "=== TEST 6: 컨설턴트 로그인 ==="
curl -s "${API_URL}?action=loginConsultant&phone=${CONSULTANT_PHONE}&password=12345" | jq '.'
echo ""

# TEST 7: 기업회원 가입 (매니저 추천인)
echo "=== TEST 7: 기업회원 가입 (매니저 추천인) ==="
COMPANY_PHONE="010-77-${TIMESTAMP:5:6}"
curl -s "${API_URL}?action=registerCompany&companyName=테스트기업_${TIMESTAMP}&companyType=법인&referrer=테스트매니저_${TIMESTAMP}&name=대표이사&phone=${COMPANY_PHONE}&email=company${TIMESTAMP}@test.com&password=test1234" | jq '.'
echo ""

# TEST 8: JSON DB 동기화
echo "=== TEST 8: JSON DB 동기화 ==="
curl -s "${API_URL}?action=syncJson" | jq '.'
echo ""

echo "============================================"
echo "   테스트 완료!"
echo "============================================"
echo ""
echo "📊 테스트 결과 요약:"
echo "- 매니저 전화번호: ${MANAGER_PHONE}"
echo "- 컨설턴트 전화번호: ${CONSULTANT_PHONE}"
echo "- 기업회원 전화번호: ${COMPANY_PHONE}"
echo ""
echo "다음 단계:"
echo "1. Google Sheets 확인: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"
echo "2. 이메일 확인: tysagunbok@gmail.com"
echo "3. 프론트엔드 로그인 테스트: http://3.34.186.174/"
