import React, { useState, useEffect, useRef } from "react";

/**
 * CretopReportPage.tsx
 * CRETOP 기업분석 리포트 생성 페이지
 * - PDF 업로드 + GPT/Claude 자동 분석
 * - 절세계산기 스타일 UI
 */

const API_BASE_URL = "https://sagunbok.com";
const MODULE = "CRETOP_REPORT" as const;
const ACTION = "FULL_REPORT" as const;

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
  const [selectedModel, setSelectedModel] = useState<"claude" | "gpt" | "gemini">("claude");
  const [apiKeys, setApiKeys] = useState<{ claude: boolean; gpt: boolean; gemini: boolean }>({
    claude: false,
    gpt: false,
    gemini: false,
  });
  
  // API Key 입력 관련
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyMsg, setApiKeyMsg] = useState("");

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

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CretopReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
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
          setApiKeys(j.keys);
        }
      } catch {}
    })();
  }, []);

  const saveApiKey = async () => {
    if (!apiKeyDraft.trim()) {
      setApiKeyMsg("❌ API 키를 입력해주세요.");
      return;
    }

    try {
      const r = await fetch(`${API_BASE_URL}/api/consultant/api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ apiKey: apiKeyDraft.trim(), modelType: selectedModel }),
      });

      const j = await r.json();
      if (j.ok) {
        setApiKeys((prev) => ({ ...prev, [selectedModel]: true }));
        setApiKeyDraft("");
        setApiKeyMsg(`✅ ${selectedModel.toUpperCase()} API 키 저장 완료!`);
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
    if (!apiKeys.gpt && !apiKeys.claude) {
      alert('GPT 또는 Claude API 키를 먼저 등록해주세요.\n컨설턴트존에서 API 키를 등록할 수 있습니다.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelType', selectedModel);

      const res = await fetch(`${API_BASE_URL}/api/ai/analyze-financial-statement`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.analysis) {
        // 기본 정보
        if (data.analysis.company_name) setCompanyName(data.analysis.company_name);
        if (data.analysis.statement_date) setStatementDate(data.analysis.statement_date);
        
        // 추가 기업 정보
        if (data.analysis.ceo_name) setCeoName(data.analysis.ceo_name);
        if (data.analysis.business_number) setBusinessNumber(data.analysis.business_number);
        if (data.analysis.industry) setIndustryName(data.analysis.industry);
        if (data.analysis.statement_year) setStatementYear(data.analysis.statement_year);
        
        // 재무 데이터
        if (data.analysis.balance_sheet) setBalanceSheet(JSON.stringify(data.analysis.balance_sheet, null, 2));
        if (data.analysis.income_statement) {
          setIncomeStatement(JSON.stringify(data.analysis.income_statement, null, 2));
          // 매출액 추출
          if (data.analysis.income_statement.매출액) {
            setRevenue(data.analysis.income_statement.매출액.toLocaleString() + '원');
          }
        }
        if (data.analysis.cash_flow) setCashflow(JSON.stringify(data.analysis.cash_flow, null, 2));
        
        // 특수 항목 추출
        if (data.analysis.balance_sheet) {
          // 잉여금 (미처분이익잉여금 또는 이익잉여금)
          if (data.analysis.balance_sheet.미처분이익잉여금) {
            setRetainedEarnings(data.analysis.balance_sheet.미처분이익잉여금.toLocaleString() + '원');
          } else if (data.analysis.balance_sheet.이익잉여금) {
            setRetainedEarnings(data.analysis.balance_sheet.이익잉여금.toLocaleString() + '원');
          }
          
          // 가지급금 (대여금)
          if (data.analysis.balance_sheet.가지급금) {
            setLoansToOfficers(data.analysis.balance_sheet.가지급금.toLocaleString() + '원');
          } else if (data.analysis.balance_sheet.단기대여금) {
            setLoansToOfficers(data.analysis.balance_sheet.단기대여금.toLocaleString() + '원');
          }
        }
        
        alert('✅ 재무제표 분석 완료! 기업 정보가 자동 입력되었습니다.');
      } else {
        throw new Error(data.error || '분석 실패');
      }
    } catch (err: any) {
      alert(`분석 실패: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!companyName || !statementDate) {
      alert("회사명과 결산일은 필수입니다.");
      return;
    }

    if (!apiKeys[selectedModel]) {
      alert(`${selectedModel.toUpperCase()} API 키가 등록되지 않았습니다.\n컨설턴트존에서 등록해주세요.`);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setReport(null);

    try {
      const r = await fetch(`${API_BASE_URL}/api/ai/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          module: MODULE,
          action: ACTION,
          modelType: selectedModel,
          calcResult: {
            company_name: companyName,
            statement_date: statementDate,
            balance_sheet_json: balanceSheet || "{}",
            income_statement_json: incomeStatement || "{}",
            cashflow_json: cashflow || "{}",
            ceo_name: ceoName,
            employee_count: employeeCount,
            industry_name: industryName,
          },
        }),
      });

      const j = await r.json();
      if (!j.ok) {
        throw new Error(j.error || "리포트 생성 실패");
      }

      if (j.report) {
        setReport(j.report);
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

      {/* AI Model Selection - Compact */}
      <div className="bg-[#f1f7ff] rounded-3xl border-2 border-blue-100 p-6 shadow-lg space-y-4">
        <h3 className="flex items-center gap-3 text-blue-700 font-black text-3xl lg:text-4xl">
          <span>🤖</span> AI API KEY 등록
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Model Selection & Status */}
          <div className="space-y-3">
            <label className="text-lg font-bold text-blue-700">사용할 AI 모델</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="w-full px-5 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none font-bold text-xl bg-white shadow-sm"
            >
              <option value="claude">Claude 3.5 Sonnet (추천)</option>
              <option value="gpt">GPT-4 Turbo</option>
              <option value="gemini">Gemini 2.0 Flash</option>
            </select>
            
            {/* Status Badge */}
            <div
              className={`px-5 py-3 rounded-xl font-bold text-lg text-center ${
                apiKeys[selectedModel] ? "bg-green-100 text-green-700 ring-2 ring-green-300" : "bg-red-100 text-red-700 ring-2 ring-red-300"
              }`}
            >
              {apiKeys[selectedModel] ? "✓ 등록됨" : "⚠ 미등록"}
            </div>
          </div>

          {/* Right: API Key Input */}
          <div className="space-y-3">
            <label className="text-lg font-bold text-blue-700">API Key 입력</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder={
                  selectedModel === "claude" ? "sk-ant-api03-..." : selectedModel === "gpt" ? "sk-..." : "AIzaSy..."
                }
                className="flex-1 px-5 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none font-medium text-lg bg-white shadow-sm"
              />
              <button
                onClick={saveApiKey}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-md whitespace-nowrap"
              >
                저장
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        {apiKeyMsg && (
          <div
            className={`p-4 rounded-xl font-semibold text-lg ${
              apiKeyMsg.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {apiKeyMsg}
          </div>
        )}
        
        {!apiKeys[selectedModel] && !apiKeyMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-lg text-amber-700 font-semibold">
              💡 위에서 선택한 모델의 API Key를 입력하고 저장해주세요.
            </p>
          </div>
        )}
      </div>

      {/* 기업 정보 카드 - PDF 분석 시 자동 표시 */}
      {(companyName || ceoName || businessNumber) && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-6 space-y-4 shadow-lg">
          <h3 className="flex items-center gap-3 text-blue-700 font-black text-2xl lg:text-3xl">
            <span className="text-3xl lg:text-4xl">📝</span> 기본 정보 입력
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 회사명 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-blue-600 block mb-1">회사명 *</label>
              <p className="text-lg font-bold text-slate-800">{companyName || "미입력"}</p>
            </div>
            
            {/* 결산일 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-blue-600 block mb-1">결산일 *</label>
              <p className="text-lg font-bold text-slate-800">{statementDate || statementYear || "미입력"}</p>
            </div>
            
            {/* 대표자명 */}
            {ceoName && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-blue-600 block mb-1">대표자명</label>
                <p className="text-lg font-bold text-slate-800">{ceoName}</p>
              </div>
            )}
            
            {/* 사업자등록번호 */}
            {businessNumber && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-blue-600 block mb-1">사업자등록번호</label>
                <p className="text-lg font-bold text-slate-800">{businessNumber}</p>
              </div>
            )}
            
            {/* 업종 */}
            {industryName && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-blue-600 block mb-1">업종</label>
                <p className="text-lg font-bold text-slate-800">{industryName}</p>
              </div>
            )}
            
            {/* 임직원수 */}
            {employeeCount && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-blue-600 block mb-1">임직원수</label>
                <p className="text-lg font-bold text-slate-800">{employeeCount}</p>
              </div>
            )}
            
            {/* 매출액 */}
            {revenue && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-green-600 block mb-1">매출액</label>
                <p className="text-lg font-bold text-green-700">{revenue}</p>
              </div>
            )}
            
            {/* 잉여금 */}
            {retainedEarnings && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-green-600 block mb-1">잉여금</label>
                <p className="text-lg font-bold text-green-700">{retainedEarnings}</p>
              </div>
            )}
            
            {/* 가지급금 */}
            {loansToOfficers && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="text-sm font-bold text-orange-600 block mb-1">가지급금(대여금)</label>
                <p className="text-lg font-bold text-orange-700">{loansToOfficers}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
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
          />
          {isAnalyzing ? (
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

      {/* Basic Info Input */}
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-10">
        <h3 className="flex items-center gap-4 text-slate-700 font-black text-3xl lg:text-4xl">
          <span>📝</span> 기본 정보 입력
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">회사명 *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 테스트주식회사"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">결산일 *</label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">대표자명</label>
            <input
              type="text"
              value={ceoName}
              onChange={(e) => setCeoName(e.target.value)}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 홍길동"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">임직원수</label>
            <input
              type="text"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 50명"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">업종</label>
            <input
              type="text"
              value={industryName}
              onChange={(e) => setIndustryName(e.target.value)}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 제조업, IT서비스업 등"
            />
          </div>
        </div>
      </div>

      {/* Financial Statements Input */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[48px] border-4 border-amber-100 p-10 lg:p-14 space-y-10 shadow-xl">
        <h3 className="flex items-center gap-4 text-amber-700 font-black text-3xl lg:text-4xl">
          <span>💰</span> 재무제표 데이터 (선택)
        </h3>
        <p className="text-xl text-amber-600 font-bold">
          💡 PDF 업로드로 자동 입력되거나, 직접 JSON 형식으로 입력하세요. 비어있어도 리포트는 생성됩니다.
        </p>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-xl font-black text-amber-700 block">재무상태표 (Balance Sheet)</label>
            <textarea
              value={balanceSheet}
              onChange={(e) => setBalanceSheet(e.target.value)}
              className="w-full bg-white border-4 border-transparent focus:border-amber-500 rounded-[24px] p-6 text-base font-mono outline-none shadow-inner"
              rows={6}
              placeholder='{"자산총계": 5000000000, "부채총계": 2000000000, "자본총계": 3000000000}'
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl font-black text-amber-700 block">손익계산서 (Income Statement)</label>
            <textarea
              value={incomeStatement}
              onChange={(e) => setIncomeStatement(e.target.value)}
              className="w-full bg-white border-4 border-transparent focus:border-amber-500 rounded-[24px] p-6 text-base font-mono outline-none shadow-inner"
              rows={6}
              placeholder='{"매출액": 10000000000, "영업이익": 1000000000, "당기순이익": 800000000}'
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl font-black text-amber-700 block">현금흐름표 (Cash Flow)</label>
            <textarea
              value={cashflow}
              onChange={(e) => setCashflow(e.target.value)}
              className="w-full bg-white border-4 border-transparent focus:border-amber-500 rounded-[24px] p-6 text-base font-mono outline-none shadow-inner"
              rows={6}
              placeholder='{"영업활동현금흐름": 900000000, "투자활동현금흐름": -200000000}'
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[48px] py-10 text-3xl lg:text-4xl font-black shadow-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? "⏳ 리포트 생성 중... (약 30초 소요)" : "🚀 CRETOP 기업분석 리포트 생성"}
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
