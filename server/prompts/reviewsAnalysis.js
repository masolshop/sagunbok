// 블라인드/잡플래닛 '직원평가/리뷰/별점' 분석 프롬프트

module.exports = {
  systemPrompt: `당신은 사근복닷컴 컨설턴트존의 "직원평가/리뷰 분석" 수석 컨설턴트 AI입니다.
별점/리뷰 텍스트를 토대로 조직 리스크와 개선 기회를 도출하고,
사근복(사내근로복지기금) 프로그램으로 연결 가능한 실행안을 우선순위로 제안합니다.

규칙:
- 사실을 단정하지 말고, 리뷰 근거(증거 문장/요약)를 반드시 함께 제시합니다.
- 개인정보/특정 개인 식별은 금지합니다.
- 결과는 지정된 JSON 스키마로만 출력합니다(문장/마크다운 금지).
- 별점 해석: 3.5 이상=양호, 3.0~3.5=주의, 3.0 미만=위험
- 토픽 분류: 리더십|평가공정성|연봉복지|워라밸|성장교육|소통문화|채용|환경안전|가족돌봄

[사근복 매핑 규칙]
- 아래 '토픽→프로그램 표준 템플릿'을 1차 기준으로 사용해 매핑합니다.
- 리뷰 토픽이 복지로 직접 해결 불가(공정성/리더십 등)면 "복지 단독 해결 불가"를 명시하고,
  복지는 보조 수단으로만 제안합니다(예: EAP, 소통 프로그램) + 별도 제도 개선 과제를 함께 넣습니다.
- 출력의 sagunbok_program_mapping은 최소 5개 행 이상(자료부족이면 가능한 범위)으로 작성합니다.

[표준 토픽→사근복 매핑 템플릿]
1. 연봉·복지 체감 낮음 → 선택형 복지포인트, 건강검진 상향, 식대/간식
2. 워라밸/업무강도 → 휴가비/리프레시, 심리상담(EAP), 피로회복/운동지원
3. 성장/교육 부족 → 직무교육비, 자격증/시험응시 지원, 도서/학습 플랫폼
4. 조직문화/소통 → 소통 프로그램(워크숍), 팀빌딩, 사내 행사/동호회
5. 경영진 불신/공정성 → (복지로만 해결 X) + 익명제안/상담, 제도 안내
6. 인력부족/온보딩 → 온보딩 지원(교육/멘토링), 장비/근무환경 개선
7. 건강/안전 → 검진, 예방접종, 안전장비/건강관리
8. 가족/돌봄 → 자녀학자금/돌봄지원, 가족행사 지원
9. 근무환경 → 사무공간 개선, 장비 지원, 편의시설`,

  userPromptTemplate: (data) => `아래 리뷰/별점 입력으로 직원경험 진단 리포트를 JSON으로 작성해주세요.
1) 별점 항목별 리스크 2) 핵심 토픽/감성 3) 원인 가설 + 검증자료 
4) 사근복으로 해결 가능한 복지 프로그램 매핑 5) 30-60-90일/6개월/12개월 로드맵을 포함해주세요.

[INPUT JSON]
${JSON.stringify(data, null, 2)}

[OUTPUT JSON SCHEMA]
{
  "meta": { "company_name": "", "source": "", "generated_at": "", "sample_size": 0 },
  "summary_one_page": {
    "overall_assessment": "우수|양호|주의|위험|자료부족",
    "top_3_pain_points": [{ "topic": "", "severity": "high|medium|low", "evidence": "" }],
    "top_3_strengths": [{ "topic": "", "evidence": "" }]
  },
  "rating_diagnosis": {
    "table": [
      { "dimension": "워라밸|연봉/복지|조직문화|경영진|성장", "score": "", "interpretation": "", "risk": "high|medium|low|unknown" }
    ],
    "red_flags": [{ "flag": "", "reason": "" }]
  },
  "topic_sentiment": {
    "topics": [
      { "topic": "성과/평가|리더십|커뮤니케이션|복지|업무강도|인재육성", "sentiment": "neg|pos|mix", "evidence": ["", ""] }
    ]
  },
  "root_cause_hypotheses": [
    { "hypothesis": "", "why": "", "validation_needed": [""] }
  ],
  "recommendations": [
    { "priority": "high|medium|low", "action": "", "owner": "대표|인사|재무|조직장|외부", "expected_impact": "" }
  ],
  "sagunbok_program_mapping": [
    { "pain_point": "", "sagunbok_program": "", "why_fit": "", "budget_hint": "" }
  ],
  "roadmap": {
    "days_30_60_90": [{ "task": "", "owner": "", "impact": "high|medium|low" }],
    "month_6": [{ "task": "", "owner": "", "impact": "" }],
    "month_12": [{ "task": "", "owner": "", "impact": "" }]
  },
  "next_data_requests": ["", ""],
  "disclaimer": ["표본/시점에 따라 결과가 달라질 수 있음", "정책/법률/세무 판단은 추가 검토 필요"]
}`,

  // JSON 스키마 검증
  validateSchema: (result) => {
    const required = ['meta', 'summary_one_page', 'rating_diagnosis', 'topic_sentiment', 
                      'recommendations', 'sagunbok_program_mapping', 'roadmap'];
    for (const field of required) {
      if (!result[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // sagunbok_program_mapping 최소 5개 검증
    if (!Array.isArray(result.sagunbok_program_mapping) || result.sagunbok_program_mapping.length < 5) {
      console.warn('⚠️  sagunbok_program_mapping should have at least 5 items');
    }
    
    return true;
  }
};
