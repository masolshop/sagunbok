import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AI 절세 분석 컨트롤러
 * GPT-4를 사용하여 2가지 관점의 절세 분석 제공
 */

// AI 프롬프트 설정 로드
// 절대 경로 사용하거나 상대 경로를 명확히 처리
let promptConfig;
let promptConfigPath;

try {
  // 먼저 현재 디렉토리 기준으로 시도
  promptConfigPath = path.join(__dirname, '../ai-prompts-config.json');
  let fullPath = path.resolve(promptConfigPath);
  
  console.log('[Tax Analysis] 🔍 디버깅 정보:');
  console.log('[Tax Analysis] __dirname:', __dirname);
  console.log('[Tax Analysis] promptConfigPath:', promptConfigPath);
  console.log('[Tax Analysis] fullPath (resolve):', fullPath);
  
  // 파일이 없으면 다른 경로 시도
  if (!fs.existsSync(fullPath)) {
    console.log('[Tax Analysis] ⚠️  첫 번째 경로에 파일 없음, 대체 경로 시도...');
    // PM2 cwd 기준으로 시도
    promptConfigPath = path.join(process.cwd(), '../ai-prompts-config.json');
    fullPath = path.resolve(promptConfigPath);
    console.log('[Tax Analysis] process.cwd():', process.cwd());
    console.log('[Tax Analysis] 대체 fullPath:', fullPath);
  }
  
  promptConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  console.log('[Tax Analysis] ✅ 프롬프트 설정 로드 성공!');
} catch (error) {
  console.error('[Tax Analysis] ❌ 프롬프트 설정 로드 실패:', error.message);
  promptConfig = null;
}

/**
 * 시뮬레이션 데이터를 프롬프트에 맞게 포맷팅
 */
function formatSimulationData(simulationData, promptType) {
  const {
    company_info,
    simulation_data,
    net_pay_analysis,
    tax_optimization_opportunities
  } = simulationData;

  const ceo = net_pay_analysis.ceo;
  const corporate = simulation_data.corporate_tax_scenario;
  
  // 직원 구조 포맷팅
  const employeeStructure = simulation_data.employees
    .map(emp => `  ${emp.position}: ${emp.count}명 x ${emp.annual_salary.toLocaleString()}원`)
    .join('\n');

  // CEO 4대보험 합계
  const ceoInsurance = ceo.national_pension + ceo.health_insurance + 
                      ceo.long_term_care + ceo.employment_insurance;
  const ceoIncomeTax = ceo.income_tax + ceo.local_tax;

  const commonData = {
    company_name: company_info.company_name,
    business_number: company_info.business_number || '미입력',
    industry: company_info.industry,
    company_type: company_info.company_type,
    total_employees: simulation_data.total_employees,
    ceo_annual_salary: simulation_data.ceo_info.annual_salary,
    ceo_net_annual: ceo.net_annual,
    ceo_net_monthly: ceo.net_monthly,
    ceo_tax_rate: (ceo.actual_tax_rate * 100).toFixed(1),
    total_labor_cost: simulation_data.total_labor_cost,
    employees_total_gross: net_pay_analysis.employees_summary.total_gross,
    revenue: corporate.revenue,
    operating_expenses: corporate.operating_expenses,
    net_income_before_tax: corporate.net_income_before_tax,
    corporate_tax: corporate.corporate_tax,
    corporate_tax_rate: (corporate.corporate_tax_rate * 100).toFixed(0),
    welfare_current: tax_optimization_opportunities.welfare_benefits.current,
    welfare_potential: tax_optimization_opportunities.welfare_benefits.tax_saving,
    rd_current: tax_optimization_opportunities.research_deduction.current,
    rd_potential: tax_optimization_opportunities.research_deduction.tax_saving,
    pension_current: tax_optimization_opportunities.retirement_pension.current,
    pension_potential: tax_optimization_opportunities.retirement_pension.tax_saving,
  };

  if (promptType === 'consultant') {
    return {
      ...commonData,
      employee_structure: employeeStructure,
      ceo_total_deductions: ceo.total_deductions,
      ceo_income_tax: ceoIncomeTax,
      ceo_insurance: ceoInsurance,
      avg_employee_tax_rate: (net_pay_analysis.employees_summary.average_tax_rate * 100).toFixed(1),
      welfare_saving: tax_optimization_opportunities.welfare_benefits.tax_saving,
      rd_saving: tax_optimization_opportunities.research_deduction.tax_saving,
      pension_saving: tax_optimization_opportunities.retirement_pension.tax_saving,
    };
  }

  return commonData;
}

