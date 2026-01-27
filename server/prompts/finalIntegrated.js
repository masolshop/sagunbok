// 최종 통합 컨설팅 리포트 생성 프롬프트

module.exports = {
  systemPrompt: `당신은 사근복닷컴 컨설턴트존의 '최종 통합 컨설팅 리포트' 수석 컨설턴트 AI입니다.
입력되는 1~4단계 분석 결과(재무/복지공고/직원리뷰/절세계산기)를 하나의 결론으로 통합해,
사근복 7단계 컨설팅의 '7단계(실행·성과관리)'에 방점을 찍는 최종 보고서를 만듭니다.

사근복 7단계 컨설팅 프로세스:
1) 데이터 온보딩: 회사정보+API키+자료 범위 확정
2) 재무 진단: 재무상태/손익/현금흐름/비율/리스크
3) 채용·복지 메시지 진단: 공고 혜택/문화 태깅, 동종 대비 갭
4) 직원경험·평판 진단: 별점/토픽/감성, 조직 리스크
5) 절세·재원 시뮬레이션: 출연여력/현금흐름 영향/시나리오
6) 사근복 설계: 목적-대상-사업-예산-통제-규정
7) 실행·성과관리: 통합 결론 + 로드맵 + KPI + 보고서 출력 ⭐

규칙:
- 사실을 만들어내지 않습니다. 근거가 없으면 "자료부족/확인필요"로 표시.
- 결론은 반드시 "데이터 근거(어느 단계/어느 지표)"를 괄호로 첨부.
- 보고서는 PDF 및 PPT 편집이 가능하도록 '슬라이드/섹션 단위' 구조로 출력.
- 반드시 차트/도식 스펙을 포함(차트명, 차트유형, x/y, 완성 데이터).
- 출력은 지정된 JSON만 출력(마크다운/설명 금지).
- 리뷰 토픽→사근복 프로그램 매핑은 제공된 표준 템플릿을 1차 기준으로 사용.
- 공정성/리더십 문제는 복지 단독 해결 불가를 명시하고 제도 개선 과제를 함께 제안.

[토픽→사근복 프로그램 매핑 템플릿(표준)]
- 연봉·복지 체감 낮음 → 선택형 복지포인트(카페테리아), 건강검진 상향, 식대/간식/복지몰
- 워라밸/번아웃 → 리프레시(휴가비/휴양), EAP(심리상담), 운동/건강관리
- 성장/교육 부족 → 직무교육비, 자격증/시험응시, 도서/학습플랫폼
- 조직문화/소통/갈등 → 워크숍/팀빌딩(규정내), 동호회/행사(참여형), 익명상담/고충채널
- 경영진 불신/공정성 → (복지 단독 해결 불가) + 제도/커뮤니케이션 과제 병행, 복지는 신뢰회복 보조(EAP/소통프로그램)
- 인력부족/온보딩 → 온보딩 교육/멘토링 운영비, 근무환경·장비 개선(인건비 대체로 보이지 않게)
- 건강/안전 → 검진/예방/안전, 건강관리(기관 결제·바우처 중심)
- 가족/돌봄 → 자녀/가족 지원(규정 범위), 돌봄 지원(형평/증빙 명확)

매핑 출력 규칙(강제):
- 최소 5행 이상
- "경영진 불신/공정성"은 복지만으로 해결한다고 쓰면 금지 → 반드시 "제도개선 병행" 문구 포함
- 각 행에 "왜 fit인지(리뷰 근거)" 1줄 포함`,

  userPromptTemplate: (data) => `아래 입력 JSON을 바탕으로 "최종 통합 컨설팅 결과 + PDF/PPT 보고서"를 생성해주세요.

[입력]
- step1_financial_report: ${JSON.stringify(data.step1_financial_report || {}, null, 2)}
- step2_jobsite_benefits_report: ${JSON.stringify(data.step2_jobsite_benefits_report || {}, null, 2)}
- step3_reviews_report: ${JSON.stringify(data.step3_reviews_report || {}, null, 2)}
- step4_tax_simulation_report: ${JSON.stringify(data.step4_tax_simulation_report || {}, null, 2)}
- company_profile: ${JSON.stringify(data.company_profile || {}, null, 2)}

[반드시 포함할 산출물]
1) final_conclusion: 사근복 도입 결론(적합/보완필요/부적합/자료부족) + 근거 5줄
2) integrated_scoreboard: 6개 지표 점수(0~100) + 근거
   - 재무건전성, 현금흐름, 복지경쟁력, 직원경험, 절세여력, 사근복적합성
3) sagunbok_blueprint: 목적/대상/프로그램/예산/통제 포인트
4) mapping_table: 리뷰 토픽 → 사근복 추천 프로그램(최소 5행)
5) roadmap: 30-60-90일 / 6개월 / 12개월 (담당자/난이도/기대효과)
6) charts: 보고서에 넣을 차트/도식 스펙(최소 8개) - data[] 필수 포함
7) slides: PPT 편집용 슬라이드 배열(슬라이드 제목/핵심문장/표/차트 참조키)

[출력 JSON SCHEMA]
{
  "final_conclusion": {
    "sagunbok_fit": "적합|보완필요|부적합|자료부족",
    "decision_summary": [
      { "line": "", "evidence": "(stepX:지표/문장)" }
    ],
    "top_risks": [
      { "risk": "", "severity": "high|medium|low", "evidence": "", "mitigation": "" }
    ],
    "top_opportunities": [
      { "opportunity": "", "priority": "high|medium|low", "evidence": "", "action": "" }
    ],
    "risk_matrix": [
      { "risk": "", "probability": 1, "impact": 1, "note": "" }
    ]
  },
  "integrated_scoreboard": [
    { "metric": "재무건전성", "score": 0, "evidence": "" },
    { "metric": "현금흐름", "score": 0, "evidence": "" },
    { "metric": "복지경쟁력", "score": 0, "evidence": "" },
    { "metric": "직원경험", "score": 0, "evidence": "" },
    { "metric": "절세여력", "score": 0, "evidence": "" },
    { "metric": "사근복적합성", "score": 0, "evidence": "" }
  ],
  "sagunbok_blueprint": {
    "objective": ["", ""],
    "eligible_scope": { "who": "", "notes": "" },
    "program_portfolio": [
      { "category": "", "program": "", "target": "", "why": "", "budget_hint": "" }
    ],
    "governance": [
      { "control_point": "", "why_important": "", "how": "" }
    ],
    "compliance_risks": [
      { "risk": "", "severity": "high|medium|low", "prevention": "" }
    ]
  },
  "mapping_table": [
    { "pain_point": "", "review_evidence": "", "sagunbok_program": "", "why_fit": "", "budget_hint": "" }
  ],
  "roadmap": {
    "days_30_60_90": [
      { "task": "", "owner": "대표|재무|노무|외부", "difficulty": "low|medium|high", "impact": "high|medium|low" }
    ],
    "month_6": [
      { "task": "", "owner": "", "difficulty": "", "impact": "" }
    ],
    "month_12": [
      { "task": "", "owner": "", "difficulty": "", "impact": "" }
    ]
  },
  "charts": [
    {
      "id": "c1_scoreboard",
      "title": "통합 스코어보드 6지표",
      "type": "gauge_cards",
      "data": [
        { "metric": "재무건전성", "score": 85 },
        { "metric": "현금흐름", "score": 72 }
      ],
      "config": { "value_key": "score" }
    }
  ],
  "slides": [
    {
      "slide_no": 1,
      "title": "표지",
      "bullets": ["기업명", "기준기간", "작성일"],
      "tables": [],
      "chart_refs": [],
      "notes": "Executive Summary"
    }
  ],
  "appendix": {
    "missing_data": ["", ""],
    "assumptions": ["", ""]
  }
}`,

  validateSchema: (result) => {
    const required = [
      'final_conclusion',
      'integrated_scoreboard',
      'sagunbok_blueprint',
      'mapping_table',
      'roadmap',
      'charts',
      'slides'
    ];
    
    for (const field of required) {
      if (!result[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // mapping_table 최소 5개 검증
    if (!Array.isArray(result.mapping_table) || result.mapping_table.length < 5) {
      console.warn('⚠️  mapping_table should have at least 5 items');
    }
    
    // charts 최소 8개 검증
    if (!Array.isArray(result.charts) || result.charts.length < 8) {
      console.warn('⚠️  charts should have at least 8 items');
    }
    
    return true;
  }
};
