// 구인구직(잡코리아 등) '복지제도/채용메시지' 분석 프롬프트

module.exports = {
  systemPrompt: `당신은 사근복닷컴 컨설턴트존의 "복지제도·채용메시지 분석" 수석 컨설턴트 AI입니다.
입력된 구인구직 공고/기업소개 텍스트에서 복지 항목을 분류·정리하고,
(선택) 재무제표의 복리후생비 등 비용과 정합성을 점검하여 "말-돈-운영" 관점으로 진단합니다.

규칙:
- 절대 임의로 사실을 만들어내지 않습니다. 없으면 unknown/자료부족으로 표기합니다.
- 표/체크리스트/우선순위 로드맵 중심으로, 대표/CFO가 바로 실행할 수 있게 작성합니다.
- 결과는 지정된 JSON 스키마로만 출력합니다(문장/마크다운 금지).
- 복지 항목 분류: 보상|휴가|근무|성장|건강|가족|문화
- 사근복(사내근로복지기금) 프로그램으로 연결 가능한 항목을 우선 식별합니다.`,

  userPromptTemplate: (data) => `아래 입력을 바탕으로 복지제도·채용메시지 분석 리포트를 JSON으로 작성해주세요.
특히 1) 복지 항목 인벤토리 2) 동종업 대비 갭 3) 재무(복리후생비)와의 정합성 4) 사근복으로 보완 가능한 프로그램을 우선순위로 제시해주세요.

[INPUT JSON]
${JSON.stringify(data, null, 2)}

[OUTPUT JSON SCHEMA]
{
  "meta": { "company_name": "", "source": "", "generated_at": "" },
  "summary": {
    "benefit_strengths": [{ "title": "", "evidence": "" }],
    "benefit_gaps": [{ "title": "", "risk": "high|medium|low", "evidence": "" }],
    "positioning": { "message": "", "consistency_score": 0 }
  },
  "benefit_inventory": {
    "table": [
      { "category": "보상|휴가|근무|성장|건강|가족|문화", "item": "", "present": "yes|no|unknown", "evidence": "" }
    ]
  },
  "financial_alignment": {
    "welfare_cost_ratio": { "value": "", "comment": "unknown 가능" },
    "message_vs_spend": { "evaluation": "일치|부분일치|불일치|자료부족", "comment": "" }
  },
  "recommendations": [
    { "priority": "high|medium|low", "action": "", "expected_impact": "", "owner": "대표|재무|노무|외부" }
  ],
  "sagunbok_link": {
    "fit": "적합|보완필요|부적합|자료부족",
    "why": "",
    "recommended_programs": [
      { "program": "", "reason": "", "budget_hint": "" }
    ]
  },
  "next_data_requests": ["", ""]
}`,

  // JSON 스키마 검증
  validateSchema: (result) => {
    const required = ['meta', 'summary', 'benefit_inventory', 'recommendations', 'sagunbok_link'];
    for (const field of required) {
      if (!result[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  }
};
