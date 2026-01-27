import React, { useState, useEffect, useRef } from "react";

/**
 * AIConsultantZone.tsx
 * AI 컨설턴트 존 - 통합 기업분석 → 사근복 컨설팅 자동화
 * 7단계 프로세스: API 등록 → 기업정보 → 재무제표 → 구인구직 → 리뷰 → 절세계산기 → 최종컨설팅
 */

const API_BASE_URL = "https://sagunbok.com";

type ApiKeyStatus = {
  ok: boolean;
  keys?: {
    claude: boolean;
    gpt: boolean;
    gemini: boolean;
  };
};

type StepStatus = "pending" | "in_progress" | "completed" | "error";

type CompanyInfo = {
  companyName: string;
  representative: string;
  businessNumber: string;
};

type FinancialData = {
  status: StepStatus;
  data: any;
  summary: string;
};

type JobPostingData = {
  status: StepStatus;
  data: any[];
  summary: string;
};

type ReviewData = {
  status: StepStatus;
  data: any[];
  summary: string;
};

type TaxCalculatorData = {
  status: StepStatus;
  data: any;
  summary: string;
};

type FinalConsulting = {
  status: StepStatus;
  report: string;
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

export default function AIConsultantZone() {
  // AI Model State
  const [selectedModel, setSelectedModel] = useState<"claude" | "gpt" | "gemini">("claude");
  const [apiKeys, setApiKeys] = useState<{ claude: boolean; gpt: boolean; gemini: boolean }>({
    claude: false,
    gpt: false,
    gemini: false,
  });
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyMsg, setApiKeyMsg] = useState("");

  // Company Info
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    representative: "",
    businessNumber: "",
  });

  // Step 1: 재무제표
  const [step1, setStep1] = useState<FinancialData>({
    status: "pending",
    data: null,
    summary: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Step 2: 구인구직 크롤링
  const [step2, setStep2] = useState<JobPostingData>({
    status: "pending",
    data: [],
    summary: "",
  });

  // Step 3: 리뷰 크롤링
  const [step3, setReviewData] = useState<ReviewData>({
    status: "pending",
    data: [],
    summary: "",
  });

  // Step 4: 절세계산기
  const [step4, setStep4] = useState<TaxCalculatorData>({
    status: "pending",
    data: null,
    summary: "",
  });

  // Step 5: 최종 컨설팅
  const [finalConsulting, setFinalConsulting] = useState<FinalConsulting>({
    status: "pending",
    report: "",
  });

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
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
  };

  const saveApiKey = async () => {
    if (!apiKeyDraft.trim()) return alert("API Key를 입력하세요.");
    try {
      const r = await fetch(`${API_BASE_URL}/api/consultant/api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          apiKey: apiKeyDraft.trim(),
          modelType: selectedModel,
        }),
      });
      const j = await r.json();
      if (j.ok) {
        setApiKeys((prev) => ({ ...prev, [selectedModel]: true }));
        setApiKeyDraft("");
        setApiKeyMsg(`✅ ${selectedModel.toUpperCase()} API 키 저장 완료!`);
        setTimeout(() => setApiKeyMsg(""), 3000);
      }
    } catch (e: any) {
      setApiKeyMsg(`저장 실패: ${e.message}`);
    }
  };

  // Step 1: 재무제표 업로드
  const handleFileSelect = (file: File) => {
    if (!file) return;
    const validTypes = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type)) {
      alert("PDF 또는 Excel 파일만 업로드 가능합니다.");
      return;
    }
    analyzeFinancialStatement(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const analyzeFinancialStatement = async (file: File) => {
    if (!apiKeys[selectedModel]) {
      alert("먼저 API Key를 등록해주세요.");
      return;
    }

    setStep1({ ...step1, status: "in_progress" });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("modelType", selectedModel);

      const res = await fetch(`${API_BASE_URL}/api/ai/analyze-financial-statement`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.analysis) {
        setStep1({
          status: "completed",
          data: data.analysis,
          summary: `✅ 재무제표 분석 완료: ${data.analysis.company_name || ""}`,
        });
        // 회사명 자동 입력
        if (data.analysis.company_name) {
          setCompanyInfo((prev) => ({ ...prev, companyName: data.analysis.company_name }));
        }
      } else {
        throw new Error(data.error || "분석 실패");
      }
    } catch (err: any) {
      setStep1({ ...step1, status: "error", summary: `❌ 오류: ${err.message}` });
    }
  };

  // Step 2: 구인구직 크롤링
  const startJobPostingCrawl = async () => {
    if (!companyInfo.companyName) {
      alert("업체명을 먼저 입력해주세요.");
      return;
    }

    setStep2({ ...step2, status: "in_progress" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/crawl/job-postings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          companyName: companyInfo.companyName,
          modelType: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setStep2({
          status: "completed",
          data: data.results || [],
          summary: `✅ ${data.results?.length || 0}개 공고 분석 완료`,
        });
      } else {
        throw new Error(data.error || "크롤링 실패");
      }
    } catch (err: any) {
      setStep2({ ...step2, status: "error", summary: `❌ 오류: ${err.message}` });
    }
  };

  // Step 3: 리뷰 크롤링
  const startReviewCrawl = async () => {
    if (!companyInfo.companyName) {
      alert("업체명을 먼저 입력해주세요.");
      return;
    }

    setReviewData({ ...step3, status: "in_progress" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/crawl/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          companyName: companyInfo.companyName,
          modelType: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setReviewData({
          status: "completed",
          data: data.results || [],
          summary: `✅ ${data.results?.length || 0}개 리뷰 분석 완료`,
        });
      } else {
        throw new Error(data.error || "크롤링 실패");
      }
    } catch (err: any) {
      setReviewData({ ...step3, status: "error", summary: `❌ 오류: ${err.message}` });
    }
  };

  // Step 4: 절세계산기 데이터 연동
  const loadTaxCalculatorData = () => {
    // 로컬스토리지나 Context에서 절세계산기 결과 가져오기
    const calcResults = localStorage.getItem("calcResults");
    if (calcResults) {
      try {
        const data = JSON.parse(calcResults);
        setStep4({
          status: "completed",
          data: data,
          summary: `✅ 절세계산기 데이터 연동 완료`,
        });
      } catch {
        setStep4({ ...step4, status: "error", summary: "❌ 데이터 로드 실패" });
      }
    } else {
      alert("절세계산기를 먼저 실행해주세요.");
    }
  };

  // Step 5: 최종 컨설팅 생성
  const generateFinalConsulting = async () => {
    if (step1.status !== "completed") {
      alert("1단계(재무제표)를 먼저 완료해주세요.");
      return;
    }

    setFinalConsulting({ ...finalConsulting, status: "in_progress" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/final-consulting`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          companyInfo,
          financialData: step1.data,
          jobPostingData: step2.data,
          reviewData: step3.data,
          taxCalculatorData: step4.data,
          modelType: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setFinalConsulting({
          status: "completed",
          report: data.report || "",
        });
      } else {
        throw new Error(data.error || "컨설팅 생성 실패");
      }
    } catch (err: any) {
      setFinalConsulting({ ...finalConsulting, status: "error", report: `❌ 오류: ${err.message}` });
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    const badges = {
      pending: "bg-gray-100 text-gray-600",
      in_progress: "bg-blue-100 text-blue-700 animate-pulse",
      completed: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
    };
    const labels = {
      pending: "대기",
      in_progress: "진행 중...",
      completed: "완료",
      error: "오류",
    };
    return (
      <span className={`px-4 py-2 rounded-full font-black text-sm ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">🎯 AI 컨설턴트 존</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 mt-6 font-bold leading-relaxed">
          통합 기업분석 → 사내근로복지기금 컨설팅 자동화 (7단계 프로세스)
        </p>
      </header>

      {/* Step 0: AI API 등록 */}
      <div className="bg-[#f1f7ff] rounded-[48px] border-4 border-blue-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <h3 className="flex items-center gap-4 text-blue-700 font-black text-3xl lg:text-4xl">
          <span>🤖</span> AI API 등록
        </h3>

        <div className="flex gap-3 flex-wrap">
          {Object.entries(apiKeys).map(([model, registered]) => (
            <div
              key={model}
              className={`px-5 py-3 rounded-full font-black text-lg ${
                registered ? "bg-green-100 text-green-700 ring-2 ring-green-300" : "bg-gray-100 text-gray-500"
              }`}
            >
              {model.toUpperCase()}: {registered ? "✓" : "✗"}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-blue-700 block">AI 모델 선택</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="w-full px-6 py-4 rounded-2xl border-4 border-transparent focus:border-blue-500 outline-none font-black text-xl bg-white shadow-sm"
            >
              <option value="gpt">GPT-5.2</option>
              <option value="gemini-pro">Gemini 3 Pro (최고 성능)</option>
              <option value="gemini-flash">Gemini 3 Flash (빠른 속도, 무료 추천)</option>
              <option value="gemini-preview">Gemini 3 Pro Preview (실험 버전)</option>
              <option value="claude">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-blue-700 block">API Key 입력</label>
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder={selectedModel === "claude" ? "sk-ant-api03-..." : selectedModel === "gpt" ? "sk-..." : "AIzaSy..."}
                className="flex-1 px-6 py-4 rounded-2xl border-4 border-transparent focus:border-blue-500 outline-none font-bold text-lg bg-white shadow-sm"
              />
              <button
                onClick={saveApiKey}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                저장
              </button>
            </div>
          </div>
        </div>

        {apiKeyMsg && (
          <div
            className={`p-4 rounded-xl font-bold text-lg ${
              apiKeyMsg.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {apiKeyMsg}
          </div>
        )}
      </div>

      {/* 기업 기본정보 */}
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-8">
        <h3 className="flex items-center gap-4 text-slate-700 font-black text-3xl lg:text-4xl">
          <span>🏢</span> 기업 기본정보
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">업체명 *</label>
            <input
              type="text"
              value={companyInfo.companyName}
              onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: (주)테스트컴퍼니"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">대표자</label>
            <input
              type="text"
              value={companyInfo.representative}
              onChange={(e) => setCompanyInfo({ ...companyInfo, representative: e.target.value })}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 홍길동"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">사업자등록번호</label>
            <input
              type="text"
              value={companyInfo.businessNumber}
              onChange={(e) => setCompanyInfo({ ...companyInfo, businessNumber: e.target.value })}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 123-45-67890"
            />
          </div>
        </div>
      </div>

      {/* Step 1: 재무제표 업로드 분석 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[48px] border-4 border-purple-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-4 text-purple-700 font-black text-3xl lg:text-4xl">
            <span>📊</span> 1단계: 재무제표 업로드 분석
          </h3>
          {getStatusBadge(step1.status)}
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-4 border-dashed rounded-[32px] p-16 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-purple-500 bg-purple-100"
              : step1.status === "completed"
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
          {step1.status === "in_progress" ? (
            <div className="space-y-4">
              <div className="text-6xl animate-pulse">⏳</div>
              <p className="text-2xl font-black text-purple-700">AI가 재무제표를 분석하고 있습니다...</p>
            </div>
          ) : step1.status === "completed" ? (
            <div className="space-y-4">
              <div className="text-6xl">✅</div>
              <p className="text-2xl font-black text-green-700">{step1.summary}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📁</div>
              <p className="text-2xl font-black text-purple-700">재무제표 파일을 업로드하세요</p>
              <p className="text-lg text-purple-500 font-bold">PDF, Excel 파일 지원</p>
            </div>
          )}
        </div>

        {step1.status === "error" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 font-bold">
            {step1.summary}
          </div>
        )}
      </div>

      {/* Step 2: 구인구직 크롤링 */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[48px] border-4 border-blue-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="flex items-center gap-4 text-blue-700 font-black text-3xl lg:text-4xl">
              <span>💼</span> 2단계: 구인구직 복지항목 크롤링
            </h3>
            <p className="text-xl text-blue-600 font-bold mt-2">잡코리아 · 사람인 · 인크루트</p>
          </div>
          {getStatusBadge(step2.status)}
        </div>

        <button
          onClick={startJobPostingCrawl}
          disabled={step2.status === "in_progress" || !companyInfo.companyName}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[48px] py-10 text-3xl font-black shadow-2xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {step2.status === "in_progress" ? "⏳ 크롤링 중..." : "🚀 크롤링 시작"}
        </button>

        {step2.status === "completed" && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <p className="text-xl font-black text-green-700">{step2.summary}</p>
            <div className="mt-4 space-y-2">
              {step2.data.slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="font-bold text-slate-700">{item.title || item.position}</p>
                  <p className="text-sm text-slate-500">{item.welfare || item.benefits}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step2.status === "error" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 font-bold">
            {step2.summary}
          </div>
        )}
      </div>

      {/* Step 3: 리뷰 크롤링 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[48px] border-4 border-amber-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="flex items-center gap-4 text-amber-700 font-black text-3xl lg:text-4xl">
              <span>💬</span> 3단계: 직원 리뷰 크롤링 분석
            </h3>
            <p className="text-xl text-amber-600 font-bold mt-2">블라인드 · 잡플래닛</p>
          </div>
          {getStatusBadge(step3.status)}
        </div>

        <button
          onClick={startReviewCrawl}
          disabled={step3.status === "in_progress" || !companyInfo.companyName}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-[48px] py-10 text-3xl font-black shadow-2xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {step3.status === "in_progress" ? "⏳ 크롤링 중..." : "🚀 크롤링 시작"}
        </button>

        {step3.status === "completed" && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <p className="text-xl font-black text-green-700">{step3.summary}</p>
          </div>
        )}

        {step3.status === "error" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 font-bold">
            {step3.summary}
          </div>
        )}
      </div>

      {/* Step 4: 절세계산기 데이터 연동 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[48px] border-4 border-green-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-4 text-green-700 font-black text-3xl lg:text-4xl">
            <span>🧮</span> 4단계: 절세계산기 데이터 종합 분석
          </h3>
          {getStatusBadge(step4.status)}
        </div>

        <button
          onClick={loadTaxCalculatorData}
          disabled={step4.status === "completed"}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[48px] py-10 text-3xl font-black shadow-2xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {step4.status === "completed" ? "✅ 데이터 연동 완료" : "🔗 절세계산기 데이터 불러오기"}
        </button>

        {step4.status === "completed" && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <p className="text-xl font-black text-green-700">{step4.summary}</p>
          </div>
        )}
      </div>

      {/* Step 5: 최종 컨설팅 생성 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[48px] border-4 border-indigo-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-4 text-indigo-700 font-black text-3xl lg:text-4xl">
            <span>🚀</span> 최종: 사내근로복지기금 컨설팅
          </h3>
          {getStatusBadge(finalConsulting.status)}
        </div>

        <button
          onClick={generateFinalConsulting}
          disabled={finalConsulting.status === "in_progress" || step1.status !== "completed"}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[48px] py-12 text-4xl font-black shadow-2xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {finalConsulting.status === "in_progress"
            ? "⏳ 컨설팅 생성 중... (약 1분 소요)"
            : "🎯 최종 컨설팅 리포트 생성"}
        </button>

        {finalConsulting.status === "completed" && (
          <div className="bg-white rounded-[32px] border-4 border-indigo-200 p-10 shadow-xl">
            <h4 className="text-3xl font-black text-indigo-700 mb-6">📄 컨설팅 리포트</h4>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-lg text-slate-700 leading-relaxed">
                {finalConsulting.report}
              </pre>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([finalConsulting.report], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `사근복컨설팅_${companyInfo.companyName}_${new Date().toISOString().split("T")[0]}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-6 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-lg"
            >
              💾 리포트 다운로드
            </button>
          </div>
        )}

        {finalConsulting.status === "error" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 font-bold">
            {finalConsulting.report}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="bg-slate-50 rounded-[32px] p-8 shadow-lg">
        <h4 className="text-2xl font-black text-slate-700 mb-6">진행 현황</h4>
        <div className="space-y-3">
          {[
            { name: "1단계: 재무제표", status: step1.status },
            { name: "2단계: 구인구직", status: step2.status },
            { name: "3단계: 직원 리뷰", status: step3.status },
            { name: "4단계: 절세계산기", status: step4.status },
            { name: "최종: 컨설팅", status: finalConsulting.status },
          ].map((step, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-slate-100">
              <span className="font-bold text-slate-700">{step.name}</span>
              {getStatusBadge(step.status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
