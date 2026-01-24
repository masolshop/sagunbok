#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec"

echo "=========================================="
echo "사근복 AI v6.2.3 로그인 테스트"
echo "=========================================="
echo ""

# TEST 1: 매니저 로그인 (010-1111-9999)
echo "TEST 1: 매니저 로그인 테스트"
echo "전화번호: 010-1111-9999 / 비밀번호: 12345"
RESPONSE=$(curl -s "${API_URL}?action=loginConsultant&phone=010-1111-9999&password=12345")
echo "응답: $RESPONSE"
echo ""

# TEST 2: 컨설턴트 로그인 (010-2222-9999)
echo "TEST 2: 컨설턴트 로그인 테스트"
echo "전화번호: 010-2222-9999 / 비밀번호: 12345"
RESPONSE=$(curl -s "${API_URL}?action=loginConsultant&phone=010-2222-9999&password=12345")
echo "응답: $RESPONSE"
echo ""

# TEST 3: 잘못된 전화번호 (normalizedPhone 오류 체크)
echo "TEST 3: 잘못된 전화번호 테스트 (오류 수정 확인)"
echo "전화번호: 010-9999-9999 / 비밀번호: 12345"
RESPONSE=$(curl -s "${API_URL}?action=loginConsultant&phone=010-9999-9999&password=12345")
echo "응답: $RESPONSE"
echo ""

# TEST 4: 하이픈 없는 전화번호
echo "TEST 4: 하이픈 없는 전화번호 (정규화 테스트)"
echo "전화번호: 01011119999 / 비밀번호: 12345"
RESPONSE=$(curl -s "${API_URL}?action=loginConsultant&phone=01011119999&password=12345")
echo "응답: $RESPONSE"
echo ""

echo "=========================================="
echo "테스트 완료!"
echo "=========================================="
