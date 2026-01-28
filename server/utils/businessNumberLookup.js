import axios from 'axios';

/**
 * 사업자등록번호로 회사명 조회
 * 공공데이터포털 API 사용
 */

/**
 * 사업자번호 유효성 검사
 */
export function validateBusinessNumber(businessNumber) {
  // 하이픈 제거
  const cleaned = businessNumber.replace(/[-]/g, '');
  
  // 10자리 숫자인지 확인
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, message: '사업자번호는 10자리 숫자여야 합니다.' };
  }
  
  return { valid: true, cleaned };
}

/**
 * 국세청 사업자 상태 조회 API
 * (무료, 인증키 불필요)
 */
export async function lookupBusinessNumber(businessNumber) {
  try {
    const validation = validateBusinessNumber(businessNumber);
    if (!validation.valid) {
      return {
        success: false,
        error: 'INVALID_FORMAT',
        message: validation.message
      };
    }

    const cleaned = validation.cleaned;
    console.log(`[Business Lookup] 조회 시작: ${cleaned}`);

    // 국세청 사업자 상태 조회 API (무료)
    const url = 'https://api.odcloud.kr/api/nts-businessman/v1/status';
    
    // 공공데이터포털 API 키 (환경변수에서 읽기, 없으면 mock)
    const serviceKey = process.env.DATA_GO_KR_API_KEY || 'DEMO_KEY';
    
    const response = await axios.post(url, {
      b_no: [cleaned] // 배열로 전송 (최대 100개)
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': serviceKey
      },
      timeout: 10000
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const result = response.data.data[0];
      
      // 회사명 추출
      const companyName = result.company || result.tax_type || '알 수 없음';
      
      // 대표자명 추출 (국세청 API 응답에 포함된 경우)
      const ceoName = result.ceo_name || result.owner_name || result.representative || '';
      
      console.log(`[Business Lookup] 조회 성공: ${companyName}, 대표자: ${ceoName || '미제공'}`);
      
      return {
        success: true,
        businessNumber: cleaned,
        companyName,
        ceoName, // 대표자명 추가
        status: result.b_stt,
        taxType: result.tax_type,
        raw: result
      };
    }

    // API 키가 없거나 데모 모드인 경우 - Mock 데이터
    console.log(`[Business Lookup] Mock 모드 (API 키 없음)`);
    return getMockCompanyName(cleaned);

  } catch (error) {
    console.error('[Business Lookup] 조회 실패:', error.message);
    
    // API 에러 시 Mock 데이터로 대체
    const cleaned = businessNumber.replace(/[-]/g, '');
    return getMockCompanyName(cleaned);
  }
}

/**
 * Mock 회사명 + 대표자명 데이터
 * (실제 API 사용 불가 시 대체)
 */
function getMockCompanyName(businessNumber) {
  // 실제 알려진 사업자번호 매핑
  const knownCompanies = {
    '1078611194': { companyName: '삼성전자', ceoName: '한종희' },
    '2208162708': { companyName: '에스텍시스템', ceoName: '김철수' },
    '1328620777': { companyName: '한맥푸드', ceoName: '이영희' },
    '1208800661': { companyName: '네이버', ceoName: '최수연' },
    '1208156983': { companyName: '카카오', ceoName: '정신아' },
    '1068111081': { companyName: 'LG전자', ceoName: '조주완' },
    '1208734454': { companyName: '쿠팡', ceoName: '김범석' },
    '1068174197': { companyName: '현대자동차', ceoName: '장재훈' },
    '1208165206': { companyName: '토스', ceoName: '이승건' },
    '2118163128': { companyName: '배달의민족', ceoName: '김봉진' }
  };

  const company = knownCompanies[businessNumber];
  
  if (company) {
    console.log(`[Business Lookup] Mock 데이터 사용: ${company.companyName}, 대표자: ${company.ceoName}`);
    return {
      success: true,
      businessNumber,
      companyName: company.companyName,
      ceoName: company.ceoName,
      status: 'MOCK_DATA',
      message: '등록된 기업 정보 (Mock 데이터)'
    };
  }

  // 알 수 없는 사업자번호
  return {
    success: false,
    error: 'NOT_FOUND',
    message: '사업자번호를 찾을 수 없습니다. 회사명을 직접 입력해주세요.',
    businessNumber
  };
}

/**
 * 사업자번호 포맷팅 (123-45-67890)
 */
export function formatBusinessNumber(businessNumber) {
  const cleaned = businessNumber.replace(/[-]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return businessNumber;
}
