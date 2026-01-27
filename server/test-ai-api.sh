#!/bin/bash

echo "=================================="
echo "1. API Key 저장 테스트"
echo "=================================="
curl -X POST http://localhost:3002/api/consultant/api-key \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-test-12345"
  }' | jq .

echo -e "\n=================================="
echo "2. API Key 상태 확인 테스트"
echo "=================================="
curl -X GET http://localhost:3002/api/consultant/api-key/status \
  -H "Authorization: Bearer test-token" | jq .

echo -e "\n=================================="
echo "3. AI 실행 테스트 (SUMMARY)"
echo "=================================="
curl -X POST http://localhost:3002/api/ai/run \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "CORP_TAX",
    "action": "SUMMARY",
    "calcResult": {
      "currentTax": 50000000,
      "optimizedTax": 35000000,
      "savings": 15000000
    },
    "caseMeta": {
      "companyName": "테스트주식회사",
      "region": "서울",
      "employeeCount": 20
    }
  }' | jq .

