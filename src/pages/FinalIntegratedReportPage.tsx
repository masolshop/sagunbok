// 최종 통합 컨설팅 리포트 페이지 (7단계 클라이맥스)
import React, { useEffect, useState } from "react";
import { SectionCard, Badge, ScorePill, toneFromRisk } from "../components/report/ui";
import { ChartRenderer } from "../components/report/ChartRenderer";

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

export default function FinalIntegratedReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 테스트 데이터 생성
  const [testData, setTestData] = useState({
    company_profile: {
      name: "삼성전자",
      industry: "전자/IT",
      period: "2024년",
      headcount: 120000
    },
    step1_financial_report: {
      financial_summary: {
        revenue: 3000000000000,
        operating_profit: 350000000000,
        net_income: 280000000000
      }
    },
    step2_jobsite_benefits_report: {
      benefit_inventory: {
        table: [
          { category: "보상", item: "복지포인트", present: "yes" },
          { category: "휴가", item: "리프레시휴가", present: "no" }
        ]
      }
    },
    step3_reviews_report: {
      rating_diagnosis: {
        table: [
          { dimension: "워라밸", score: 3.0 },
          { dimension: "연봉/복지", score: 3.5 },
          { dimension: "조직문화", score: 3.1 },
          { dimension: "경영진", score: 2.9 },
          { dimension: "성장", score: 3.3 }
        ]
      },
      topic_sentiment: {
        topics: [
          { topic: "워라밸", sentiment: "neg" },
          { topic: "복지", sentiment: "pos" },
          { topic: "성장", sentiment: "mix" }
        ]
      }
    },
    step4_tax_simulation_report: {
      funding_scenarios: {
        conservative: { amount: 50000000 },
        moderate: { amount: 100000000 },
        aggressive: { amount: 150000000 }
      }
    }
  });

  useEffect(() => {
    // sessionStorage에서 이전 리포트 로드
    const raw = sessionStorage.getItem("final_integrated_report");
    if (raw) {
      try {
        setReport(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse saved report", e);
      }
    }
  }, []);

  async function generateReport() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/ai/final-integrated`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ...testData, modelType: "claude" }), // Use registered API key from CretopReportPage
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${res.status}`);
      }

      const data = await res.json();
      setReport(data);
      
      // sessionStorage에 저장
      sessionStorage.setItem("final_integrated_report", JSON.stringify(data));
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!report) return;
    
    // 간단한 PDF 다운로드 (추후 puppeteer로 고도화)
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.report_id || "report"}_final_integrated.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const r = report?.report;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", display: "grid", gap: 16 }}>
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
          🎯 최종 통합 컨설팅 리포트 (7단계 클라이맥스)
        </h1>
        <p style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
          1~4단계 데이터(재무/복지/리뷰/절세)를 통합하여 사근복 도입 결론 및 실행 로드맵을 제시합니다.
        </p>
      </div>

      {/* 생성 버튼 */}
      {!report && (
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
          }}
        >
          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: loading
                ? "#f3f4f6"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: loading ? "#9ca3af" : "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {loading ? "⏳ 최종 리포트 생성 중..." : "🚀 최종 통합 리포트 생성"}
          </button>

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
        </div>
      )}

      {/* 리포트 내용 */}
      {report && r && (
        <>
          {/* Executive Summary */}
          <SectionCard
            title="Executive Summary"
            right={
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge tone={toneFromRisk(r?.final_conclusion?.sagunbok_fit)}>
                  {r?.final_conclusion?.sagunbok_fit || "자료부족"}
                </Badge>
                <button
                  onClick={downloadPDF}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #3b82f6",
                    background: "#eff6ff",
                    color: "#1e40af",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  📥 다운로드
                </button>
              </div>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                💡 핵심 결론
              </div>
              <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                {(r?.final_conclusion?.decision_summary ?? []).map((x: any, i: number) => (
                  <li
                    key={i}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{x.line}</div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                      {x.evidence}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#dc2626" }}>
                  ⚠️ Top Risks
                </div>
                <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                  {(r?.final_conclusion?.top_risks ?? []).map((risk: any, i: number) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      <Badge tone={toneFromRisk(risk.severity)}>{risk.severity}</Badge>
                      {" "}
                      {risk.risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#059669" }}>
                  ✨ Top Opportunities
                </div>
                <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                  {(r?.final_conclusion?.top_opportunities ?? []).map((opp: any, i: number) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      <Badge tone="good">{opp.priority}</Badge>
                      {" "}
                      {opp.opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* 통합 스코어보드 */}
          {r?.integrated_scoreboard && (
            <ChartRenderer
              chart={{
                id: "scoreboard",
                title: "통합 스코어보드 (6개 지표)",
                type: "gauge_cards",
                data: r.integrated_scoreboard,
                config: { value_key: "score" },
              }}
            />
          )}

          {/* Pain → 사근복 프로그램 매핑 */}
          <SectionCard title="Pain 토픽 → 사근복 프로그램 매핑">
            <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #e5e7eb" }}>
              <table style={{ width: "100%", textAlign: "left", fontSize: 13, borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f9fafb" }}>
                  <tr>
                    <th style={{ padding: 12, fontWeight: "bold" }}>Pain Point</th>
                    <th style={{ padding: 12, fontWeight: "bold" }}>리뷰 근거</th>
                    <th style={{ padding: 12, fontWeight: "bold" }}>추천 프로그램</th>
                    <th style={{ padding: 12, fontWeight: "bold" }}>적합 사유</th>
                    <th style={{ padding: 12, fontWeight: "bold" }}>예산 힌트</th>
                  </tr>
                </thead>
                <tbody>
                  {(r?.mapping_table ?? []).map((m: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 12 }}>{m.pain_point}</td>
                      <td style={{ padding: 12, color: "#6b7280" }}>{m.review_evidence}</td>
                      <td style={{ padding: 12, fontWeight: 600 }}>{m.sagunbok_program}</td>
                      <td style={{ padding: 12, color: "#6b7280" }}>{m.why_fit}</td>
                      <td style={{ padding: 12, color: "#6b7280" }}>{m.budget_hint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 차트 렌더링 */}
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
            {(r?.charts ?? []).map((chart: any) => (
              <ChartRenderer key={chart.id} chart={chart} />
            ))}
          </div>

          {/* 로드맵 */}
          <SectionCard title="실행 로드맵 (30-60-90일 / 6개월 / 12개월)">
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              {[
                { key: "days_30_60_90", label: "30-60-90일" },
                { key: "month_6", label: "6개월" },
                { key: "month_12", label: "12개월" },
              ].map((b) => (
                <div key={b.key} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{b.label}</div>
                  <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                    {(r?.roadmap?.[b.key] ?? []).map((t: any, i: number) => (
                      <li
                        key={i}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          backgroundColor: "#f9fafb",
                          padding: 8,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{t.task}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                          담당: {t.owner} | 난이도: {t.difficulty} | 영향: {t.impact}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
