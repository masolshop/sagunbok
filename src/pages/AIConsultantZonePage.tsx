import React, { useState, useEffect, useRef } from "react";

/**
 * AIConsultantZonePage.tsx
 * AI 컨설턴트 존 - 통합 기업분석 플랫폼
 * 1단계: 재무제표 업로드
 * 2단계: 구인구직 크롤링 (잡코리아/사람인)
 * 3단계: 리뷰 크롤링 (블라인드/잡플래닛)
 * 4단계: 절세계산기 데이터 종합
 * 최종: 사내근로복지기금 컨설팅 생성
 */

const API_BASE_URL = "https://sagunbok.com";

type StageStatus = "pending" | "processing" | "completed" | "error";

type CompanyInfo = {
  companyName: string;
  ceoName: string;
  businessNumber: string;
};

type Stage1Data = {
  status: StageStatus;
  balanceSheet: any;
  incomeStatement: any;
  cashFlow: any;
  summary: string;
};

type Stage2Data = {
  status: StageStatus;
  jobSites: string[];
  welfareItems: string[];
  salaryRange: string;
  summary: string;
};

type Stage3Data = {
  status: StageStatus;
  reviewSites: string[];
  rating: number;
  pros: string[];
  cons: string[];
  keywords: string[];
  summary: string;
};

type Stage4Data = {
  status: StageStatus;
  calculatorResults: any;
  summary: string;
};

