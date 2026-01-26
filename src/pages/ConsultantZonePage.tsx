import React, { useEffect, useMemo, useState } from "react";

/**
 * ConsultantZonePage.tsx
 * - 컨설턴트/어드민 계정만 접근
 * - 재무제표/리뷰/복지 데이터 기반 컨설팅 생성
 */

const API_BASE_URL = "https://sagunbok.com";
const MODULE = "CONSULTANT_ZONE" as const;

type ActionKey =
  | "FIN_DIAG"
  | "REVIEW_DIAG"
  | "WELFARE_POSITIONING"
  | "RISK_SCAN"
  | "PITCH_ONEPAGER"
  | "MEETING_SCRIPT"
  | "BENEFIT_DESIGN"
  | "DIFF_IDEAS_10";

const ACTIONS: { key: ActionKey; label: string; desc: string; color: string }[] = [
  { key: "FIN_DIAG", label: "재무 진단", desc: "재무체력/인건비·복지 여력 분석", color: "blue" },
  { key: "REVIEW_DIAG", label: "리뷰 진단", desc: "블라인드·잡플래닛 기반 조직 리스크", color: "red" },
  { key: "WELFARE_POSITIONING", label: "복지 포지셔닝", desc: "채용·유지 관점 복지 경쟁력 설계", color: "green" },
  { key: "RISK_SCAN", label: "리스크 스캔", desc: "노무/세무 리스크 신호 탐지 + 체크리스트", color: "orange" },
  { key: "PITCH_ONEPAGER", label: "대표용 1장 제안서", desc: "대표 설득용 원페이지 문안 생성", color: "purple" },
  { key: "MEETING_SCRIPT", label: "미팅 스크립트", desc: "질문 15개 + 반론 6개 + 클로징", color: "indigo" },
  { key: "BENEFIT_DESIGN", label: "복지포인트 3안", desc: "A/B/C안: 대상·조건·운영·체감", color: "pink" },
  { key: "DIFF_IDEAS_10", label: "차별화 10개", desc: "업계에서 흔치 않은 복지/제도 아이디어", color: "yellow" },
];

function nowISO() {
  return new Date().toISOString();
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text);
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

type ApiKeyStatusResponse = {
  ok: boolean;
  hasKey?: boolean;
  error?: string;
};

type AiRunResponse = {
  ok: boolean;
  module?: string;
  action?: string;
  promptVersion?: string;
  text?: string;
  createdAt?: string;
  error?: string;
};

type SavedCase = {
  id: string;
  createdAt: string;
  title: string;
  caseMeta: any;
  outputs: {
    action: ActionKey;
    createdAt: string;
    text: string;
  }[];
};

