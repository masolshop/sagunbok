/**
 * 절세계산기 AI 분석 서비스
 * 기업/컨설턴트 유형에 따라 적절한 프롬프트로 Gemini API 호출
 */

import prompts from '../ai-prompts-config.json';

interface TaxAnalysisRequest {
  userType: 'company' | 'consultant';
  calculationData: {
    company_name: string;
    business_number?: string;
    industry?: string;
    company_type?: string;
    total_employees: number;
    ceo_annual_salary: number;
    ceo_net_annual: number;
    ceo_tax_rate: number;
    total_labor_cost: number;
    employees_total_gross: number;
    revenue: number;
    net_income_before_tax: number;
    corporate_tax: number;
    corporate_tax_rate: number;
    welfare_current?: number;
    welfare_potential: number;
    welfare_saving: number;
    rd_current?: number;
    rd_potential: number;
    rd_saving: number;
    pension_current?: number;
    pension_potential: number;
    pension_saving: number;
    employee_structure?: string;
  };
}

interface TaxAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
}

/**
 * 사용자 유형에 따른 프롬프트 가져오기
 */
const getPromptConfig = (userType: 'company' | 'consultant') => {
  return userType === 'company' 
    ? prompts.company_ceo_prompt 
    : prompts.consultant_expert_prompt;
};

/**
 * 프롬프트 템플릿에 데이터 삽입
 */
const fillPromptTemplate = (template: string, data: any): string => {
  let filled = template;
  
  // 템플릿 변수를 실제 데이터로 치환
  Object.keys(data).forEach(key => {
    const value = data[key];
    const regex = new RegExp(`\\{${key}(?::,)?\\}`, 'g');
    
    if (typeof value === 'number') {
      // 숫자는 천단위 콤마 형식으로
      filled = filled.replace(regex, value.toLocaleString());
    } else {
      filled = filled.replace(regex, value || '정보 없음');
    }
  });
  
  return filled;
};

/**
 * Gemini API 호출
 */
const callGeminiAPI = async (apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API 호출 실패');
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
};

/**
 * 절세 분석 실행
 */
export const analyzeTaxSavings = async (request: TaxAnalysisRequest): Promise<TaxAnalysisResponse> => {
  try {
    // 1. API 키 가져오기
    const apiKey = localStorage.getItem('gemini_api_key') || sessionStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
      return {
        success: false,
        error: 'API 키가 설정되지 않았습니다. 우측 상단 ⚙️ 버튼에서 Gemini API 키를 설정해주세요.'
      };
    }

    // 2. 프롬프트 설정 가져오기
    const promptConfig = getPromptConfig(request.userType);
    
    // 3. 사용자 프롬프트 생성
    const userPrompt = fillPromptTemplate(
      promptConfig.user_prompt_template,
      request.calculationData
    );

    // 4. Gemini API 호출
    console.log('🤖 AI 분석 시작:', {
      userType: request.userType,
      promptLength: userPrompt.length,
      company: request.calculationData.company_name
    });

    const analysis = await callGeminiAPI(
      apiKey,
      promptConfig.system_prompt,
      userPrompt
    );

    console.log('✅ AI 분석 완료:', {
      responseLength: analysis.length
    });

    return {
      success: true,
      analysis
    };

  } catch (error: any) {
    console.error('❌ AI 분석 오류:', error);
    
    return {
      success: false,
      error: error.message || 'AI 분석 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 계산 데이터를 분석 요청 형식으로 변환
 */
export const convertCalculationToAnalysisRequest = (
  userType: 'company' | 'consultant',
  companyContext: any,
  calculationResult: any,
  currentUser: any
): TaxAnalysisRequest => {
  return {
    userType,
    calculationData: {
      company_name: companyContext.companyName || currentUser?.companyName || '미입력',
      business_number: currentUser?.businessNumber || '',
      industry: '정보없음', // TODO: 추후 업종 필드 추가
      company_type: currentUser?.companyType || '법인',
      total_employees: companyContext.employeeCount || 1,
      ceo_annual_salary: 0, // TODO: CEO 급여 데이터 연동
      ceo_net_annual: 0,
      ceo_tax_rate: 0,
      total_labor_cost: 0,
      employees_total_gross: 0,
      revenue: 0,
      net_income_before_tax: 0,
      corporate_tax: calculationResult?.result?.taxSaving || 0,
      corporate_tax_rate: Number(calculationResult?.inputs?.corp_taxRate || 19),
      welfare_potential: calculationResult?.result?.totalConvertedAmount || 0,
      welfare_saving: calculationResult?.result?.totalSaving || 0,
      rd_potential: 0,
      rd_saving: 0,
      pension_potential: 0,
      pension_saving: 0,
      employee_structure: `전체 ${companyContext.employeeCount || 1}명`
    }
  };
};
