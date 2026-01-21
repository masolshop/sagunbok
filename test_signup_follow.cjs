const https = require('https');
const { URL } = require('url');

function followRedirect(urlString, data, depth = 0) {
    if (depth > 5) {
        console.log('❌ 리다이렉트가 너무 많습니다.');
        return;
    }

    const parsedUrl = new URL(urlString);
    
    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    console.log(`\n📍 요청 ${depth + 1}: ${urlString.substring(0, 80)}...`);

    const req = https.request(options, (res) => {
        console.log(`  상태 코드: ${res.statusCode}`);
        
        if (res.statusCode === 302 || res.statusCode === 301) {
            const redirectUrl = res.headers.location;
            console.log(`  ↪️ 리다이렉트: ${redirectUrl.substring(0, 80)}...`);
            
            // 리다이렉트 URL로 GET 요청
            https.get(redirectUrl, (redirectRes) => {
                let body = '';
                
                redirectRes.on('data', (chunk) => {
                    body += chunk;
                });
                
                redirectRes.on('end', () => {
                    console.log('\n✅ 최종 응답 수신');
                    try {
                        const result = JSON.parse(body);
                        console.log('\n📊 응답 결과:');
                        console.log(JSON.stringify(result, null, 2));
                        
                        if (result.success) {
                            console.log('\n🎉 회원가입 성공!');
                            console.log('메시지:', result.message);
                        } else {
                            console.log('\n❌ 회원가입 실패!');
                            console.log('오류:', result.error);
                        }
                    } catch (e) {
                        console.log('❌ JSON 파싱 실패');
                        console.log('응답 일부:', body.substring(0, 500));
                    }
                });
            }).on('error', (err) => {
                console.error('❌ 리다이렉트 요청 오류:', err.message);
            });
        } else {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    console.log('\n📊 응답 결과:');
                    console.log(JSON.stringify(result, null, 2));
                    
                    if (result.success) {
                        console.log('\n🎉 회원가입 성공!');
                    } else {
                        console.log('\n❌ 회원가입 실패!');
                    }
                } catch (e) {
                    console.log('❌ JSON 파싱 실패');
                    console.log('응답:', body.substring(0, 300));
                }
            });
        }
    });

    req.on('error', (error) => {
        console.error('❌ 요청 오류:', error.message);
    });

    req.write(data);
    req.end();
}

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
console.log('\n📋 요청 데이터:');
console.log(JSON.parse(data));

followRedirect(url, data);
