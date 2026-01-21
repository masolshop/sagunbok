const https = require('https');

const url = 'https://script.google.com/macros/s/AKfycbx7neSx45Xsu-bd0KoU6EjTdv8EJOfuoM1v9ck3tAFcR4HB-eDR_J-YO58KPZ-aOLua/exec';

const data = JSON.stringify({
    action: 'registerCompany',
    companyName: 'AI테스트병원',
    companyType: '병의원개인사업자',
    name: 'AI테스터',
    phone: '01099887766',
    email: 'ai-test@hospital.com',
    password: 'test1234',
    referrer: '김철수'
});

console.log('🧪 기업회원 가입 테스트 시작...');
console.log('요청 데이터:', JSON.parse(data));
console.log('');

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(url, options, (res) => {
    console.log(`응답 상태 코드: ${res.statusCode}`);
    console.log(`응답 헤더:`, res.headers);
    
    let body = '';
    
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('\n📊 응답 본문:');
        try {
            const result = JSON.parse(body);
            console.log(JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log('\n✅ 회원가입 성공!');
                console.log('메시지:', result.message);
            } else {
                console.log('\n❌ 회원가입 실패!');
                console.log('오류:', result.error);
            }
        } catch (e) {
            console.log('JSON 파싱 실패, 원본 응답:');
            console.log(body.substring(0, 500));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ 요청 오류:', error);
});

req.write(data);
req.end();
