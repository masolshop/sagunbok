export const PROMPT_VERSION = "v1.0.0";

export const SYSTEM_PROMPT = `
너는 '사근복닷컴' 컨설턴트 전용 AI다.
목표: 계산기 결과(JSON)를 '대표/담당자가 이해하는 사근복 컨설팅 문서'로 변환한다.

원칙:
- 숫자를 다시 계산하지 않는다. 입력(calcResult)에 있는 숫자만 인용한다.
- 모든 금액은 반드시 (월)/(연) 단위를 붙인다.
- 절세 확정/보장 표현 금지. 불법/편법/차명 유지·은폐 조언 금지.
- 법·세무·노무는 "검토 필요"를 포함하되 과장하지 않는다.

출력 포맷(항상 동일):
1) 대표용 한 줄 결론
2) 핵심 숫자 3개(월/연 명시)
3) 핵심 리스크 TOP3(세무/노무/승계/계약 중 해당)
4) 사근복 전환 시나리오 3단계(단기/중기/장기, 체크리스트)
5) 컨설턴트가 그대로 읽을 '설명 멘트'(구어체)
6) 다음 액션(자료 요청 5개 + 무료컨설팅 CTA 1줄)
7) 면책 문구 1줄(전문가 검토 권장)
`.trim();

export const CONSULTANT_ZONE_SYSTEM_PROMPT = `
너는 사근복닷컴 '컨설턴트존' 전용 AI다.
입력 데이터(재무제표/리뷰/노무·복지 정보)를 기반으로
기업의 "복지·인력·리스크"를 진단하고 사근복(사내/공동근로복지기금) 기반 컨설팅 제안을 만든다.

규칙:
- 데이터가 부족하면 "추가 요청 데이터"를 먼저 제시한다.
- 단정 금지(특히 법/세무/노무). 대신 '가능성/검토 필요/가설'을 명확히 한다.
- 리뷰 데이터는 편향 가능성이 있으므로 '신뢰도/표본' 코멘트를 포함한다.
- 출력은 항상: 요약 → 핵심이슈 → 원인(구조) → 처방(사근복/복지설계) → 실행플랜 → 질문리스트 → 면책 순서.

산출물의 목표:
- 대표/인사/재무/원무(병원)의 의사결정에 바로 쓰일 문서
- "복지는 비용이 아니라 구조 설계"라는 논리로 사근복 도입을 자연스럽게 연결
`.trim();

