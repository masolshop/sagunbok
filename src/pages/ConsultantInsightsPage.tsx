// 컨설턴트존 · 외부데이터 인사이트 페이지
import React, { useMemo, useState } from "react";
import { ReviewsReportView } from "../components/report/ReviewsReport";
import { JobsiteReportView } from "../components/report/JobsiteReport";

type SourceType = "jobsite" | "reviews";
type UploadPayload = { rawText: string; json?: any };

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://sagunbok.com/api";

// localStorage에서 사용자 정보 가져오기
function getAuthHeaders() {
  try {
    const userStr = localStorage.getItem("sagunbok_user");
    if (!userStr) return {};
    const user = JSON.parse(userStr);
    return { Authorization: `Bearer ${user.id}` };
  } catch {
    return {};
  }
}

export default function ConsultantInsightsPage() {
  const [tab, setTab] = useState<SourceType>("jobsite");
  const [payload, setPayload] = useState<UploadPayload>({ rawText: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [modelType, setModelType] = useState<"claude" | "gpt" | "gemini">("gpt");

  const canRun = useMemo(
    () => payload.rawText.trim().length > 0 || !!payload.json,
    [payload]
  );

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const endpoint =
        tab === "jobsite"
          ? `${API_BASE_URL}/ai/insights/jobsite`
          : `${API_BASE_URL}/ai/insights/reviews`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ...payload, modelType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setPayload((p) => ({ ...p, rawText: text }));
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16, maxWidth: 1400, margin: "0 auto" }}>
      {/* 헤더 */}
      <div
        style={{
          padding: "24px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          🔍 컨설턴트존 · 외부데이터 인사이트
        </h1>
        <p style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
          구인구직/직원리뷰 데이터를 분석하여 사근복 프로그램 추천 및 조직 진단 리포트를 생성합니다.
        </p>
      </div>

      {/* AI 모델 선택 */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          AI 모델 선택
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["claude", "gpt", "gemini"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModelType(m)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `2px solid ${modelType === m ? "#3b82f6" : "#e5e7eb"}`,
                background: modelType === m ? "#eff6ff" : "white",
                color: modelType === m ? "#1e40af" : "#374151",
                fontWeight: modelType === m ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {m === "claude" ? "Claude 3.5" : m === "gpt" ? "GPT-4" : "Gemini 2.0"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            setTab("jobsite");
            setPayload({ rawText: "" });
            setResult(null);
          }}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "2px solid",
            borderColor: tab === "jobsite" ? "#3b82f6" : "#e5e7eb",
            background: tab === "jobsite" ? "#eff6ff" : "white",
            color: tab === "jobsite" ? "#1e40af" : "#6b7280",
            fontWeight: tab === "jobsite" ? 700 : 400,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          📋 복지/채용 메시지 분석
        </button>
        <button
          onClick={() => {
            setTab("reviews");
            setPayload({ rawText: "" });
            setResult(null);
          }}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "2px solid",
            borderColor: tab === "reviews" ? "#3b82f6" : "#e5e7eb",
            background: tab === "reviews" ? "#eff6ff" : "white",
            color: tab === "reviews" ? "#1e40af" : "#6b7280",
            fontWeight: tab === "reviews" ? 700 : 400,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ⭐ 직원평판(리뷰/별점) 분석
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 16,
        }}
      >
        {/* Left: Input */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            backgroundColor: "white",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            데이터 입력
          </h2>

          <p style={{ margin: "8px 0", color: "#6b7280", fontSize: 13 }}>
            {tab === "jobsite"
              ? "구인구직 사이트(잡코리아, 사람인 등)의 복지/문화/혜택 텍스트를 붙여넣거나 CSV 파일을 업로드하세요."
              : "블라인드/잡플래닛 리뷰(장점/단점/별점)를 붙여넣거나 CSV 파일을 업로드하세요."}
          </p>

          {/* 파일 업로드 */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              CSV 파일 업로드
            </label>
            <input
              type="file"
              accept=".csv,.txt,.json"
              onChange={handleFileUpload}
              style={{ fontSize: 13 }}
            />
          </div>

          <textarea
            value={payload.rawText}
            onChange={(e) =>
              setPayload((p) => ({ ...p, rawText: e.target.value }))
            }
            placeholder={
              tab === "jobsite"
                ? "예) 공고의 복지/문화/혜택 텍스트를 붙여넣기...\n\n- 식대 지원\n- 유연근무제\n- 건강검진\n- 교육비 지원\n..."
                : "예) 리뷰(장점/단점/경영진에게 바라는 점) 텍스트를 붙여넣기...\n\n장점: 복지가 좋고...\n단점: 업무 강도가...\n별점: 워라밸 3.5, 연봉/복지 3.0..."
            }
            style={{
              width: "100%",
              minHeight: 280,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              padding: 12,
              fontSize: 13,
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={runAnalysis}
              disabled={!canRun || loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background:
                  !canRun || loading
                    ? "#f3f4f6"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: !canRun || loading ? "#9ca3af" : "white",
                cursor: !canRun || loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {loading ? "분석중..." : "🚀 분석 실행"}
            </button>

            <button
              onClick={() => {
                setPayload({ rawText: "" });
                setResult(null);
                setError("");
              }}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              초기화
            </button>
          </div>

          {error && (
            <p
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              ⚠️ {error}
            </p>
          )}
        </section>

        {/* Right: Result */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            backgroundColor: "white",
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            분석 결과
          </h2>

          {!result && !loading && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <p>분석을 실행하면 결과 카드가 표시됩니다.</p>
            </div>
          )}

          {loading && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p>AI가 데이터를 분석하고 있습니다...</p>
            </div>
          )}

          {result && result.report_type === "reviews" && (
            <ReviewsReportView report={result.report} />
          )}

          {result && result.report_type === "jobsite" && (
            <JobsiteReportView report={result.report} />
          )}
        </section>
      </div>
    </div>
  );
}
