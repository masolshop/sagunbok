import React, { useState, useEffect, useRef } from "react";
import ExtractedFieldsTable from "../components/ExtractedFieldsTable";
import ReactMarkdown from "react-markdown";

/**
 * CretopReportPage.tsx
 * CRETOP 기업분석 리포트 생성 페이지
 * - PDF 업로드 + GPT/Claude 자동 분석
 * - 절세계산기 스타일 UI
 */

const API_BASE_URL = "https://sagunbok.com";
const MODULE = "CRETOP_REPORT" as const;
const ACTION = "FULL_REPORT" as const;

// 💰 숫자 포맷팅 유틸리티 (천단위 콤마 + 한글 표기)
function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0원';
  
  // 천단위 콤마
  const formatted = num.toLocaleString('ko-KR');
  
  // 한글 단위 변환
  let koreanUnit = '';
  if (num >= 1_000_000_000_000) {
    koreanUnit = `(${(num / 1_000_000_000_000).toFixed(1)}조원)`;
  } else if (num >= 100_000_000) {
    koreanUnit = `(${(num / 100_000_000).toFixed(1)}억원)`;
  } else if (num >= 10_000) {
    koreanUnit = `(${(num / 10_000).toFixed(1)}만원)`;
  }
  
  return `${formatted}원 ${koreanUnit}`.trim();
}

type ApiKeyStatus = {
  ok: boolean;
  keys?: {
    claude: boolean;
    gpt: boolean;
    gemini: boolean;
  };
};

type CretopReport = {
  report_meta: {
    company_name: string;
    statement_period: string;
    currency_unit: string;
    generated_at: string;
    data_sources: string[];
    confidence: {
      overall: number;
      missing_critical_data: string[];
    };
  };
  summary_one_page: {
    headline: string;
    key_findings: Array<{ title: string; impact: string; evidence: string }>;
    top_risks: Array<{ title: string; severity: string; evidence: string; next_action: string }>;
    top_opportunities: Array<{ title: string; priority: string; evidence: string; next_action: string }>;
  };
  executive_overview: {
    overall_grade: string;
    diagnosis_lines: string[];
    improvement_points: Array<{ point: string; why: string; how: string }>;
  };
  issue_check: {
    table: Array<{
      item: string;
      current_value: string;
      status: string;
      comment: string;
      required_more_data: string[];
    }>;
    flags: Array<{ flag: string; severity: string; reason: string }>;
  };
  lifecycle: {
    stage: string;
    basis: string[];
    stage_tasks: Array<{ task: string; priority: string; owner: string }>;
  };
  financial_summary: any;
  ratio_analysis: any;
  sagunbok_consulting: any;
  gongunbok_applicability: any;
  roadmap: {
    days_30_60_90: Array<{ task: string; owner: string; difficulty: string; expected_impact: string }>;
    month_6: Array<{ task: string; owner: string; difficulty: string; expected_impact: string }>;
    month_12: Array<{ task: string; owner: string; difficulty: string; expected_impact: string }>;
  };
  additional_data_request: {
    priority_1: string[];
    priority_2: string[];
    priority_3: string[];
  };
  disclaimer: {
    lines: string[];
  };
};

function getAuthHeaders() {
  const token = localStorage.getItem("sagunbok_user");
  if (token) {
    try {
      const user = JSON.parse(token);
      return { Authorization: `Bearer ${user.id}` };
    } catch {}
  }
  return {};
}