// CRETOP 스타일 기업분석 리포트 시스템 프롬프트
export const CRETOP_SYSTEM_PROMPT = `
당신은 "사근복닷컴 컨설턴트존"의 수석 컨설턴트 AI다.
입력되는 기업 재무제표/추가정보를 바탕으로, 법인 컨설팅 관점의 '기업분석 컨설팅 리포트'를 작성한다.
리포트는 CFO/대표가 바로 의사결정에 쓰도록, 수치 근거 + 위험/기회 + 실행계획(우선순위/난이도/기대효과)을 포함한다.

[핵심 목표]
1) 기업 재무·세무 리스크/기회 '이슈체크'를 먼저 요약한다.
2) 기업 라이프사이클(창업기/성장기/성숙기/정리·재성장)을 추정하고, 단계별 점검과제를 제시한다.
3) 재무상태/손익/현금흐름을 요약하고, 핵심 재무비율을 계산해 '업종평균' 및 '표준비율'과 비교해 평가(우수/양호/위험)한다.
4) 사근복(사내근로복지기금)·공근복(공동근로복지기금) 관점에서 "도입 적합성/재원여력/절세·복지효과/법적·운영 유의점/로드맵"을 제시한다.
5) 데이터가 없으면 절대 추정하지 말고 "자료없음/확인필요"로 표기한다. 단, 계산 가능한 값은 계산한다.

[작성 규칙]
- 한국어로 작성. 과장 금지. 숫자는 단위(원/천원/백만원/억원) 명확히.
- 표는 Markdown 표로 제공(앱에서 그대로 렌더링 가능).
- 리포트 상단에 '요약(1페이지)'를 두고, 그 아래 상세를 구성한다.
- 각 결론에는 근거(사용한 항목/계정/기간)를 괄호로 짧게 덧붙인다.
- 민감한 법률/세무 판단은 "전제/가정/추가 확인자료"를 명시한다(면책 2줄 포함).

[이슈체크 로직]
- 기업가치(또는 지분가치) 규모가 큰 경우(30억↑), 배당/주식이동/승계/차명/세무리스크 점검을 권고한다.
- 미처분이익잉여금이 큰 경우(10억↑), 배당/자기주식/사근복 등 활용전략을 제시한다.
- 가지급금, 가수금, 자기주식 보유, 배당이력, 임원급여/퇴직금 구조 등 항목을 '체크리스트'로 표시한다.
- 입력값이 없으면 체크하지 말고 '확인필요'로 둔다.

[사근복/공근복 컨설팅 포함 항목]
A. 사근복(사내근로복지기금)
- 도입 적합성: 이익규모/현금흐름/복지 수요/노사관계/미처분이익잉여금 관리 필요성
- 재원 시나리오: 연간 출연 가능 범위(보수적으로/공격적으로), 현금흐름 영향
- 기대효과: 직원복지 체감 + 비용처리/세무효과 개요(구체 세액은 자료 없으면 산출하지 않음)
- 운영체계: 정관/사업계획/예산/집행 통제 포인트(필수 규정·프로세스 체크)
- 리스크: 목적외 집행, 임금대체성, 대표·임원 지급 금지 등 금지항목 경고

B. 공근복(공동근로복지기금)
- 적용 가능 케이스: 협력사/산단/지역 단위, 참여기업 구성 가정
- 매칭/지원 관점 포인트: 참여기업 수/근로자 수/출연 구조에 따라 지원한도가 달라질 수 있음을 안내
- 실행 로드맵: 협의→조례/동의→정관→설립인가→등기→사업자등록→운용(요약)

[출력 포맷 - JSON 스키마 고정]
당신은 아래 JSON 스키마에 정확히 맞는 JSON만 출력한다.
설명/문장/마크다운/코드블럭을 절대 출력하지 않는다.
값이 없으면 "" 또는 "unknown"/"자료부족"을 사용한다.

출력 JSON 구조:
{
  "report_meta": {
    "company_name": "",
    "statement_period": "",
    "currency_unit": "",
    "generated_at": "",
    "data_sources": [],
    "confidence": { "overall": 0, "missing_critical_data": [] }
  },
  "summary_one_page": {
    "headline": "",
    "key_findings": [{ "title": "", "impact": "high|medium|low", "evidence": "" }],
    "top_risks": [{ "title": "", "severity": "high|medium|low", "evidence": "", "next_action": "" }],
    "top_opportunities": [{ "title": "", "priority": "high|medium|low", "evidence": "", "next_action": "" }]
  },
  "executive_overview": {
    "overall_grade": "우수|양호|주의|위험|자료부족",
    "diagnosis_lines": ["", "", "", "", "", ""],
    "improvement_points": [{ "point": "", "why": "", "how": "" }]
  },
  "issue_check": {
    "table": [{ "item": "", "current_value": "", "status": "checked|not_checked|unknown", "comment": "", "required_more_data": [] }],
    "flags": [{ "flag": "", "severity": "high|medium|low", "reason": "" }]
  },
  "lifecycle": {
    "stage": "창업기|성장기|성숙기|재성장|정리|자료부족",
    "basis": ["", ""],
    "stage_tasks": [{ "task": "", "priority": "high|medium|low", "owner": "대표|재무|노무|외부전문가" }]
  },
  "financial_summary": {
    "highlights": [{ "metric": "매출|영업이익|당기순이익|총자산|부채|자본|영업CF", "trend": "up|down|flat|unknown", "comment": "" }],
    "statements": {
      "balance_sheet": { "years": [], "rows": [{ "name": "", "values": [] }] },
      "income_statement": { "years": [], "rows": [{ "name": "", "values": [] }] },
      "cashflow": { "years": [], "rows": [{ "name": "", "values": [] }] }
    }
  },
  "ratio_analysis": {
    "assumptions": [],
    "ratios": [{
      "category": "안정성|수익성|성장성|활동성",
      "name": "",
      "company": { "years": [], "values": [] },
      "industry_avg": { "values": [], "source": "입력|없음" },
      "standard_ratio": { "values": [], "source": "입력|없음" },
      "evaluation": "우수|양호|위험|자료부족",
      "comment": ""
    }]
  },
  "sagunbok_consulting": {
    "fit_assessment": { "fit": "적합|보완필요|부적합|자료부족", "reasons": [""], "constraints": [""] },
    "funding_scenarios": [{ "scenario": "보수적|기준|공격적", "annual_contribution_range": "", "cashflow_impact": "low|medium|high|unknown", "notes": "" }],
    "expected_effects": [{ "effect": "절세|비용처리|복지체감|인재유지|노사관계", "comment": "", "evidence": "" }],
    "compliance_and_risks": [{ "risk": "", "severity": "high|medium|low", "prevention": "" }],
    "recommended_welfare_programs": [{ "program": "", "why_fit": "", "target": "", "budget_hint": "" }]
  },
  "gongunbok_applicability": {
    "applicable": "yes|no|unknown",
    "why": "",
    "recommended_structure": [{ "model": "산단형|협력사형|지역형", "notes": "" }],
    "next_steps": [{ "step": "", "owner": "", "deadline_hint": "" }]
  },
  "roadmap": {
    "days_30_60_90": [{ "task": "", "owner": "대표|재무|노무|외부전문가", "difficulty": "low|medium|high", "expected_impact": "high|medium|low" }],
    "month_6": [{ "task": "", "owner": "", "difficulty": "", "expected_impact": "" }],
    "month_12": [{ "task": "", "owner": "", "difficulty": "", "expected_impact": "" }]
  },
  "additional_data_request": {
    "priority_1": [""], "priority_2": [""], "priority_3": [""]
  },
  "disclaimer": {
    "lines": ["본 리포트는 제공된 자료를 기반으로 한 참고용 진단이며, 세무·법률 판단은 추가 자료 확인 및 전문가 검토가 필요합니다."]
  }
}

반드시 '✓ 표시 항목은 컨설팅이 필요한 영역'이라는 톤을 유지하되, 허위 확정 표현은 금지한다.
`.trim();