type FinalReport = {
  status: StageStatus;
  reportUrl: string;
  reportText: string;
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

export default function AIConsultantZonePage() {
  // API Key
  const [selectedModel, setSelectedModel] = useState<"claude" | "gpt" | "gemini">("claude");
  const [apiKeys, setApiKeys] = useState<{ claude: boolean; gpt: boolean; gemini: boolean }>({
    claude: false,
    gpt: false,
    gemini: false,
  });
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyMsg, setApiKeyMsg] = useState("");

  // 기업 기본정보
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    ceoName: "",
    businessNumber: "",
  });

  // 각 단계별 상태
  const [stage1, setStage1] = useState<Stage1Data>({
    status: "pending",
    balanceSheet: null,
    incomeStatement: null,
    cashFlow: null,
    summary: "",
  });

  const [stage2, setStage2] = useState<Stage2Data>({
    status: "pending",
    jobSites: [],
    welfareItems: [],
    salaryRange: "",
    summary: "",
  });

  const [stage3, setStage3] = useState<Stage3Data>({
    status: "pending",
    reviewSites: [],
    rating: 0,
    pros: [],
    cons: [],
    keywords: [],
    summary: "",
  });

  const [stage4, setStage4] = useState<Stage4Data>({
    status: "pending",
    calculatorResults: null,
    summary: "",
  });

  const [finalReport, setFinalReport] = useState<FinalReport>({
    status: "pending",
    reportUrl: "",
    reportText: "",
  });

  // 파일 업로드
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      const j = await r.json();
      if (j.ok && j.keys) {
        setApiKeys(j.keys);
      }
    } catch {}
  };

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

  // 1단계: 재무제표 업로드 및 분석
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
    setUploadedFile(file);
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
      alert("AI API 키를 먼저 등록해주세요.");
      return;
    }

    setStage1({ ...stage1, status: "processing" });

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
        setStage1({
          status: "completed",
          balanceSheet: data.analysis.balance_sheet,
          incomeStatement: data.analysis.income_statement,
          cashFlow: data.analysis.cash_flow,
          summary: data.analysis.summary || "재무제표 분석 완료",
        });
        alert("✅ 1단계 완료: 재무제표 분석 성공!");
      } else {
        throw new Error(data.error || "분석 실패");
      }
    } catch (err: any) {
      setStage1({ ...stage1, status: "error" });
      alert(`❌ 분석 실패: ${err.message}`);
    }
  };

  // 2단계: 구인구직 크롤링
  const startJobCrawling = async () => {
    if (!companyInfo.companyName) {
      alert("기업명을 먼저 입력해주세요.");
      return;
    }

    setStage2({ ...stage2, status: "processing" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/crawl-job-sites`, {
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
        setStage2({
          status: "completed",
          jobSites: data.jobSites || [],
          welfareItems: data.welfareItems || [],
          salaryRange: data.salaryRange || "",
          summary: data.summary || "",
        });
        alert("✅ 2단계 완료: 구인구직 크롤링 성공!");
      } else {
        throw new Error(data.error || "크롤링 실패");
      }
    } catch (err: any) {
      setStage2({ ...stage2, status: "error" });
      alert(`❌ 크롤링 실패: ${err.message}`);
    }
  };

  // 3단계: 리뷰 크롤링
  const startReviewCrawling = async () => {
    if (!companyInfo.companyName) {
      alert("기업명을 먼저 입력해주세요.");
      return;
    }

    setStage3({ ...stage3, status: "processing" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/crawl-review-sites`, {
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
        setStage3({
          status: "completed",
          reviewSites: data.reviewSites || [],
          rating: data.rating || 0,
          pros: data.pros || [],
          cons: data.cons || [],
          keywords: data.keywords || [],
          summary: data.summary || "",
        });
        alert("✅ 3단계 완료: 리뷰 크롤링 성공!");
      } else {
        throw new Error(data.error || "크롤링 실패");
      }
    } catch (err: any) {
      setStage3({ ...stage3, status: "error" });
      alert(`❌ 크롤링 실패: ${err.message}`);
    }
  };

  // 4단계: 절세계산기 데이터 종합
  const integrateCalculatorData = async () => {
    setStage4({ ...stage4, status: "processing" });

    try {
      // 절세계산기 결과 가져오기 (로컬스토리지 또는 API)
      const calcResults = localStorage.getItem("calculator_results");
      if (calcResults) {
        setStage4({
          status: "completed",
          calculatorResults: JSON.parse(calcResults),
          summary: "절세계산기 데이터 통합 완료",
        });
        alert("✅ 4단계 완료: 절세계산기 데이터 통합!");
      } else {
        throw new Error("절세계산기 데이터가 없습니다.");
      }
    } catch (err: any) {
      setStage4({ ...stage4, status: "error" });
      alert(`❌ 데이터 통합 실패: ${err.message}`);
    }
  };

  // 최종: 컨설팅 리포트 생성
  const generateFinalReport = async () => {
    // 모든 단계 완료 확인
    if (
      stage1.status !== "completed" ||
      stage2.status !== "completed" ||
      stage3.status !== "completed" ||
      stage4.status !== "completed"
    ) {
      alert("모든 단계를 완료해야 최종 리포트를 생성할 수 있습니다.");
      return;
    }

    setFinalReport({ ...finalReport, status: "processing" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/generate-consulting-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          companyInfo,
          stage1Data: stage1,
          stage2Data: stage2,
          stage3Data: stage3,
          stage4Data: stage4,
          modelType: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setFinalReport({
          status: "completed",
          reportUrl: data.reportUrl || "",
          reportText: data.reportText || "",
        });
        alert("✅ 최종 컨설팅 리포트 생성 완료!");
      } else {
        throw new Error(data.error || "리포트 생성 실패");
      }
    } catch (err: any) {
      setFinalReport({ ...finalReport, status: "error" });
      alert(`❌ 리포트 생성 실패: ${err.message}`);
    }
  };

  const getStatusBadge = (status: StageStatus) => {
    const badges = {
      pending: { text: "대기 중", color: "bg-gray-100 text-gray-600" },
      processing: { text: "처리 중...", color: "bg-yellow-100 text-yellow-700 animate-pulse" },
      completed: { text: "완료 ✓", color: "bg-green-100 text-green-700" },
      error: { text: "오류 ✗", color: "bg-red-100 text-red-700" },
    };
    return badges[status];
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">🎯 AI 컨설턴트 존</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 mt-6 font-bold leading-relaxed">
          통합 기업분석 → 사내근로복지기금 컨설팅 자동화 플랫폼
        </p>
      </header>

      {/* API Key Section */}
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
              <option value="claude">Claude 3.5 Sonnet (추천)</option>
              <option value="gpt">GPT-4 Turbo</option>
              <option value="gemini">Gemini 2.0 Flash</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-blue-700 block">API Key 입력</label>
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder={
                  selectedModel === "claude" ? "sk-ant-api03-..." : selectedModel === "gpt" ? "sk-..." : "AIzaSy..."
                }
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
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-10">
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
              placeholder="예: 테스트주식회사"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">대표자명 *</label>
            <input
              type="text"
              value={companyInfo.ceoName}
              onChange={(e) => setCompanyInfo({ ...companyInfo, ceoName: e.target.value })}
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 text-2xl font-bold outline-none shadow-inner"
              placeholder="예: 홍길동"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">사업자등록번호 *</label>
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

      {/* 1단계: 재무제표 업로드 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[48px] border-4 border-purple-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-4 text-purple-700 font-black text-3xl lg:text-4xl">
            <span>📊</span> 1단계: 재무제표 업로드 분석
          </h3>
          <span className={`px-5 py-3 rounded-full font-black text-lg ${getStatusBadge(stage1.status).color}`}>
            {getStatusBadge(stage1.status).text}
          </span>
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
          {stage1.status === "processing" ? (
            <div className="space-y-4">
              <div className="text-6xl animate-pulse">⏳</div>
              <p className="text-2xl font-black text-purple-700">AI가 재무제표를 분석하고 있습니다...</p>
            </div>
          ) : stage1.status === "completed" ? (
            <div className="space-y-4">
              <div className="text-6xl">✅</div>
              <p className="text-2xl font-black text-green-700">재무제표 분석 완료!</p>
              <p className="text-lg text-slate-600">{stage1.summary}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📁</div>
              <p className="text-2xl font-black text-purple-700">PDF/Excel 파일을 드래그 또는 클릭</p>
            </div>
          )}
        </div>
      </div>

      {/* 2단계: 구인구직 크롤링 */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[48px] border-4 border-blue-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="flex items-center gap-4 text-blue-700 font-black text-3xl lg:text-4xl">
              <span>💼</span> 2단계: 구인구직 복지항목 크롤링
            </h3>
            <p className="text-xl text-blue-600 font-bold mt-2">잡코리아 / 사람인 / 인크루트</p>
          </div>
          <span className={`px-5 py-3 rounded-full font-black text-lg ${getStatusBadge(stage2.status).color}`}>
            {getStatusBadge(stage2.status).text}
          </span>
        </div>

        <button
          onClick={startJobCrawling}
          disabled={stage2.status === "processing"}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[32px] py-8 text-2xl font-black shadow-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {stage2.status === "processing" ? "⏳ 크롤링 중..." : "🚀 크롤링 시작"}
        </button>

        {stage2.status === "completed" && (
          <div className="bg-white rounded-[24px] p-6 space-y-4">
            <p className="font-bold text-lg">✅ 크롤링 완료!</p>
            <p className="text-slate-600">복지항목: {stage2.welfareItems.join(", ")}</p>
            <p className="text-slate-600">연봉범위: {stage2.salaryRange}</p>
          </div>
        )}
      </div>

      {/* 3단계: 리뷰 크롤링 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[48px] border-4 border-green-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="flex items-center gap-4 text-green-700 font-black text-3xl lg:text-4xl">
              <span>💬</span> 3단계: 직원 리뷰 크롤링
            </h3>
            <p className="text-xl text-green-600 font-bold mt-2">블라인드 / 잡플래닛</p>
          </div>
          <span className={`px-5 py-3 rounded-full font-black text-lg ${getStatusBadge(stage3.status).color}`}>
            {getStatusBadge(stage3.status).text}
          </span>
        </div>

        <button
          onClick={startReviewCrawling}
          disabled={stage3.status === "processing"}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[32px] py-8 text-2xl font-black shadow-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {stage3.status === "processing" ? "⏳ 크롤링 중..." : "🚀 크롤링 시작"}
        </button>

        {stage3.status === "completed" && (
          <div className="bg-white rounded-[24px] p-6 space-y-4">
            <p className="font-bold text-lg">✅ 리뷰 분석 완료!</p>
            <p className="text-slate-600">평점: {stage3.rating}/5.0</p>
            <p className="text-slate-600">장점: {stage3.pros.slice(0, 3).join(", ")}</p>
            <p className="text-slate-600">단점: {stage3.cons.slice(0, 3).join(", ")}</p>
          </div>
        )}
      </div>

      {/* 4단계: 절세계산기 데이터 */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[48px] border-4 border-amber-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-4 text-amber-700 font-black text-3xl lg:text-4xl">
            <span>🧮</span> 4단계: 절세계산기 데이터 종합
          </h3>
          <span className={`px-5 py-3 rounded-full font-black text-lg ${getStatusBadge(stage4.status).color}`}>
            {getStatusBadge(stage4.status).text}
          </span>
        </div>

        <button
          onClick={integrateCalculatorData}
          disabled={stage4.status === "processing"}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-[32px] py-8 text-2xl font-black shadow-xl hover:from-amber-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {stage4.status === "processing" ? "⏳ 통합 중..." : "🚀 데이터 통합"}
        </button>
      </div>

      {/* 최종: 컨설팅 리포트 생성 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[48px] border-4 border-indigo-100 p-10 lg:p-14 space-y-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center gap-4 text-indigo-700 font-black text-3xl lg:text-4xl">
            <span>🚀</span> 최종: 사내근로복지기금 컨설팅
          </h3>
          <span className={`px-5 py-3 rounded-full font-black text-lg ${getStatusBadge(finalReport.status).color}`}>
            {getStatusBadge(finalReport.status).text}
          </span>
        </div>

        <button
          onClick={generateFinalReport}
          disabled={finalReport.status === "processing"}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[48px] py-10 text-3xl lg:text-4xl font-black shadow-2xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {finalReport.status === "processing" ? "⏳ 리포트 생성 중... (약 60초)" : "🎯 최종 컨설팅 리포트 생성"}
        </button>

        {finalReport.status === "completed" && (
          <div className="bg-white rounded-[32px] p-8 space-y-4">
            <p className="font-black text-2xl text-green-700">✅ 컨설팅 리포트 생성 완료!</p>
            <pre className="bg-slate-50 p-6 rounded-2xl text-sm overflow-auto max-h-96">
              {finalReport.reportText}
            </pre>
            <button
              onClick={() => {
                const blob = new Blob([finalReport.reportText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `컨설팅리포트_${companyInfo.companyName}_${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-lg"
            >
              📄 리포트 다운로드
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