export default function CretopReportPage() {
  // 🎯 GPT-5.2 전용으로 고정
  const [selectedModel] = useState<"gpt">("gpt");
  const [apiKeys, setApiKeys] = useState<{ gpt: boolean }>({
    gpt: false,
  });
  const [apiKeysLoading, setApiKeysLoading] = useState(true); // 🔑 로딩 상태 추가
  
  // API Key 입력 관련
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyMsg, setApiKeyMsg] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectedModel, setDetectedModel] = useState<{
    type: string;
    info: string;
  } | null>(null);
  const [savedModels, setSavedModels] = useState<{
    gpt?: string;
  }>({});

  // 파일 업로드
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 입력 필드
  const [companyName, setCompanyName] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [balanceSheet, setBalanceSheet] = useState("");
  const [incomeStatement, setIncomeStatement] = useState("");
  const [cashflow, setCashflow] = useState("");

  // 선택 필드
  const [ceoName, setCeoName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [industryName, setIndustryName] = useState("");
  
  // 추가 기업 정보 (PDF 분석 시 자동 추출)
  const [businessNumber, setBusinessNumber] = useState("");
  const [statementYear, setStatementYear] = useState("");
  const [revenue, setRevenue] = useState("");
  const [retainedEarnings, setRetainedEarnings] = useState("");
  const [loansToOfficers, setLoansToOfficers] = useState("");
  
  // 추출된 필드 전체 데이터 (ExtractedFieldsTable용)
  const [extractedFieldsData, setExtractedFieldsData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CretopReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      setApiKeysLoading(true); // 🔑 로딩 시작
      try {
        const r = await fetch(`${API_BASE_URL}/api/consultant/api-key/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const j = (await r.json()) as ApiKeyStatus;
        if (j.ok && j.keys) {
          setApiKeys({ gpt: j.keys.gpt });
          // 🎯 GPT-5.2 전용 - 키 확인만 수행
        }
      } catch {
        console.error('[CretopReport] Failed to load API keys');
      } finally {
        setApiKeysLoading(false); // 🔑 로딩 완료
      }
    })();
  }, []);

  const detectApiKey = () => {
    const key = apiKeyDraft.trim();
    if (!key) {
      setApiKeyMsg("❌ API 키를 입력해주세요.");
      return;
    }

    setDetecting(true);
    setApiKeyMsg("");
    setDetectedModel(null);

    try {
      // GPT 키만 감지
      if (key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
        setDetectedModel({
          type: 'gpt',
          info: 'GPT-5.2'
        });
        setApiKeyMsg("✅ GPT-5.2 API 키 감지됨! (재무제표 분석 최적화)");
        return;
      }

      setApiKeyMsg("❌ GPT API 키만 사용 가능합니다. (sk- 로 시작)\n\n📌 발급: https://platform.openai.com/api-keys");
    } finally {
      setDetecting(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKeyDraft.trim()) {
      setApiKeyMsg("❌ API 키를 입력해주세요.");
      return;
    }

    try {
      const keyType = 'gpt'; // GPT 전용
      
      console.log(`[Frontend] Saving GPT API key`);      
      const r = await fetch(`${API_BASE_URL}/api/consultant/api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ apiKey: apiKeyDraft.trim(), modelType: keyType }),
      });

      const j = await r.json();
      if (j.ok) {
        // GPT 전용
        setApiKeys((prev) => ({ ...prev, [keyType]: true }));
        
        // 저장된 모델 정보 업데이트 (GPT 전용)
        setSavedModels((prev) => ({ ...prev, [keyType]: 'GPT-5.2' }));
        
        setApiKeyDraft("");
        setDetectedModel(null);
        setApiKeyMsg(`✅ GPT-5.2 API 키 저장 완료!`);
        setTimeout(() => setApiKeyMsg(""), 3000);
      } else {
        throw new Error(j.error || "저장 실패");
      }
    } catch (e: any) {
      setApiKeyMsg(`❌ 저장 실패: ${e.message}`);
    }
  };

  // PDF 파일 처리
  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    // 🔑 API 키 로딩 상태 확인
    if (apiKeysLoading) {
      alert('⏳ API 키를 불러오는 중입니다...\n잠시 후 다시 PDF를 업로드해주세요.');
      return;
    }
    
    // Gemini 모델들은 'gemini' 키로 체크
    const keyType = selectedModel.startsWith('gemini') ? 'gemini' : selectedModel;
    
    if (!apiKeys[keyType]) {
      alert('🔑 GPT-5.2 API KEY를 먼저 등록해주세요!\n\n💡 재무제표 분석에는 GPT-5.2를 사용합니다.\n상단 "GPT API KEY 등록" 섹션에서 키를 입력하고 💾 저장 버튼을 눌러주세요.\n\n📌 API 키 발급:\n• https://platform.openai.com/api-keys\n\n💰 비용: 건당 약 100원 (직접 결제)');
      return;
    }
    
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validTypes.includes(file.type)) {
      alert('PDF 또는 Excel 파일만 업로드 가능합니다.');
      return;
    }
    setUploadedFile(file);
    analyzeFinancialStatement(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const analyzeFinancialStatement = async (file: File) => {
    // 🔑 API 키 로딩 체크
    if (apiKeysLoading) {
      alert('⏳ API 키를 불러오는 중입니다...\n잠시 후 다시 시도해주세요.');
      return;
    }
    
    // Gemini 모델들은 'gemini' 키로 체크
    const keyType = selectedModel.startsWith('gemini') ? 'gemini' : selectedModel;
    
    if (!apiKeys[keyType]) {
      alert('🔑 GPT-5.2 API KEY를 먼저 등록해주세요!\n\n💡 재무제표 분석에는 GPT-5.2를 사용합니다.\n상단 "GPT API KEY 등록" 섹션에서 키를 입력하고 💾 저장 버튼을 눌러주세요.\n\n📌 API 키 발급:\n• https://platform.openai.com/api-keys\n\n💰 비용: 건당 약 100원 (직접 결제)');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelType', selectedModel);
      
      console.log(`[Frontend] Sending modelType: "${selectedModel}"`); // 🔍 디버깅 로그

      const res = await fetch(`${API_BASE_URL}/api/ai/analyze-financial-statement`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      // 🔍 응답 상태 및 Content-Type 확인
      console.log(`[Frontend] Response status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
      
      // HTML 응답인 경우 에러 처리
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const html = await res.text();
        console.error('[Frontend] Received HTML instead of JSON:', html.substring(0, 500));
        throw new Error(`서버 에러 (HTML 응답): ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log('[Frontend] API Response:', JSON.stringify(data, null, 2)); // 🔍 전체 응답 로깅
      
      if (data.ok && data.analysis) {
        console.log('[Frontend] Analysis structure:', Object.keys(data.analysis)); // 🔍 키 확인
        
        // 새로운 구조화된 응답 처리 (9개 필드)
        setExtractedFieldsData(data.analysis);
        
        // 기존 UI 필드 업데이트 (하위 호환성)
        if (data.analysis.company_name?.value) setCompanyName(data.analysis.company_name.value);
        if (data.analysis.ceo_name?.value) setCeoName(data.analysis.ceo_name.value);
        if (data.analysis.business_number?.value) setBusinessNumber(data.analysis.business_number.value);
        if (data.analysis.industry?.value) setIndustryName(data.analysis.industry.value);
        if (data.analysis.statement_year?.value) {
          setStatementYear(data.analysis.statement_year.value);
          setStatementDate(data.analysis.statement_year.value + '-12-31'); // 기본 결산일
        }
        if (data.analysis.revenue?.value) setRevenue(data.analysis.revenue.value);
        if (data.analysis.retained_earnings?.value) setRetainedEarnings(data.analysis.retained_earnings.value);
        if (data.analysis.loans_to_officers?.value) setLoansToOfficers(data.analysis.loans_to_officers.value);
        if (data.analysis.welfare_expenses?.value) {
          console.log('[Frontend] Welfare expenses extracted:', data.analysis.welfare_expenses.value);
        }
        
        alert('✅ 재무제표 분석 완료! 9개 항목이 자동 추출되었습니다.\n아래 표에서 결과를 확인하세요.');
      } else {
        throw new Error(data.error || '분석 실패');
      }
    } catch (err: any) {
      console.error('[Frontend] Analysis error:', err);
      alert(`분석 실패: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!extractedFieldsData) {
      alert("먼저 재무제표 PDF를 업로드하고 분석해주세요.");
      return;
    }

    // 🔑 API 키 로딩 체크
    if (apiKeysLoading) {
      alert('⏳ API 키를 불러오는 중입니다...\n잠시 후 다시 시도해주세요.');
      return;
    }

    // Gemini 모델들은 'gemini' 키로 체크
    const keyType = selectedModel.startsWith('gemini') ? 'gemini' : selectedModel;
    
    if (!apiKeys[keyType]) {
      alert('🔑 GPT-5.2 API KEY를 먼저 등록해주세요!\n\n💡 재무제표 분석에는 GPT-5.2를 사용합니다.\n상단 "GPT API KEY 등록" 섹션에서 키를 입력하고 💾 저장 버튼을 눌러주세요.\n\n📌 API 키 발급:\n• https://platform.openai.com/api-keys\n\n💰 비용: 건당 약 100원 (직접 결제)');
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setReport(null);

    try {
      // 추출된 재무 데이터를 사근복 스냅샷 분석 형식으로 변환
      const getFieldValue = (field: any) => {
        if (!field) return "";
        return field.value || field.original_text || "";
      };

      // 재무상태표 데이터
      const balanceSheetData = {
        "이익잉여금": getFieldValue(extractedFieldsData.retained_earnings),
        "가지급금": getFieldValue(extractedFieldsData.loans_to_officers),
      };

      // 손익계산서 데이터
      const incomeStatementData = {
        "매출액": getFieldValue(extractedFieldsData.revenue),
        "복리후생비": getFieldValue(extractedFieldsData.welfare_expenses),
      };

      const snapshotPayload = {
        company_name: getFieldValue(extractedFieldsData.company_name),
        industry: getFieldValue(extractedFieldsData.industry) || "미입력",
        year: getFieldValue(extractedFieldsData.statement_year),
        employee_count: employeeCount || "미입력",
        unit: "원",
        balance_sheet: balanceSheetData,
        income_statement: incomeStatementData,
        cash_flow: {},
        model_type: selectedModel.startsWith('gemini') ? 'gemini' : 'gpt',
      };

      // 재무제표 스냅샷 분석 API 호출
      const r = await fetch(`${API_BASE_URL}/api/ai/analyze-financial-snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(snapshotPayload),
      });

      const j = await r.json();
      if (!j.ok) {
        throw new Error(j.error || "리포트 생성 실패");
      }

      if (j.analysis) {
        // 분석 결과를 Markdown으로 표시하기 위해 간단한 report 객체로 변환
        setReport({
          report_meta: {
            company_name: snapshotPayload.company_name,
            statement_period: snapshotPayload.year,
            currency_unit: "원",
            generated_at: new Date().toISOString(),
            data_sources: ["PDF 추출 데이터"],
            confidence: {
              overall: 0.85,
              missing_critical_data: [],
            },
          },
          summary_one_page: {
            headline: j.analysis,
            key_findings: [],
            top_risks: [],
            top_opportunities: [],
          },
          executive_overview: {
            overall_grade: "",
            diagnosis_lines: [],
            improvement_points: [],
          },
          issue_check: {
            table: [],
            flags: [],
          },
          lifecycle: {
            stage: "",
            basis: [],
            stage_tasks: [],
          },
          financial_summary: {},
          ratio_analysis: {},
          sagunbok_consulting: {},
          gongunbok_applicability: {},
          roadmap: {
            days_30_60_90: [],
            month_6: [],
            month_12: [],
          },
          additional_data_request: {
            priority_1: [],
            priority_2: [],
            priority_3: [],
          },
          disclaimer: {
            lines: [],
          },
        } as any);
      } else {
        throw new Error("리포트 JSON 파싱 실패");
      }
    } catch (e: any) {
      setErrorMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.report_meta.company_name}_${report.report_meta.generated_at}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header - 절세계산기 스타일 */}
      <header>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">📊 재무제표 분석</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 mt-6 font-bold leading-relaxed">
          재무제표 기반 기업 진단 · 사근복 컨설팅 · 실행 로드맵을 자동 생성합니다.
        </p>
      </header>

      {/* AI Model Selection - Claude Only */}
      <div className="bg-[#f1f7ff] rounded-3xl border-2 border-blue-100 p-8 shadow-lg space-y-6">
        <h3 className="flex items-center gap-3 text-blue-700 font-black text-3xl lg:text-4xl">
          <span>🤖</span> GPT API KEY 등록
        </h3>
        <p className="text-lg text-blue-600 font-bold">
          💡 재무제표 분석에 Claude 3.5 Sonnet을 사용합니다. (가장 정확하고 안정적)
        </p>

        {/* 저장된 GPT 키 표시 */}
        {apiKeys.gpt && savedModels.gpt && (
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-5 shadow-sm">
            <p className="text-sm font-bold text-blue-600 mb-3">✅ 등록된 GPT API 키</p>
            <div className="bg-white px-4 py-2 rounded-xl border-2 border-blue-200 shadow-sm inline-block">
              <p className="text-xs font-bold text-gray-500">GPT-5.2</p>
              <p className="text-sm font-black text-blue-700">{savedModels.gpt}</p>
            </div>
          </div>
        )}

        {/* 3-Column Layout: 왼쪽(키 입력) - 중앙(감지 모델) - 오른쪽(저장) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* 왼쪽: API 키 입력 (5칸) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-lg font-bold text-blue-700">API Key 입력</label>
            <input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => {
                setApiKeyDraft(e.target.value);
                setDetectedModel(null);
                setApiKeyMsg("");
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  detectApiKey();
                }
              }}
              placeholder="sk-... (GPT-5.2 API 키를 입력하세요)"
              className="w-full px-5 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none font-medium text-lg bg-white shadow-sm"
            />
            <button
              onClick={detectApiKey}
              disabled={detecting || !apiKeyDraft.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detecting ? "🔍 확인 중..." : "🔍 자동 감지"}
            </button>
          </div>

          {/* 중앙: 감지된 모델 표시 (5칸) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-lg font-bold text-blue-700">감지된 모델</label>
            {detectedModel ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-xl font-black text-blue-700">{detectedModel.type.toUpperCase()}</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{detectedModel.info}</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 h-[100px] flex items-center justify-center">
                <p className="text-gray-400 font-bold">키 입력 후 자동 감지 버튼을 클릭하세요</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 저장 버튼 (2칸) */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-lg font-bold text-blue-700 opacity-0">저장</label>
            <button
              onClick={saveApiKey}
              disabled={!detectedModel || !apiKeyDraft.trim()}
              className="w-full h-[100px] px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black text-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
            >
              💾<br/>저장
            </button>
          </div>
        </div>

        {/* 메시지 표시 */}
        {apiKeyMsg && (
          <div className={`p-4 rounded-xl font-bold text-lg ${
            apiKeyMsg.includes('✅') ? 'bg-green-50 text-green-700 border-2 border-green-200' : 
            apiKeyMsg.includes('🔍') ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' : 
            'bg-red-50 text-red-700 border-2 border-red-200'
          }`}>
            {apiKeyMsg}
          </div>
        )}


      </div>

      {/* Claude 고정 - 모델 선택 불필요 */}

      {/* PDF Upload Section - Compact */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-5 space-y-4 shadow-md">
        <h3 className="flex items-center gap-3 text-purple-700 font-black text-2xl lg:text-3xl">
          <span className="text-3xl lg:text-4xl">📤</span> 재무제표 파일 업로드 (선택)
        </h3>
        <p className="text-lg lg:text-xl text-purple-600 font-bold">
          PDF 또는 Excel 파일을 업로드하면 AI가 자동으로 분석합니다.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (apiKeysLoading) {
              alert('⏳ API 키를 불러오는 중입니다...\n잠시 후 다시 시도해주세요.');
              return;
            }
            fileInputRef.current?.click();
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            apiKeysLoading
              ? "border-gray-300 bg-gray-100 cursor-wait"
              : isDragging
              ? "border-purple-500 bg-purple-100"
              : uploadedFile
              ? "border-green-500 bg-green-50"
              : "border-purple-300 bg-white hover:border-purple-500 hover:bg-purple-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xls,.xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            disabled={apiKeysLoading}
          />
          {apiKeysLoading ? (
            <div className="space-y-3">
              <div className="text-4xl animate-pulse">⏳</div>
              <p className="text-base font-bold text-gray-600">API 키를 불러오는 중...</p>
            </div>
          ) : isAnalyzing ? (
            <div className="space-y-3">
              <div className="text-4xl animate-pulse">⏳</div>
              <p className="text-base font-bold text-purple-700">AI가 재무제표를 분석하고 있습니다...</p>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-base font-bold text-green-700">{uploadedFile.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                }}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all"
              >
                다른 파일 선택
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <p className="text-base font-bold text-purple-700">파일을 드래그하거나 클릭하여 선택</p>
              <p className="text-sm text-purple-500 font-medium">PDF, Excel 파일 지원</p>
            </div>
          )}
        </div>
      </div>

      {/* 추출된 필드 테이블 - PDF 분석 결과 표시 */}
      {extractedFieldsData && (
        <ExtractedFieldsTable 
          data={extractedFieldsData}
          onCopy={() => {
            console.log('텍스트 표가 복사되었습니다.');
          }}
        />
      )}

      {/* 재무제표 스냅샷 분석 안내 */}
      {extractedFieldsData && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[48px] border-4 border-blue-100 p-10 lg:p-14 space-y-6 shadow-xl">
          <div className="flex items-center gap-4">
            <span className="text-5xl">📊</span>
            <div>
              <h3 className="text-blue-700 font-black text-3xl lg:text-4xl">
                재무제표 데이터 추출 완료
              </h3>
              <p className="text-xl text-blue-600 font-bold mt-2">
                💡 추출된 재무 데이터를 기반으로 사근복 관점의 심층 분석 리포트를 생성합니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-3xl p-6 border-2 border-blue-200">
              <div className="text-blue-600 font-black text-lg mb-2">🏢 기업정보</div>
              <div className="text-gray-700 font-bold">
                {extractedFieldsData.company_name?.value || "-"}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border-2 border-green-200">
              <div className="text-green-600 font-black text-lg mb-2">💰 매출액</div>
              <div className="text-gray-700 font-bold">
                {extractedFieldsData.revenue?.value ? `${Number(extractedFieldsData.revenue.value).toLocaleString()}원` : "-"}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border-2 border-purple-200">
              <div className="text-purple-600 font-black text-lg mb-2">📅 기준연도</div>
              <div className="text-gray-700 font-bold">
                {extractedFieldsData.statement_year?.value || "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || apiKeysLoading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[48px] py-10 text-3xl lg:text-4xl font-black shadow-2xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {apiKeysLoading 
          ? "⏳ API 키 로딩 중..." 
          : loading 
          ? "⏳ 리포트 생성 중... (약 30초 소요)" 
          : "재무제표 AI정밀 분석"}
      </button>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border-4 border-red-200 rounded-[32px] p-8 text-red-700 font-bold text-xl">
          ❌ 오류: {errorMsg}
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-green-50 border-4 border-green-200 rounded-[32px] p-8">
            <h2 className="text-3xl font-black text-green-700">✅ 리포트 생성 완료!</h2>
            <button
              onClick={downloadJSON}
              className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-lg"
            >
              💾 JSON 다운로드
            </button>
          </div>

          {/* Report Sections */}
          <ReportDisplay report={report} />
        </div>
      )}
    </div>
  );
}

function ReportDisplay({ report }: { report: CretopReport }) {
  // If the report contains markdown text in headline, display it
  if (typeof report.summary_one_page.headline === 'string' && report.summary_one_page.headline.includes('#')) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-[32px] border-4 border-blue-100 p-10 shadow-xl">
          <h3 className="text-3xl font-black text-blue-700 mb-6">📊 사근복 관점 재무 스냅샷 분석</h3>
          <div className="prose prose-xl max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-4xl font-black text-blue-700 mt-10 mb-5" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-3xl font-black text-slate-800 mt-8 mb-4 pb-3 border-b-4 border-blue-200" {...props} />,
                h3: ({ node, children, ...props }) => {
                  // Special styling for all section cards (B: 4대 지표, C: 이슈체크, D: 컨설팅 제안, E: 로드맵)
                  const text = String(children);
                  let bgColor = 'bg-gradient-to-br from-blue-50 to-indigo-50';
                  let borderColor = 'border-blue-300';
                  let iconBg = 'bg-blue-100';
                  let icon = '📊';
                  
                  // B. 4대 지표 스냅샷
                  if (text.includes('매출액') || text.includes('💰')) {
                    bgColor = 'bg-gradient-to-br from-green-50 to-emerald-50';
                    borderColor = 'border-green-300';
                    iconBg = 'bg-green-100';
                    icon = '💰';
                  } else if (text.includes('이익잉여금') || text.includes('📊')) {
                    bgColor = 'bg-gradient-to-br from-blue-50 to-cyan-50';
                    borderColor = 'border-blue-300';
                    iconBg = 'bg-blue-100';
                    icon = '📊';
                  } else if (text.includes('가지급금') || text.includes('⚠️')) {
                    bgColor = 'bg-gradient-to-br from-orange-50 to-amber-50';
                    borderColor = 'border-orange-300';
                    iconBg = 'bg-orange-100';
                    icon = '⚠️';
                  } else if (text.includes('복리후생비') || text.includes('🎁')) {
                    bgColor = 'bg-gradient-to-br from-purple-50 to-pink-50';
                    borderColor = 'border-purple-300';
                    iconBg = 'bg-purple-100';
                    icon = '🎁';
                  }
                  // C. 이슈체크
                  else if (text.includes('이슈') || text.includes('체크') || text.includes('🔍')) {
                    bgColor = 'bg-gradient-to-br from-red-50 to-rose-50';
                    borderColor = 'border-red-300';
                    iconBg = 'bg-red-100';
                    icon = '🔍';
                  }
                  // D. 컨설팅 제안 (패키지)
                  else if (text.includes('패키지') || text.includes('제안') || text.includes('💼')) {
                    bgColor = 'bg-gradient-to-br from-teal-50 to-cyan-50';
                    borderColor = 'border-teal-300';
                    iconBg = 'bg-teal-100';
                    icon = '💼';
                  }
                  // E. 로드맵
                  else if (text.includes('로드맵') || text.includes('실행') || text.includes('🗓️') || text.includes('일')) {
                    bgColor = 'bg-gradient-to-br from-indigo-50 to-violet-50';
                    borderColor = 'border-indigo-300';
                    iconBg = 'bg-indigo-100';
                    icon = '🗓️';
                  }
                  
                  return (
                    <div className={`${bgColor} ${borderColor} border-4 rounded-3xl p-6 mt-6 mb-4 shadow-lg`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`${iconBg} rounded-full w-12 h-12 flex items-center justify-center text-2xl`}>
                          {icon}
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 m-0" {...props}>{children}</h3>
                      </div>
                    </div>
                  );
                },
                p: ({ node, ...props }) => <p className="text-lg text-slate-700 my-3 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-none space-y-3 my-4 text-lg ml-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 my-4 text-lg" {...props} />,
                li: ({ node, children, ...props }) => {
                  const text = String(children);
                  let icon = '•';
                  let textColor = 'text-slate-700';
                  let fontWeight = 'font-medium';
                  
                  if (text.includes('값:') || text.includes('금액')) {
                    icon = '💵';
                    textColor = 'text-slate-800';
                    fontWeight = 'font-black';
                  } else if (text.includes('의미:')) {
                    icon = '💡';
                    textColor = 'text-blue-700';
                    fontWeight = 'font-bold';
                  } else if (text.includes('컨설팅 포인트:') || text.includes('포인트:')) {
                    icon = '🎯';
                    textColor = 'text-green-700';
                    fontWeight = 'font-bold';
                  }
                  
                  return (
                    <li className={`${textColor} ${fontWeight} leading-relaxed flex items-start gap-2`} {...props}>
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <span className="flex-1">{children}</span>
                    </li>
                  );
                },
                strong: ({ node, ...props }) => <strong className="font-black text-slate-900" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-blue-700" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border-2 border-green-300 text-lg" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-green-600" {...props} />,
                tbody: ({ node, ...props }) => <tbody {...props} />,
                tr: ({ node, ...props }) => <tr className="border-b border-green-200" {...props} />,
                th: ({ node, ...props }) => <th className="px-6 py-4 text-left font-black text-white border border-green-400 text-lg" {...props} />,
                td: ({ node, ...props }) => <td className="px-6 py-4 text-slate-800 border border-green-300 text-lg" {...props} />,
                code: ({ node, inline, ...props }: any) => 
                  inline ? (
                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-blue-600" {...props} />
                  ) : (
                    <code className="block bg-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                  ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-4" {...props} />
                ),
              }}
            >
              {report.summary_one_page.headline}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Original display format for structured reports
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="bg-white rounded-[32px] border-4 border-blue-100 p-10 shadow-xl">
        <h3 className="text-3xl font-black text-blue-700 mb-6">📋 종합 요약</h3>
        <div className="space-y-4">
          <p className="text-2xl font-bold text-slate-700">{report.summary_one_page.headline}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {report.summary_one_page.key_findings?.map((f, i) => (
              <div key={i} className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <p className="font-black text-blue-700 text-lg">{f.title}</p>
                <p className="text-sm text-slate-600 mt-2">{f.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Overview */}
      <div className="bg-white rounded-[32px] border-4 border-purple-100 p-10 shadow-xl">
        <h3 className="text-3xl font-black text-purple-700 mb-6">💼 경영진단 종합</h3>
        <div className="space-y-4">
          <p className="text-2xl font-bold text-purple-600">등급: {report.executive_overview.overall_grade}</p>
          <ul className="space-y-2 mt-4">
            {report.executive_overview.diagnosis_lines?.map((line, i) => (
              <li key={i} className="text-lg text-slate-700">• {line}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risks */}
      <div className="bg-white rounded-[32px] border-4 border-red-100 p-10 shadow-xl">
        <h3 className="text-3xl font-black text-red-700 mb-6">⚠️ 주요 리스크</h3>
        <div className="space-y-4">
          {report.summary_one_page.top_risks?.map((r, i) => (
            <div key={i} className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
              <div className="flex justify-between items-start mb-2">
                <p className="font-black text-red-700 text-lg">{r.title}</p>
                <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
                  {r.severity}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{r.evidence}</p>
              <p className="text-sm text-red-600 font-bold">→ {r.next_action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="bg-white rounded-[32px] border-4 border-green-100 p-10 shadow-xl">
        <h3 className="text-3xl font-black text-green-700 mb-6">🎯 개선 기회</h3>
        <div className="space-y-4">
          {report.summary_one_page.top_opportunities?.map((o, i) => (
            <div key={i} className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex justify-between items-start mb-2">
                <p className="font-black text-green-700 text-lg">{o.title}</p>
                <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                  {o.priority}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{o.evidence}</p>
              <p className="text-sm text-green-600 font-bold">→ {o.next_action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-white rounded-[32px] border-4 border-indigo-100 p-10 shadow-xl">
        <h3 className="text-3xl font-black text-indigo-700 mb-6">🗺️ 실행 로드맵</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-xl font-black text-indigo-600 mb-3">📅 30-90일</h4>
            <div className="space-y-2">
              {report.roadmap.days_30_60_90?.map((t, i) => (
                <div key={i} className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <p className="font-bold text-slate-700">{t.task}</p>
                  <p className="text-sm text-slate-500">담당: {t.owner} | 난이도: {t.difficulty}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-black text-indigo-600 mb-3">📅 6개월</h4>
            <div className="space-y-2">
              {report.roadmap.month_6?.map((t, i) => (
                <div key={i} className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <p className="font-bold text-slate-700">{t.task}</p>
                  <p className="text-sm text-slate-500">담당: {t.owner} | 난이도: {t.difficulty}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-black text-indigo-600 mb-3">📅 12개월</h4>
            <div className="space-y-2">
              {report.roadmap.month_12?.map((t, i) => (
                <div key={i} className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <p className="font-bold text-slate-700">{t.task}</p>
                  <p className="text-sm text-slate-500">담당: {t.owner} | 난이도: {t.difficulty}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 rounded-[32px] border-2 border-slate-200 p-8">
        <h3 className="text-xl font-black text-slate-600 mb-4">⚖️ 면책사항</h3>
        <ul className="space-y-1 text-sm text-slate-600">
          {report.disclaimer.lines?.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