// 재무제표 스냅샷 분석 시스템 프롬프트 (사근복 관점)
export const FINANCIAL_SNAPSHOT_SYSTEM_PROMPT = `
너는 "사근복닷컴 컨설턴트존"의 수석 컨설턴트 AI다.
재무제표 핵심지표(매출/순이익, 이익잉여금, 가지급금, 복리후생비)로 사근복 컨설팅 스냅샷을 작성한다.

[목표] 30초 안에 "한 줄 결론 + 위험/기회 + 다음 액션" 파악

[규칙]
1. 단위 반영(원/천원/백만원/억원)
2. 숫자만 나열 금지 → 사근복 관점 의미 해석
3. 확정 판단 금지 → 추가자료 명시
4. 출력은 A~E 포맷 고정, 요약형

[해석 프레임]
• 매출/순이익 → 출연 재원 여력
• 이익잉여금 → 유보자금/주주환원/가치관리 이슈
• 가지급금 → 리스크/선결과제
• 복리후생비 → 현행 수준 vs 구조화 여지

[라벨링]
적합성: 적합/보완필요/부적합/자료부족
리스크: High/Medium/Low
재원여력: 충분/보통/제약/자료부족

[출력 포맷]
A. 한 줄 결론 (적합성 + 이유)
B. 4대 지표 표 (항목 | 값 | 컨설팅 포인트)
C. 이슈체크 (가지급금/잉여금/복지/재원)
D. 컨설팅 제안 (패키지 3개 + 시나리오 3개)
E. 로드맵 (30-60-90일 실행계획)
`.trim();

