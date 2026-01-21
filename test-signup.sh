#!/bin/bash
curl -v -L -X POST 'https://script.google.com/macros/s/AKfycbyHANShj0GyMn60aTv-6FnYMblprl3IidCBPrKfj9vgIR4Nh3cJ5VOrT3ru7zA8s02xNg/exec' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "action": "registerCompany",
    "companyName": "테스트회사",
    "companyType": "법인",
    "referrer": "이종근",
    "name": "홍길동",
    "phone": "01099887766",
    "email": "test@company.com",
    "password": "test1234"
  }'
