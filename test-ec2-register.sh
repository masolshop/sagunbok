#!/bin/bash

echo "=== EC2 회원가입 테스트 시작 ==="
echo ""

# 테스트 1: 기업회원 가입 (새로운 계정)
echo "📋 테스트 1: 기업회원 신규 가입"
TIMESTAMP=$(date +%s)
curl -s -X POST http://3.34.186.174/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "companyName": "EC2테스트회사'$TIMESTAMP'",
    "companyType": "기업",
    "referrer": "이종근",
    "name": "EC2테스터",
    "phone": "0109999'$TIMESTAMP'",
    "email": "ec2test'$TIMESTAMP'@example.com",
    "password": "test1234"
  }' | python3 -m json.tool 2>/dev/null || echo "JSON 파싱 실패"

echo ""
echo "---"
echo ""

# 테스트 2: 기존 계정으로 로그인
echo "📋 테스트 2: 기존 기업회원 로그인"
curl -s -X POST http://3.34.186.174/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "loginCompany",
    "phone": "01099887766",
    "password": "test1234"
  }' | python3 -m json.tool 2>/dev/null || echo "JSON 파싱 실패"

echo ""
echo "---"
echo ""

# 테스트 3: 사근복 컨설턴트 회원가입
echo "📋 테스트 3: 사근복 컨설턴트 신규 가입"
curl -s -X POST http://3.34.186.174/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerConsultant",
    "name": "EC2컨설턴트'$TIMESTAMP'",
    "phone": "0108888'$TIMESTAMP'",
    "email": "ec2consultant'$TIMESTAMP'@sagunbok.com",
    "position": "수석 컨설턴트",
    "businessUnit": "EC2테스트팀",
    "branchOffice": "서울본사",
    "password": "consultant1234"
  }' | python3 -m json.tool 2>/dev/null || echo "JSON 파싱 실패"

echo ""
echo "---"
echo ""

# 테스트 4: 잘못된 추천인으로 가입 시도
echo "📋 테스트 4: 잘못된 추천인으로 기업회원 가입 시도 (실패 예상)"
curl -s -X POST http://3.34.186.174/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "companyName": "실패테스트회사",
    "companyType": "병원",
    "referrer": "존재하지않는추천인",
    "name": "실패테스터",
    "phone": "01077777777",
    "email": "fail@example.com",
    "password": "test1234"
  }' | python3 -m json.tool 2>/dev/null || echo "JSON 파싱 실패"

echo ""
echo "=== EC2 회원가입 테스트 완료 ==="
