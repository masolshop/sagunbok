import React, { useState, useEffect } from "react";

/**
 * CretopReportPage.tsx
 * CRETOP 스타일 기업분석 리포트 생성 페이지
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-2">🏢 CRETOP 기업분석 리포트</h1>
        <p className="text-slate-600 font-bold">
          재무제표 기반 기업 진단 · 사근복 컨설팅 · 실행 로드맵
        </p>
      </div>

      {/* AI Model Selection */}
      <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <label className="font-black text-slate-700">AI 모델:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-bold bg-white"
          >
            <option value="claude">Claude 3.5 Sonnet</option>
            <option value="gpt">GPT-4 Turbo</option>
            <option value="gemini">Gemini 2.0 Flash</option>
          </select>
          <div
            className={`px-3 py-2 rounded-full font-black text-xs ${
              apiKeys[selectedModel] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {apiKeys[selectedModel] ? "✓ 등록됨" : "⚠ 미등록"}
          </div>
        </div>
        {!apiKeys[selectedModel] && (
          <p className="text-sm text-red-600 font-bold">
            ⚠ API Key가 등록되지 않았습니다. 컨설턴트존에서 등록해주세요.
          </p>
        )}
      </div>

      {/* Input Form */}
      <div className="mb-6 p-6 bg-white rounded-3xl border-2 border-slate-200">
        <h3 className="text-xl font-black mb-4">📝 기본 정보 (필수)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">회사명 *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="예: 테스트주식회사"
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">결산일 *</label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">대표자명</label>
            <input
              type="text"
              value={ceoName}
              onChange={(e) => setCeoName(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">임직원수</label>
            <input
              type="text"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              placeholder="예: 50명"
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-sm text-slate-700 mb-1">업종</label>
            <input
              type="text"
              value={industryName}
              onChange={(e) => setIndustryName(e.target.value)}
              placeholder="예: 제조업"
              className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <h3 className="text-xl font-black mb-4 mt-6">📊 재무제표 (JSON 형식)</h3>
        <p className="text-sm text-slate-600 font-bold mb-4">
          💡 팁: 엑셀에서 복사하거나, JSON 형식으로 입력하세요. 비어있어도 리포트는 생성됩니다.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">재무상태표 (Balance Sheet)</label>
            <textarea
              value={balanceSheet}
              onChange={(e) => setBalanceSheet(e.target.value)}
              placeholder='{"자산총계": 5000000000, "부채총계": 2000000000, "자본총계": 3000000000}'
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">손익계산서 (Income Statement)</label>
            <textarea
              value={incomeStatement}
              onChange={(e) => setIncomeStatement(e.target.value)}
              placeholder='{"매출액": 10000000000, "영업이익": 1000000000, "당기순이익": 800000000}'
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">현금흐름표 (Cashflow)</label>
            <textarea
              value={cashflow}
              onChange={(e) => setCashflow(e.target.value)}
              placeholder='{"영업활동현금흐름": 1200000000, "투자활동현금흐름": -500000000}'
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm"
              rows={4}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`mt-6 w-full px-6 py-4 rounded-xl font-black text-white text-lg transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }`}
        >
          {loading ? "🔄 리포트 생성 중..." : "🚀 CRETOP 리포트 생성"}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-700 font-bold">❌ {errorMsg}</p>
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-black text-green-900">{report.report_meta.company_name}</h2>
                <p className="text-sm text-green-700 font-bold mt-1">
                  기준일: {report.report_meta.statement_period || statementDate} | 생성: {new Date(report.report_meta.generated_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <button
                onClick={downloadJSON}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-black hover:bg-green-700 transition-colors"
              >
                📥 JSON 다운로드
              </button>
            </div>
            <div className="text-2xl font-black text-green-900">{report.summary_one_page.headline}</div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.summary_one_page.key_findings.slice(0, 3).map((finding, idx) => (
              <div key={idx} className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="text-xs font-black text-blue-600 mb-1">핵심 발견 {idx + 1}</div>
                <div className="font-black text-blue-900">{finding.title}</div>
                <div className="text-sm text-blue-700 mt-2">{finding.evidence}</div>
              </div>
            ))}
          </div>

          {/* Executive Overview */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200">
            <h3 className="text-2xl font-black mb-4">📈 경영진단 종합개요</h3>
            <div className="mb-4">
              <span className="text-lg font-black">종합 평가: </span>
              <span
                className={`px-4 py-2 rounded-full font-black ${
                  report.executive_overview.overall_grade === "우수"
                    ? "bg-green-100 text-green-700"
                    : report.executive_overview.overall_grade === "양호"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {report.executive_overview.overall_grade}
              </span>
            </div>
            <ul className="space-y-2">
              {report.executive_overview.diagnosis_lines.map((line, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 font-black mr-2">•</span>
                  <span className="font-bold text-slate-700">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Issue Check */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200">
            <h3 className="text-2xl font-black mb-4">⚠️ 이슈 체크</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-2 text-left font-black">항목</th>
                    <th className="px-4 py-2 text-left font-black">현재값</th>
                    <th className="px-4 py-2 text-left font-black">상태</th>
                    <th className="px-4 py-2 text-left font-black">코멘트</th>
                  </tr>
                </thead>
                <tbody>
                  {report.issue_check.table.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-bold">{item.item}</td>
                      <td className="px-4 py-3">{item.current_value}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-black ${
                            item.status === "checked"
                              ? "bg-red-100 text-red-700"
                              : item.status === "not_checked"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status === "checked" ? "✓ 체크" : item.status === "not_checked" ? "정상" : "확인필요"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lifecycle */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200">
            <h3 className="text-2xl font-black mb-4">🔄 기업 라이프사이클</h3>
            <div className="mb-4">
              <span className="text-lg font-black">현재 단계: </span>
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-black">
                {report.lifecycle.stage}
              </span>
            </div>
            <div className="mb-4">
              <p className="font-bold text-slate-600">근거: {report.lifecycle.basis.join(", ")}</p>
            </div>
            <h4 className="font-black mb-2">단계별 우선과제:</h4>
            <ul className="space-y-2">
              {report.lifecycle.stage_tasks.map((task, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-purple-600 font-black mr-2">→</span>
                  <span className="font-bold">
                    {task.task} <span className="text-sm text-slate-500">({task.owner})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roadmap */}
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-200">
            <h3 className="text-2xl font-black mb-4">🗺️ 실행 로드맵</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black mb-3 text-red-600">🔥 30-60-90일 (긴급)</h4>
                <ul className="space-y-2">
                  {report.roadmap.days_30_60_90.map((item, idx) => (
                    <li key={idx} className="p-3 bg-red-50 rounded-xl">
                      <div className="font-bold">{item.task}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        담당: {item.owner} | 난이도: {item.difficulty} | 기대효과: {item.expected_impact}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-black mb-3 text-orange-600">📅 6개월 (중기)</h4>
                <ul className="space-y-2">
                  {report.roadmap.month_6.map((item, idx) => (
                    <li key={idx} className="p-3 bg-orange-50 rounded-xl">
                      <div className="font-bold">{item.task}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        담당: {item.owner} | 난이도: {item.difficulty}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-black mb-3 text-green-600">🎯 12개월 (장기)</h4>
                <ul className="space-y-2">
                  {report.roadmap.month_12.map((item, idx) => (
                    <li key={idx} className="p-3 bg-green-50 rounded-xl">
                      <div className="font-bold">{item.task}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        담당: {item.owner} | 난이도: {item.difficulty}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Data Request */}
          <div className="p-6 bg-yellow-50 rounded-3xl border-2 border-yellow-200">
            <h3 className="text-2xl font-black mb-4">📋 추가 요청 자료</h3>
            <div className="space-y-4">
              {report.additional_data_request.priority_1.length > 0 && (
                <div>
                  <h4 className="font-black text-red-600 mb-2">우선순위 1 (긴급)</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.additional_data_request.priority_1.map((item, idx) => (
                      <li key={idx} className="font-bold text-slate-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.additional_data_request.priority_2.length > 0 && (
                <div>
                  <h4 className="font-black text-orange-600 mb-2">우선순위 2 (중요)</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.additional_data_request.priority_2.map((item, idx) => (
                      <li key={idx} className="font-bold text-slate-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-300">
            <h4 className="font-black mb-2">⚠️ 면책사항</h4>
            {report.disclaimer.lines.map((line, idx) => (
              <p key={idx} className="text-sm text-slate-600 font-bold">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