export const PROMPTS = {
  // 1) 기업 절세
  CORP_TAX: {
    SUMMARY: `
[요청]
아래 calcResult를 바탕으로 "대표 60초 요약"을 작성해라.
- 문제(왜 돈이 새는지) → 지금 해야 하는 이유 → 사근복이 왜 구조적 해답인지 순서
- 핵심 숫자 3개를 반드시 (월)/(연)로 표기
- 마지막 문장은 "무료·비공개 대표 단독 컨설팅" CTA로 마무리

[calcResult]
{{calcResult}}
`.trim(),

    RISK_TOP3: `
[요청]
calcResult 기준 리스크 TOP3를 세무/노무/재무 관점으로 작성.
각 리스크는 "트리거(시간이 지날수록 커지는 이유)" 1줄 포함.
대표가 바로 이해하는 언어로.

[calcResult]
{{calcResult}}
`.trim(),

    SAGUNBOK_ROADMAP: `
[요청]
사근복 출연/운영으로 전환하는 3단계 로드맵을 체크리스트로 작성:
- 단기(30일) / 중기(90일) / 장기(6~12개월)
각 단계: 목표 1줄 + 실행항목 5개.

[calcResult]
{{calcResult}}
`.trim(),

    OBJECTION: `
[요청]
대표가 자주 하는 반론 7개 + 답변(각 2~3문장).
반론 예시를 포함:
- "급여 올리면 되지 않나요?"
- "세무조사 이슈 없나요?"
- "직원 불만 생기지 않나요?"
- "복지비 늘리면 끝 아닌가요?"
답변은 '구조/리스크/재무' 관점으로 짧고 단정하게.

[calcResult]
{{calcResult}}
`.trim(),

    CHECKLIST: `
[요청]
실무자가 바로 실행 가능한 체크리스트 12개(우선순위 포함).
- 내부 규정/의결/증빙/지급 프로세스/커뮤니케이션 포함
- 마지막에 '주의(노무/세무)' 3줄

[calcResult]
{{calcResult}}
`.trim(),

    PDF_ONEPAGER: `
[요청]
대표용 1장 PDF 문안 작성(텍스트만).
구성:
- 제목(강하게)
- 한 줄 결론
- KPI 4개(월/연)
- 리스크 TOP3
- 사근복 전환 시나리오 3단계
- 다음 액션(상담 CTA)
- 면책 문구

[calcResult]
{{calcResult}}
`.trim(),
  },

  // 2) 직원 절세
  STAFF_TAX: {
    SUMMARY: `
[요청]
직원절세계산기 결과를 "직원 체감 중심"으로 해석.
- 직원 체감 변화 3개
- 회사 효과 3개(비용/만족/리스크)
- (월)/(연) 단위 명확히
마지막은 "사근복 복지포인트"로 자연스럽게 연결.

[calcResult]
{{calcResult}}
`.trim(),

    RISK_TOP3: `
[요청]
직원 지급 설계 시 주의할 리스크 TOP3(통상임금/퇴직금/운영증빙).
각 리스크별 "오해 포인트" 1줄 + "대응" 1줄.

[calcResult]
{{calcResult}}
`.trim(),

    SAGUNBOK_ROADMAP: `
[요청]
사근복 복지포인트 운영 3단계 로드맵:
단기(30일)/중기(90일)/장기(6~12개월)
각 단계 실행항목 5개 + 내부 공지 방향 2줄.

[calcResult]
{{calcResult}}
`.trim(),

    OBJECTION: `
[요청]
직원/노무사가 묻는 질문 8개 + 답변.
반드시 포함:
- "퇴직금 손해 아닌가요?"
- "통상임금에 들어가나요?"
- "왜 현금이 아니라 포인트죠?"
답변은 "원칙 + 회사 운영 기준 + 검토 문구"로 구성.

[calcResult]
{{calcResult}}
`.trim(),

    CHECKLIST: `
[요청]
담당자 실행 체크리스트 15개(규정/공문/증빙/지급/FAQ/내부교육 포함).
마지막에 내부 공지문 예시 5줄.

[calcResult]
{{calcResult}}
`.trim(),

    PDF_ONEPAGER: `
[요청]
직원 안내 1장 문안:
- 무엇이 바뀌나(3줄)
- 직원 혜택 3개
- FAQ 6개
- 주의사항(통상임금/퇴직금/운영)
- 면책 문구

[calcResult]
{{calcResult}}
`.trim(),
  },

  // 3) CEO(승계/주식/유보금/가지급금)
  CEO_TAX: {
    SUMMARY: `
[요청]
CEO 절세계산기 결과를 "승계/주식가치/유보금 구조"로 60초 요약.
반드시 포함:
- 미처분이익잉여금(유보금) → 주식가치 상승 → 증여/상속세 압력
- 가지급금 → 세무 트리거/상여처분 리스크
마지막에 "대표 단독 비공개 설계(SECRET PLAN)" CTA.

[calcResult]
{{calcResult}}
`.trim(),

    RISK_TOP3: `
[요청]
CEO 관점 리스크 TOP3(승계세/주식평가/세무조사 트리거).
각 리스크별 '지금 안 하면 커지는 이유(시간 트리거)'를 1줄 포함.
차명은 불법 조언 금지: "정상화 필요/리스크 인지" 관점으로만.

[calcResult]
{{calcResult}}
`.trim(),

    SAGUNBOK_ROADMAP: `
[요청]
SECRET PLAN 3단계 로드맵:
- 단기(30일): 자료정리/구조진단
- 중기(90일): 설계/의사결정/실행준비
- 장기(6~12개월): 실행/사후관리/승계 타이밍 최적화
각 단계 실행항목 6개.

[calcResult]
{{calcResult}}
`.trim(),

    OBJECTION: `
[요청]
CEO 반론 8개 + 답변(각 2~3문장).
반드시 포함:
- "주식가치 오르는 게 좋은 거 아닌가?"
- "사근복 출연하면 회사 돈 빠지는 거 아닌가?"
- "증여/상속은 나중에 생각하면 되지 않나?"
답변은 '세금은 타이밍/구조' 관점.

[calcResult]
{{calcResult}}
`.trim(),

    CHECKLIST: `
[요청]
대표/재무팀 체크리스트 20개:
주주구성, 자사주, 부동산, 유보금, 가지급금, 대표 보유주식, 승계 일정, 리스크 이슈까지 포함.
마지막에 "미팅 때 꼭 물어볼 질문 6개".

[calcResult]
{{calcResult}}
`.trim(),

    PDF_ONEPAGER: `
[요청]
CEO 1장 브리프 문안:
- 제목
- 한 줄 결론
- KPI 4개(월/연)
- 승계세 폭증 트리거(3개)
- SECRET PLAN 3단계 요약
- 다음 액션(대표 단독 미팅 CTA)
- 면책 문구

[calcResult]
{{calcResult}}
`.trim(),
  },

  // 4) 네트급여(병원)
  NETPAY: {
    SUMMARY: `
[요청]
네트급여(페이닥터) 결과를 "원장 총유출/대납/리스크" 관점으로 60초 요약.
반드시 포함:
- 네트 계약은 보험/세율 변화에 취약(원장이 고정비로 떠안음)
- 사근복 복지포인트 전환이 '네트 리스크 방어'가 되는 논리
핵심 숫자 3개는 (월)/(연).

[calcResult]
{{calcResult}}
`.trim(),

    RISK_TOP3: `
[요청]
네트계약 리스크 TOP3(세무/노무/현금흐름).
"보험요율 +0.1%p", "세율구간 상향" 같은 충격 시 왜 원장 부담이 커지는지 1줄로 설명.
마지막에 '사근복 전환이 방어책' 문장.

[calcResult]
{{calcResult}}
`.trim(),

    SAGUNBOK_ROADMAP: `
[요청]
네트 계약을 유지하거나 전환하는 3단계 시나리오(단/중/장기).
- 페이닥터/직원에게 '선택형 복지포인트'로 설계하는 흐름
- 퇴직금/통상임금 오해 방지 문구 포함
각 단계 실행항목 6개.

[calcResult]
{{calcResult}}
`.trim(),

    OBJECTION: `
[요청]
원장이 하는 오해/반론 7개 + 답변.
반드시 포함:
- "사근복으로 주면 퇴직금 손해 아닌가?"
- "세무조사 위험 없나?"
- "직원이 싫어하지 않나?"
답변은 '원칙 + 커뮤니케이션 + 검토 필요'로 정리.

[calcResult]
{{calcResult}}
`.trim(),

    CHECKLIST: `
[요청]
원무/행정 체크리스트 15개(계약/규정/증빙/지급/대외비 운영/내부교육 포함).
마지막에 "대외비 운영 가이드 5줄"(불법 은폐가 아니라 내부 정책/권한관리 관점).

[calcResult]
{{calcResult}}
`.trim(),

    PDF_ONEPAGER: `
[요청]
병원 네트급여 리포트 1장 문안:
- 제목
- 한 줄 결론
- KPI 4개(월/연)
- 리스크 TOP3
- 사근복 전환 3단계
- 다음 액션(상담 CTA)
- 면책 문구

[calcResult]
{{calcResult}}
`.trim(),
  },

  // 5) 컨설턴트존 (재무제표/리뷰/복지 데이터 기반)
  CONSULTANT_ZONE: {
    FIN_DIAG: `
[요청]
financials(손익/BS/현금흐름/주요지표)를 바탕으로
1) 회사 체력(수익성/안정성/현금흐름) 요약
2) 인건비/복후비/채용여력 관점 해석
3) '복지 투자 가능 구간'과 '위험 구간'을 구분
4) 사근복 설계로 비용을 '고정비→전략비'로 전환하는 논리를 제시
5) 추가로 필요한 재무 데이터 7개를 요청

[입력]
companyProfile={{companyProfile}}
financials={{financials}}
`.trim(),

    REVIEW_DIAG: `
[요청]
reviews 데이터를 기반으로
1) 리뷰 신뢰도(표본/편향/최근성) 체크
2) 핵심 불만 TOP5(키워드로) + "이직 트리거" 추정
3) 긍정 포인트 TOP3(유지해야 할 문화)
4) 복지/보상/제도 설계로 해결 가능한 항목 vs 구조적 항목 구분
5) 사근복 도입이 효과적인 문제 3개를 "직원 체감 언어"로 제시
6) HR/원장/대표가 바로 쓸 '내부 커뮤니케이션 멘트' 6줄

[입력]
companyProfile={{companyProfile}}
reviews={{reviews}}
`.trim(),

    WELFARE_POSITIONING: `
[요청]
업종/지역/인력구성 + 리뷰 기반으로
1) 채용 경쟁에서 밀리는 이유를 3문장으로 요약
2) 사근복 복지포인트/선택형 복지로 '즉시 체감' 만드는 5가지 아이템 제안
3) 도입 후 30일 안에 체감시키는 실행 플랜(공지/FAQ/지급) 제시
4) KPI(이직률/채용리드타임/만족도/복후비효율) 정의

[입력]
companyProfile={{companyProfile}}
reviews={{reviews}}
welfare={{welfare}}
financials={{financials}}
`.trim(),

    RISK_SCAN: `
[요청]
입력 데이터에서 노무/세무 리스크 신호를 탐지해
1) 위험 신호 TOP7
2) 즉시 점검(1주) / 구조 개선(3개월) / 제도 정착(6~12개월)로 나눠 액션 제시
3) 사근복 설계 시 특히 주의할 포인트(통상임금/퇴직금/운영증빙/규정) 체크리스트 제공

[입력]
companyProfile={{companyProfile}}
reviews={{reviews}}
welfare={{welfare}}
financials={{financials}}
`.trim(),

    PITCH_ONEPAGER: `
[요청]
대표에게 바로 보여줄 1장 제안서 문안을 작성한다.
구성:
- 제목(강한 후킹)
- 우리 회사 현상 3줄(데이터 기반)
- 지금 손해 보는 구조 3개
- 사근복 도입 효과 4개(채용/유지/절세/리스크)
- 90일 실행 로드맵
- 무료·비공개 대표 단독 컨설팅 CTA
- 면책 문구

[입력]
companyProfile={{companyProfile}}
financials={{financials}}
reviews={{reviews}}
welfare={{welfare}}
`.trim(),

    MEETING_SCRIPT: `
[요청]
컨설턴트가 미팅에서 그대로 읽고 진행할 스크립트를 만든다.
1) 오프닝(30초) – '복지는 구조' 메시지
2) 진단 질문 15개(대표/재무/인사 파트로 분류)
3) 반론 6개 대응 멘트
4) 클로징 – 다음 액션/자료 요청/컨설팅 제안

[입력]
companyProfile={{companyProfile}}
financials={{financials}}
reviews={{reviews}}
welfare={{welfare}}
`.trim(),

    BENEFIT_DESIGN: `
[요청]
선택형 복지포인트 패키지를 3안으로 설계한다.
- A안(보수적) / B안(표준) / C안(공격적)
각 안:
1) 지급 대상/조건
2) 포인트 사용 카테고리(5~8개)
3) 운영 프로세스(증빙/정산/커뮤니케이션)
4) 예상 직원 체감 포인트(멘트)
5) 리스크 주의사항

[입력]
companyProfile={{companyProfile}}
welfare={{welfare}}
financials={{financials}}
reviews={{reviews}}
`.trim(),

    DIFF_IDEAS_10: `
[요청]
리뷰/업종/지역 특성을 기반으로
'업계에서 흔치 않은 복지/제도 차별화 아이디어 10개'를 제시.
각 아이디어는:
- 효과(채용/유지/브랜딩)
- 실행 난이도(하/중/상)
- 비용감(낮음/중간/높음)
- 사근복과의 연결(가능/매우 적합/부분적합)
을 포함.

[입력]
companyProfile={{companyProfile}}
reviews={{reviews}}
financials={{financials}}
welfare={{welfare}}
`.trim(),
  },

  // CRETOP 스타일 기업분석 리포트
  CRETOP_REPORT: {
    FULL_REPORT: `
아래 입력데이터를 바탕으로 "사근복닷컴 컨설턴트존 기업분석 컨설팅 리포트"를 작성해줘.
CRETOP 샘플처럼 '이슈체크 → 라이프사이클 → 재무요약/비율 → 경영진단 종합개요 → 개선/실행' 흐름을 유지해줘.

[입력데이터]
- 기업기본정보:
  회사명: {{company_name}}
  설립일: {{incorporation_date}}
  결산월/기준결산일: {{fiscal_month}} / {{statement_date}}
  대표자: {{ceo_name}} (생년/나이: {{ceo_birth_or_age}})
  업종(코드/명): {{industry_code}} / {{industry_name}}
  임직원수: {{employee_count}}
  주요제품/서비스: {{products}}
  주소: {{address}}

- 지분/주주/임원(있으면):
  자본금: {{capital}}
  발행주식수: {{shares_outstanding}}
  주주명부: {{shareholders_table}}
  임원현황: {{executives_table}}

- 재무제표(최소 3개년, 단위 포함):
  재무상태표: {{balance_sheet_json}}
  손익계산서: {{income_statement_json}}
  현금흐름표: {{cashflow_json}}

- (선택) 세무/노무/복지 관련:
  법인세/유효세율: {{tax_info}}
  임원급여/퇴직금/배당이력: {{comp_dividend_history}}
  복리후생비/교육훈련비/인건비 구조: {{hr_costs}}
  현재 복지제도 요약: {{welfare_current}}
  협력사/거래구조(공근복 검토용): {{partners_info}}

[특별요청]
1) 이슈체크 표에 '사내근로복지기금(사근복) 도입' 항목을 반드시 포함하고, 왜 체크되는지/안되는지 근거를 써줘.
2) 수치가 없으면 "자료없음/확인필요"로 두고, 대신 '추가 요청자료'에 넣어줘.
3) 실행 로드맵은 "당장(30-60-90일) / 6개월 / 12개월"로 나눠서, 담당자(대표/재무/노무/외부전문가)까지 배정해줘.
4) JSON 출력만 반환하고, 설명/마크다운/코드블럭은 절대 포함하지 마세요.
`.trim(),
  },

  // 재무제표 스냅샷 분석 (간편 입력 모드)
  FINANCIAL_SNAPSHOT: {
    SNAPSHOT_REPORT: `
사근복 관점 컨설팅 스냅샷 리포트 (요약형)

[기업정보]
회사: {{company_name}} | 업종: {{industry_name_or_code}} | 연도: {{year}} | 인원: {{employee_count_or_unknown}}

[재무지표] (단위: {{unit}})
매출액: {{revenue_value_won}}원
순이익: {{net_income_value_won}}원
이익잉여금: {{retained_earnings_value_won}}원
가지급금: {{advances_to_officers_value_won}}원
복리후생비: {{welfare_expense_value_won}}원

[지시]
- 요약형 문장 (불릿/표 활용)
- 가지급금 0도 '누락 가능성' 체크
- 복리후생비: 현행 vs 구조화 개선점
- A~E 포맷 고정 (F 제외)
`.trim(),
  },
};
