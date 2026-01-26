// 리뷰 분석 리포트 UI (별점 레이더/바차트 + 토픽 감성 + 레드플래그 + 로드맵)
import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Badge, SectionCard, ScorePill, toneFromRisk } from "./ui";

type ReviewsReport = any; // 결과 JSON 그대로

function normalizeScore(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function ReviewsReportView({ report }: { report: ReviewsReport }) {
  const meta = report?.meta ?? {};
  const summary = report?.summary_one_page ?? {};
  const ratingTable = report?.rating_diagnosis?.table ?? [];
  const topics = report?.topic_sentiment?.topics ?? [];
  const redFlags = report?.rating_diagnosis?.red_flags ?? [];
  const mapping = report?.sagunbok_program_mapping ?? [];
  const roadmap = report?.roadmap ?? {};

  const radarData = useMemo(() => {
    // dimension: 워라밸|연봉/복지|조직문화|경영진|성장
    return ratingTable.map((r: any) => ({
      dim: r.dimension,
      score: normalizeScore(r.score),
    }));
  }, [ratingTable]);

  const topicBar = useMemo(() => {
    // sentiment: pos/mix/neg
    const weight = (s: string) => (s === "pos" ? 1 : s === "mix" ? 0 : -1);
    return topics.map((t: any) => ({
      topic: t.topic,
      sentiment: weight(t.sentiment),
    }));
  }, [topics]);

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* 헤더 요약 */}
      <SectionCard
        title="요약(1p)"
        right={
          <Badge tone={toneFromRisk(summary?.overall_assessment)}>
            {summary?.overall_assessment ?? "자료부족"}
          </Badge>
        }
      >
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <ScorePill value={meta?.sample_size ?? 0} label="표본수(리뷰)" />
          <ScorePill value={(summary?.top_3_pain_points ?? []).length} label="핵심 Pain 포인트" />
          <ScorePill value={(summary?.top_3_strengths ?? []).length} label="강점 토픽" />
        </div>

        <div style={{ marginTop: '16px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '12px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Top 3 Pain Points</div>
            <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
              {(summary?.top_3_pain_points ?? []).map((p: any, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: 600 }}>{p.topic}</div>
                    <div style={{ color: '#6b7280' }}>{p.evidence}</div>
                  </div>
                  <Badge tone={toneFromRisk(p.severity)}>{p.severity}</Badge>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '12px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Top 3 Strengths</div>
            <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
              {(summary?.top_3_strengths ?? []).map((s: any, i: number) => (
                <li key={i} style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: 600 }}>{s.topic}</div>
                  <div style={{ color: '#6b7280' }}>{s.evidence}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* 별점 진단 차트 */}
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <SectionCard title="별점 항목 레이더(체감 구조)">
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            * 0~5점 기준. 점수 누락 시 0으로 표시될 수 있음(입력데이터 확인 필요).
          </div>
        </SectionCard>

        <SectionCard title="토픽 감성(긍/부 경향)">
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" tick={{ fontSize: 11 }} interval={0} angle={-10} height={60} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sentiment" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            * pos=+1 / mix=0 / neg=-1로 단순화한 지표(리뷰 텍스트 기반).
          </div>
        </SectionCard>
      </div>

      {/* 레드플래그 */}
      <SectionCard title="레드플래그(리스크 신호)">
        {redFlags.length === 0 && (
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            표시된 레드플래그가 없습니다(또는 자료부족).
          </div>
        )}
        <div style={{ display: 'grid', gap: '8px' }}>
          {redFlags.map((f: any, i: number) => (
            <div key={i} style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{f.flag}</div>
                <Badge tone="warn">점검</Badge>
              </div>
              <div style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>{f.reason}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 사근복 매핑 테이블 */}
      <SectionCard title="사근복 프로그램 매핑(리뷰 토픽 → 처방)">
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>Pain Point(토픽)</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>추천 사근복 프로그램</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>적합 사유</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>예산 힌트</th>
              </tr>
            </thead>
            <tbody>
              {mapping.map((m: any, i: number) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{m.pain_point}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{m.sagunbok_program}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{m.why_fit}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{m.budget_hint}</td>
                </tr>
              ))}
              {mapping.length === 0 && (
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', color: '#6b7280' }} colSpan={4}>
                    매핑 결과가 없습니다(또는 자료부족). 리뷰 토픽/사근복 프로그램 후보를 입력하면 자동 생성됩니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 로드맵 */}
      <SectionCard title="실행 로드맵(30-60-90 / 6개월 / 12개월)">
        <RoadmapGrid roadmap={roadmap} />
      </SectionCard>
    </div>
  );
}

function RoadmapGrid({ roadmap }: { roadmap: any }) {
  const blocks = [
    { key: "days_30_60_90", label: "30-60-90일" },
    { key: "month_6", label: "6개월" },
    { key: "month_12", label: "12개월" },
  ];

  return (
    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
      {blocks.map((b) => (
        <div key={b.key} style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '12px' }}>
          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>{b.label}</div>
          <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
            {(roadmap?.[b.key] ?? []).map((t: any, i: number) => (
              <li key={i} style={{ borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{t.task}</div>
                  <Badge tone={toneFromRisk(t.impact)}>{t.impact ?? "unknown"}</Badge>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Owner: {t.owner}</div>
              </li>
            ))}
            {(roadmap?.[b.key] ?? []).length === 0 && (
              <li style={{ fontSize: '13px', color: '#6b7280' }}>항목 없음(자료부족).</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
