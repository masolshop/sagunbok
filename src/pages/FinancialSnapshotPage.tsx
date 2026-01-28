import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

/**
 * FinancialSnapshotPage.tsx
 * 재무제표 스냅샷 분석 페이지 (사근복 관점)
 * - 절세계산기 스타일 UI
 * - JSON 입력 방식 (재무상태표, 손익계산서, 현금흐름표)
 * - GPT/Gemini 자동 분석
 */

const API_BASE_URL = "https://sagunbok.com";

type SnapshotData = {
  // 재무상태표 (Balance Sheet)
  balance_sheet: {
    assets?: string;
    equity?: string;
    retained_earnings?: string;
    unappropriated_retained_earnings?: string;
    advances_to_officers?: string;
  };
  // 손익계산서 (Income Statement)
  income_statement: {
    revenue?: string;
    net_income?: string;
    welfare_expense?: string;
  };
  // 현금흐름표 (Cash Flow) - 선택
  cash_flow?: {
    operating_cf?: string;
    investing_cf?: string;
    financing_cf?: string;
  };
};

export default function FinancialSnapshotPage() {
  // 기업 기본 정보
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [year, setYear] = useState("2024");
  const [employeeCount, setEmployeeCount] = useState("");
  const [unit, setUnit] = useState("원");

  // 재무 데이터 (JSON 텍스트)
  const [balanceSheetJson, setBalanceSheetJson] = useState(`{
  "자산총계": "5000000000",
  "부채총계": "2000000000",
  "자본총계": "3000000000",
  "이익잉여금": "580542964000",
  "미처분이익잉여금": "576902964000",
  "가지급금": "159135000"
}`);

  const [incomeStatementJson, setIncomeStatementJson] = useState(`{
  "매출액": "1229518853000",
  "당기순이익": "100000000000",
  "복리후생비": "789494000"
}`);

  const [cashFlowJson, setCashFlowJson] = useState(`{
  "영업활동현금흐름": "900000000",
  "투자활동현금흐름": "-200000000",
  "재무활동현금흐름": "-100000000"
}`);

  // 상태
  const [modelType, setModelType] = useState<"gpt" | "gemini">("gpt");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  // API 키 상태 확인
  const [hasApiKey, setHasApiKey] = useState(false);

  React.useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/ai/keys/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHasApiKey(data.keys?.gpt || data.keys?.gemini || false);
      }
    } catch (err) {
      console.error("API 키 확인 실패:", err);
    }
  };

  const handleAnalyze = async () => {
    if (!companyName.trim()) {
      alert("회사명을 입력해주세요.");
      return;
    }

    if (!hasApiKey) {
      alert("먼저 API 키를 등록해주세요.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult("");

    try {
      // JSON 파싱 검증
      const balanceSheet = JSON.parse(balanceSheetJson);
      const incomeStatement = JSON.parse(incomeStatementJson);
      const cashFlow = JSON.parse(cashFlowJson);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze-financial-snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: companyName,
          industry: industry || "미입력",
          year,
          employee_count: employeeCount || "미입력",
          unit,
          balance_sheet: balanceSheet,
          income_statement: incomeStatement,
          cash_flow: cashFlow,
          model_type: modelType,
        }),
      });

      if (!response.ok) {
        throw new Error(`분석 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        throw new Error(data.error || "분석에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("분석 오류:", err);
      
      // JSON 파싱 오류 처리
      if (err instanceof SyntaxError) {
        setError("재무 데이터 JSON 형식이 올바르지 않습니다. 다시 확인해주세요.");
      } else {
        setError(err.message || "알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* 헤더 */}
      <div className="bg-white border-b-4 border-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-4 shadow-lg">
              <span className="text-5xl">📊</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-800">
                재무제표 스냅샷 분석
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                사근복 관점의 30초 컨설팅 리포트
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* API 키 경고 */}
        {!hasApiKey && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <div className="font-bold text-amber-800 text-lg">API 키가 필요합니다</div>
                <div className="text-amber-700">
                  컨설턴트존에서 GPT 또는 Gemini API 키를 먼저 등록해주세요.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 입력 섹션 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 기업 기본 정보 */}
          <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏢</span>
              <h2 className="text-2xl font-black text-blue-700">기업 기본 정보</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예: (유)스태츠칩팩코리아"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  업종
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="예: 제조업 / C26129"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    기준연도
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    임직원수
                  </label>
                  <input
                    type="text"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    placeholder="예: 50명"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  단위
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="원">원</option>
                  <option value="천원">천원</option>
                  <option value="백만원">백만원</option>
                  <option value="억원">억원</option>
                </select>
              </div>
            </div>
          </div>

          {/* 모델 선택 */}
          <div className="bg-white rounded-2xl border-2 border-purple-300 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🤖</span>
              <h2 className="text-2xl font-black text-purple-700">AI 모델 선택</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all">
                <input
                  type="radio"
                  name="model"
                  value="gpt"
                  checked={modelType === "gpt"}
                  onChange={(e) => setModelType(e.target.value as "gpt")}
                  className="w-5 h-5"
                />
                <div>
                  <div className="font-bold text-gray-800">GPT (OpenAI)</div>
                  <div className="text-sm text-gray-600">Reasoning 모델 자동 선택</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all">
                <input
                  type="radio"
                  name="model"
                  value="gemini"
                  checked={modelType === "gemini"}
                  onChange={(e) => setModelType(e.target.value as "gemini")}
                  className="w-5 h-5"
                />
                <div>
                  <div className="font-bold text-gray-800">Gemini (Google)</div>
                  <div className="text-sm text-gray-600">최신 Gemini 모델 사용</div>
                </div>
              </label>
            </div>

            <div className="mt-6 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-bold mb-1">💡 팁</div>
                <div>
                  복잡한 재무 분석은 GPT의 Reasoning 모델이 유리하며,
                  빠른 분석은 Gemini가 효과적입니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 재무 데이터 입력 (JSON) */}
        <div className="space-y-6 mb-8">
          {/* 재무상태표 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-400 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💰</span>
              <h2 className="text-2xl font-black text-green-700">재무상태표 (Balance Sheet)</h2>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-300 p-4">
              <textarea
                value={balanceSheetJson}
                onChange={(e) => setBalanceSheetJson(e.target.value)}
                placeholder='{"자산총계": "5000000000", "이익잉여금": "580542964000", ...}'
                className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
              <div className="mt-2 text-sm text-green-700">
                <span className="font-bold">JSON 형식으로 입력하세요.</span> 예: 자산총계, 부채총계, 자본총계, 이익잉여금, 미처분이익잉여금, 가지급금
              </div>
            </div>
          </div>

          {/* 손익계산서 */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-400 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <h2 className="text-2xl font-black text-amber-700">손익계산서 (Income Statement)</h2>
            </div>
            <div className="bg-white rounded-xl border-2 border-amber-300 p-4">
              <textarea
                value={incomeStatementJson}
                onChange={(e) => setIncomeStatementJson(e.target.value)}
                placeholder='{"매출액": "1229518853000", "당기순이익": "100000000000", ...}'
                className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
              />
              <div className="mt-2 text-sm text-amber-700">
                <span className="font-bold">JSON 형식으로 입력하세요.</span> 예: 매출액, 당기순이익, 복리후생비
              </div>
            </div>
          </div>

          {/* 현금흐름표 */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-400 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💸</span>
              <h2 className="text-2xl font-black text-cyan-700">현금흐름표 (Cash Flow) - 선택</h2>
            </div>
            <div className="bg-white rounded-xl border-2 border-cyan-300 p-4">
              <textarea
                value={cashFlowJson}
                onChange={(e) => setCashFlowJson(e.target.value)}
                placeholder='{"영업활동현금흐름": "900000000", "투자활동현금흐름": "-200000000", ...}'
                className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
              />
              <div className="mt-2 text-sm text-cyan-700">
                <span className="font-bold">선택 사항입니다.</span> 영업/투자/재무활동 현금흐름을 입력하면 더 정확한 분석이 가능합니다.
              </div>
            </div>
          </div>
        </div>

        {/* 분석 버튼 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !hasApiKey}
            className={`px-12 py-5 rounded-2xl font-black text-xl shadow-lg transition-all transform hover:scale-105 ${
              isAnalyzing || !hasApiKey
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-3">
                <span className="animate-spin">⏳</span>
                분석 중...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span>🚀</span>
                스냅샷 리포트 생성
              </span>
            )}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-8 bg-red-50 border-2 border-red-400 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <div className="font-bold text-red-800 text-lg">분석 실패</div>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResult && (
          <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">📋</span>
              <h2 className="text-3xl font-black text-blue-700">컨설팅 스냅샷 리포트</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(analysisResult);
                  alert("✅ 리포트가 클립보드에 복사되었습니다!");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
              >
                📋 리포트 복사
              </button>
            </div>
          </div>
        )}

        {/* 가이드 */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-300 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💡</span>
            <h3 className="text-2xl font-black text-purple-700">사용 가이드</h3>
          </div>

          <div className="space-y-3 text-gray-700">
            <div className="flex gap-2">
              <span className="font-bold text-purple-700">1.</span>
              <div>
                <span className="font-bold">기업 정보</span>를 입력하고 <span className="font-bold">단위</span>를 선택하세요.
              </div>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-purple-700">2.</span>
              <div>
                <span className="font-bold">재무 데이터</span>를 JSON 형식으로 입력하세요. (복사-붙여넣기 가능)
              </div>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-purple-700">3.</span>
              <div>
                <span className="font-bold">AI 모델</span>을 선택하고 <span className="font-bold">"스냅샷 리포트 생성"</span> 버튼을 클릭하세요.
              </div>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-purple-700">4.</span>
              <div>
                30초 안에 <span className="font-bold">사근복 관점의 컨설팅 리포트</span>가 생성됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