export default function ConsultantZonePage() {
  const [companyProfile, setCompanyProfile] = useState<string>("");
  const [financials, setFinancials] = useState<string>("");
  const [reviews, setReviews] = useState<string>("");
  const [welfare, setWelfare] = useState<string>("");

  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [apiKeyDraft, setApiKeyDraft] = useState<string>("");
  const [apiKeyMsg, setApiKeyMsg] = useState<string>("");

  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null);
  const [outputs, setOutputs] = useState<
    { action: ActionKey; label: string; text: string; createdAt: string; promptVersion?: string; color: string }[]
  >([]);

  const [savedCases, setSavedCases] = useState<SavedCase[]>(() => {
    const raw = localStorage.getItem("CONSULTANT_ZONE_CASES") || "[]";
    return safeJsonParse<SavedCase[]>(raw, []);
  });

  const caseMeta = useMemo(() => {
    return {
      source: "consultant-zone",
      createdAt: nowISO(),
      hint: "재무/리뷰/복지 데이터를 기반으로 사근복 컨설팅 산출",
    };
  }, []);

  const calcResult = useMemo(() => {
    return {
      companyProfile,
      financials,
      reviews,
      welfare,
    };
  }, [companyProfile, financials, reviews, welfare]);

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
        const j = (await r.json()) as ApiKeyStatusResponse;
        if (j.ok) setHasApiKey(!!j.hasKey);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("CONSULTANT_ZONE_CASES", JSON.stringify(savedCases, null, 2));
  }, [savedCases]);

  const validateInputs = () => {
    const filled = [companyProfile, financials, reviews, welfare].filter((v) => v.trim().length > 10).length;
    if (filled < 2) {
      alert("최소 2개 이상 입력(각 10자 이상)해 주세요.\n(기업 프로필/재무/리뷰/복지 중)");
      return false;
    }
    return true;
  };

  const saveApiKey = async () => {
    setApiKeyMsg("");
    const key = apiKeyDraft.trim();
    if (!key) {
      setApiKeyMsg("API 키를 입력해 주세요.");
      return;
    }
    try {
      const r = await fetch(`${API_BASE_URL}/api/consultant/api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ apiKey: key }),
      });
      const j = await r.json();
      if (!j.ok) {
        setApiKeyMsg(`저장 실패: ${j.error || "UNKNOWN"}`);
        return;
      }
      setHasApiKey(true);
      setApiKeyDraft("");
      setApiKeyMsg("✅ 저장 완료! 이제 컨설팅 생성 버튼을 사용할 수 있어요.");
    } catch (e: any) {
      setApiKeyMsg(`저장 실패: ${String(e?.message || e)}`);
    }
  };

  const runAction = async (action: ActionKey) => {
    if (!validateInputs()) return;
    if (!hasApiKey) {
      alert("컨설턴트 개인 Claude API 키 등록이 필요합니다.\n(상단의 API 키 등록 섹션)");
      return;
    }

    setLoadingAction(action);
    try {
      const r = await fetch(`${API_BASE_URL}/api/ai/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          module: MODULE,
          action,
          calcResult,
          caseMeta,
        }),
      });

      const j = (await r.json()) as AiRunResponse;
      if (!j.ok) throw new Error(j.error || "AI_RUN_FAILED");

      const actionInfo = ACTIONS.find((a) => a.key === action);
      setOutputs((prev) => [
        {
          action,
          label: actionInfo?.label || action,
          text: j.text || "",
          createdAt: j.createdAt || nowISO(),
          promptVersion: j.promptVersion,
          color: actionInfo?.color || "gray",
        },
        ...prev,
      ]);
    } catch (e: any) {
      alert(`AI 실행 실패: ${String(e?.message || e)}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const saveCaseToLocal = () => {
    if (outputs.length === 0) {
      alert("저장할 결과가 없습니다. 먼저 버튼으로 컨설팅을 생성해 주세요.");
      return;
    }
    const title = prompt("케이스 제목(회사명/미팅명) 입력", "OO병원 컨설팅") || "무제 케이스";
    const id = `cz_${Date.now()}`;

    const newCase: SavedCase = {
      id,
      createdAt: nowISO(),
      title,
      caseMeta: {
        ...caseMeta,
        title,
        companyProfile,
        financials,
        reviews,
        welfare,
      },
      outputs: outputs
        .slice()
        .reverse()
        .map((o) => ({ action: o.action, createdAt: o.createdAt, text: o.text })),
    };

    setSavedCases((prev) => [newCase, ...prev]);
    alert("✅ 로컬 저장 완료! (이 브라우저에 저장됨)");
  };

  const loadCase = (c: SavedCase) => {
    setCompanyProfile(c.caseMeta?.companyProfile || "");
    setFinancials(c.caseMeta?.financials || "");
    setReviews(c.caseMeta?.reviews || "");
    setWelfare(c.caseMeta?.welfare || "");

    setOutputs(
      (c.outputs || [])
        .slice()
        .reverse()
        .map((o) => {
          const actionInfo = ACTIONS.find((a) => a.key === o.action);
          return {
            action: o.action,
            label: actionInfo?.label || o.action,
            text: o.text,
            createdAt: o.createdAt,
            color: actionInfo?.color || "gray",
          };
        })
    );
  };

  const deleteCase = (id: string) => {
    if (!confirm("이 케이스를 삭제할까요?")) return;
    setSavedCases((prev) => prev.filter((c) => c.id !== id));
  };

  const exportOutputsAsTxt = () => {
    if (outputs.length === 0) return alert("내보낼 결과가 없습니다.");
    const text = outputs
      .slice()
      .reverse()
      .map((o) => `=== ${o.label} (${o.createdAt}) ===\n${o.text}\n`)
      .join("\n");
    downloadTextFile(`consultant_zone_${Date.now()}.txt`, text);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "from-blue-500 to-blue-600 hover:shadow-blue-500/50",
      red: "from-red-500 to-red-600 hover:shadow-red-500/50",
      green: "from-green-500 to-green-600 hover:shadow-green-500/50",
      orange: "from-orange-500 to-orange-600 hover:shadow-orange-500/50",
      purple: "from-purple-500 to-purple-600 hover:shadow-purple-500/50",
      indigo: "from-indigo-500 to-indigo-600 hover:shadow-indigo-500/50",
      pink: "from-pink-500 to-pink-600 hover:shadow-pink-500/50",
      yellow: "from-yellow-500 to-yellow-600 hover:shadow-yellow-500/50",
    };
    return colors[color] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-2">컨설턴트존 🎯</h1>
        <p className="text-slate-600 font-bold">
          재무제표 + 블라인드/잡플래닛 + 복지 데이터를 바탕으로 "사근복 컨설팅 산출물"을 버튼으로 생성합니다.
        </p>
      </div>

      {/* API Key Section */}
      <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-purple-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-black">컨설턴트 개인 Claude API Key</h3>
            <p className="text-sm text-slate-600 font-bold mt-1">
              키는 서버에 암호화 저장됩니다. (등록 후 컨설팅 생성 가능)
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full font-black text-sm ${
              hasApiKey ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {hasApiKey ? "✓ 등록됨" : "⚠ 미등록"}
          </div>
        </div>

        {!hasApiKey && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder="sk-ant-... (Claude API Key)"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none font-bold"
              />
              <button
                onClick={saveApiKey}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white font-black hover:bg-purple-700 transition-colors"
              >
                API 키 저장
              </button>
            </div>
            {apiKeyMsg && <p className="text-sm font-bold text-slate-600">{apiKeyMsg}</p>}
          </div>
        )}

        {hasApiKey && (
          <p className="text-sm font-black text-green-600">
            ✅ 등록 완료. 아래 버튼을 눌러 컨설팅 산출물을 생성하세요.
          </p>
        )}
      </div>

      {/* Inputs 4 Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TextAreaCard
          title="1) 기업 프로필"
          hint="업종/규모/지역/인력구성/최근 이슈(노무·세무·채용) 등"
          value={companyProfile}
          onChange={setCompanyProfile}
        />
        <TextAreaCard
          title="2) 재무제표 요약"
          hint="손익/BS/현금흐름 핵심 숫자 + 인건비/복후비/이자/유보금 등"
          value={financials}
          onChange={setFinancials}
        />
        <TextAreaCard
          title="3) 블라인드·잡플래닛 요약"
          hint="별점/키워드/장점·단점/이직신호/경영평가 등(복붙)"
          value={reviews}
          onChange={setReviews}
        />
        <TextAreaCard
          title="4) 현재 복지/예산"
          hint="현재 복지 항목/복후비/운영방식/예산 범위/사근복 여부"
          value={welfare}
          onChange={setWelfare}
        />
      </div>

      {/* Action Buttons */}
      <div className="mb-6 p-6 bg-white rounded-3xl border-2 border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-black">컨설팅 생성 버튼</h3>
            <p className="text-sm text-slate-600 font-bold mt-1">
              입력 데이터를 바탕으로 사근복 컨설팅 산출물을 생성합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveCaseToLocal}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-900 transition-colors text-sm"
            >
              케이스 저장
            </button>
            <button
              onClick={exportOutputsAsTxt}
              className="px-4 py-2 rounded-xl bg-slate-600 text-white font-black hover:bg-slate-700 transition-colors text-sm"
            >
              TXT 내보내기
            </button>
            <button
              onClick={() => setOutputs([])}
              className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-700 font-black hover:bg-slate-50 transition-colors text-sm"
            >
              결과 초기화
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => runAction(a.key)}
              disabled={!!loadingAction}
              className={`
                p-4 rounded-2xl font-black text-white text-left
                bg-gradient-to-r ${getColorClasses(a.color)}
                hover:shadow-lg transition-all transform hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                ${loadingAction === a.key ? "animate-pulse" : ""}
              `}
            >
              <div className="text-base mb-2">{loadingAction === a.key ? "생성 중..." : a.label}</div>
              <div className="text-xs opacity-90">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div className="space-y-4 mb-6">
        {outputs.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center text-slate-500">
            아직 생성된 컨설팅 결과가 없습니다. 위 버튼을 눌러 생성해 보세요.
          </div>
        ) : (
          outputs.map((o, idx) => (
            <div key={`${o.action}_${idx}`} className="p-6 bg-white rounded-3xl border-2 border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-black">
                    {o.label}{" "}
                    <span className="text-sm text-slate-400 font-normal">({o.action})</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    생성: {o.createdAt} {o.promptVersion && `· prompt ${o.promptVersion}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(o.text)}
                    className="px-3 py-2 rounded-xl bg-sky-500 text-white font-black hover:bg-sky-600 transition-colors text-sm"
                  >
                    복사
                  </button>
                  <button
                    onClick={() => downloadTextFile(`${o.action}_${Date.now()}.txt`, o.text)}
                    className="px-3 py-2 rounded-xl bg-slate-600 text-white font-black hover:bg-slate-700 transition-colors text-sm"
                  >
                    저장
                  </button>
                </div>
              </div>

              <pre className="whitespace-pre-wrap bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm leading-relaxed">
                {o.text}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Saved Cases */}
      <div className="p-6 bg-white rounded-3xl border-2 border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-black">저장된 케이스(로컬)</h3>
            <p className="text-sm text-slate-600 font-bold mt-1">
              브라우저에만 저장됩니다. (Phase2에서 DB/고객관리로 확장)
            </p>
          </div>
          <div className="text-sm font-black text-slate-400">총 {savedCases.length}개</div>
        </div>

        {savedCases.length === 0 ? (
          <p className="text-slate-500 py-4">저장된 케이스가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {savedCases.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-black">{c.title}</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {c.createdAt} · outputs {c.outputs?.length || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadCase(c)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-900 transition-colors text-sm"
                  >
                    불러오기
                  </button>
                  <button
                    onClick={() => deleteCase(c.id)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-black hover:bg-red-600 transition-colors text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Hint */}
      <div className="mt-6 text-xs text-slate-500 leading-relaxed">
        <p>
          · 팁: 블라인드/잡플래닛은 표본·편향이 있으니 "최근 리뷰/키워드/별점/경영평가" 중심으로 요약해서
          붙여넣으면 결과 품질이 확 올라갑니다.
        </p>
        <p className="mt-2">
          · Phase2 확장: DB 저장(고객/기업별 케이스), PDF 생성, 자료 업로드(재무제표 파일), 크롤링/요약
          자동화(법적/약관 준수)로 확장 가능.
        </p>
      </div>
    </div>
  );
}

function TextAreaCard({
  title,
  hint,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="p-4 bg-white rounded-2xl border-2 border-slate-200">
      <h4 className="font-black mb-1">{title}</h4>
      <p className="text-xs text-slate-500 font-bold mb-3">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="여기에 붙여넣기/요약 입력..."
        className="w-full min-h-[160px] resize-vertical rounded-xl border-2 border-slate-200 p-3 font-bold leading-relaxed bg-slate-50 focus:border-purple-500 focus:outline-none"
      />
    </div>
  );
}
