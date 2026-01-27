// 구인구직(잡코리아 등) 복지/채용 메시지 분석 리포트 UI
import React from "react";
import { Badge, SectionCard, ScorePill, toneFromRisk } from "./ui";

type JobsiteReport = any;

export function JobsiteReportView({ report }: { report: JobsiteReport }) {
  const meta = report?.meta ?? {};
  const summary = report?.summary ?? {};
  const inventory = report?.benefit_inventory?.table ?? [];
  const financial = report?.financial_alignment ?? {};
  const recommendations = report?.recommendations ?? [];
  const sagunbok = report?.sagunbok_link ?? {};

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* 헤더 요약 */}
      <SectionCard
        title="복지제도·채용메시지 분석"
        right={
          <Badge tone={toneFromRisk(sagunbok?.fit)}>
            사근복 적합도: {sagunbok?.fit ?? "자료부족"}
          </Badge>
        }
      >
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <ScorePill value={(summary?.benefit_strengths ?? []).length} label="복지 강점" />
          <ScorePill value={(summary?.benefit_gaps ?? []).length} label="복지 갭" />
          <ScorePill 
            value={summary?.positioning?.consistency_score ?? 0} 
            label="메시지 일관성"
          />
        </div>

        <div style={{ marginTop: '16px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '12px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#059669' }}>
              ✓ 복지 강점
            </div>
            <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
              {(summary?.benefit_strengths ?? []).map((s: any, i: number) => (
                <li key={i} style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div style={{ color: '#6b7280' }}>{s.evidence}</div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '12px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#dc2626' }}>
              ⚠ 복지 갭(개선 필요)
            </div>
            <ul style={{ display: 'grid', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
              {(summary?.benefit_gaps ?? []).map((g: any, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: 600 }}>{g.title}</div>
                    <div style={{ color: '#6b7280' }}>{g.evidence}</div>
                  </div>
                  <Badge tone={toneFromRisk(g.risk)}>{g.risk}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {summary?.positioning?.message && (
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>포지셔닝 메시지</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{summary.positioning.message}</div>
          </div>
        )}
      </SectionCard>

      {/* 복지 항목 인벤토리 테이블 */}
      <SectionCard title="복지 항목 인벤토리">
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>카테고리</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>항목</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>제공 여부</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>근거</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item: any, i: number) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{item.category}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{item.item}</td>
                  <td style={{ padding: '12px' }}>
                    <Badge tone={item.present === 'yes' ? 'good' : item.present === 'no' ? 'bad' : 'neutral'}>
                      {item.present === 'yes' ? '제공' : item.present === 'no' ? '미제공' : '불명'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{item.evidence}</td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', color: '#6b7280' }} colSpan={4}>
                    복지 항목 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 재무 정합성 */}
      <SectionCard title="재무(복리후생비) 정합성">
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>복리후생비 비율</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {financial?.welfare_cost_ratio?.value ?? 'unknown'}
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
              {financial?.welfare_cost_ratio?.comment}
            </div>
          </div>

          <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>메시지 vs 집행</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              <Badge tone={
                financial?.message_vs_spend?.evaluation === '일치' ? 'good' :
                financial?.message_vs_spend?.evaluation === '부분일치' ? 'warn' :
                financial?.message_vs_spend?.evaluation === '불일치' ? 'bad' : 'neutral'
              }>
                {financial?.message_vs_spend?.evaluation ?? '자료부족'}
              </Badge>
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
              {financial?.message_vs_spend?.comment}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 권장사항 */}
      <SectionCard title="권장사항(우선순위별)">
        <div style={{ display: 'grid', gap: '8px' }}>
          {recommendations.map((r: any, i: number) => (
            <div key={i} style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '12px', backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{r.action}</div>
                <Badge tone={toneFromRisk(r.priority)}>
                  우선순위: {r.priority}
                </Badge>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                <strong>예상 효과:</strong> {r.expected_impact}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <strong>담당:</strong> {r.owner}
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <div style={{ fontSize: '13px', color: '#6b7280' }}>권장사항이 없습니다.</div>
          )}
        </div>
      </SectionCard>

      {/* 사근복 연결 */}
      <SectionCard title="사근복(사내근로복지기금) 프로그램 연결">
        <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
            적합도: {sagunbok?.fit ?? '자료부족'}
          </div>
          <div style={{ fontSize: '13px', color: '#0369a1' }}>
            {sagunbok?.why}
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>추천 프로그램</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>사유</th>
                <th style={{ padding: '12px', fontWeight: 'bold' }}>예산 힌트</th>
              </tr>
            </thead>
            <tbody>
              {(sagunbok?.recommended_programs ?? []).map((p: any, i: number) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{p.program}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{p.reason}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{p.budget_hint}</td>
                </tr>
              ))}
              {(sagunbok?.recommended_programs ?? []).length === 0 && (
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', color: '#6b7280' }} colSpan={3}>
                    추천 프로그램이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 추가 필요 데이터 */}
      {report?.next_data_requests && report.next_data_requests.length > 0 && (
        <SectionCard title="추가 필요 데이터">
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {report.next_data_requests.map((req: string, i: number) => (
              <li key={i} style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                {req}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