/**
 * GPT API 호출
 */
async function callGPTAPI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',  // 최신 GPT-4 Turbo 모델
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60초 타임아웃
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('[GPT API] 호출 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * CEO 관점 절세 분석
 */
export const analyzeTaxForCEO = async (req, res) => {
  try {
    const simulationData = req.body;

    if (!simulationData || !simulationData.company_info) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATA',
        message: '시뮬레이션 데이터가 필요합니다.'
      });
    }

    console.log(`[Tax Analysis CEO] 분석 시작: ${simulationData.company_info.company_name}`);

    // 프롬프트 설정 확인
    if (!promptConfig) {
      return res.status(500).json({
        success: false,
        error: 'CONFIG_ERROR',
        message: '프롬프트 설정을 로드할 수 없습니다.'
      });
    }

    // 데이터 포맷팅
    const formattedData = formatSimulationData(simulationData, 'ceo');
    
    // 프롬프트 생성
    const config = promptConfig.company_ceo_prompt;
    let userPrompt = config.user_prompt_template;
    
    // 템플릿 변수 치환
    Object.keys(formattedData).forEach(key => {
      const regex = new RegExp(`{${key}(?::,)?}`, 'g');
      userPrompt = userPrompt.replace(regex, formattedData[key].toLocaleString());
    });

    // GPT API 호출
    const analysis = await callGPTAPI(config.system_prompt, userPrompt);

    console.log(`[Tax Analysis CEO] 분석 완료: ${simulationData.company_info.company_name}`);

    return res.json({
      success: true,
      analysis_type: 'ceo',
      company_name: simulationData.company_info.company_name,
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tax Analysis CEO] 에러:', error);
    return res.status(500).json({
      success: false,
      error: 'ANALYSIS_FAILED',
      message: error.message
    });
  }
};

/**
 * 컨설턴트 관점 절세 분석
 */
export const analyzeTaxForConsultant = async (req, res) => {
  try {
    const simulationData = req.body;

    if (!simulationData || !simulationData.company_info) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATA',
        message: '시뮬레이션 데이터가 필요합니다.'
      });
    }

    console.log(`[Tax Analysis Consultant] 분석 시작: ${simulationData.company_info.company_name}`);

    // 프롬프트 설정 확인
    if (!promptConfig) {
      return res.status(500).json({
        success: false,
        error: 'CONFIG_ERROR',
        message: '프롬프트 설정을 로드할 수 없습니다.'
      });
    }

    // 데이터 포맷팅
    const formattedData = formatSimulationData(simulationData, 'consultant');
    
    // 프롬프트 생성
    const config = promptConfig.consultant_expert_prompt;
    let userPrompt = config.user_prompt_template;
    
    // 템플릿 변수 치환
    Object.keys(formattedData).forEach(key => {
      const regex = new RegExp(`{${key}(?::,)?}`, 'g');
      userPrompt = userPrompt.replace(regex, 
        typeof formattedData[key] === 'number' ? formattedData[key].toLocaleString() : formattedData[key]
      );
    });

    // GPT API 호출
    const analysis = await callGPTAPI(config.system_prompt, userPrompt);

    console.log(`[Tax Analysis Consultant] 분석 완료: ${simulationData.company_info.company_name}`);

    return res.json({
      success: true,
      analysis_type: 'consultant',
      company_name: simulationData.company_info.company_name,
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Tax Analysis Consultant] 에러:', error);
    return res.status(500).json({
      success: false,
      error: 'ANALYSIS_FAILED',
      message: error.message
    });
  }
};
