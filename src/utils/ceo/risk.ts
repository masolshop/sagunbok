// src/utils/ceo/risk.ts
export type RiskInputs = {
  retainedEarnings: number; // 미처분이익잉여금
  officerLoan: number;      // 가지급금(대표/임원 대여금 등)
  nomineeSharesValue: number; // 차명주식 추정가치(평가액 기준)
  realEstateValue: number;  // 부동산 시가(또는 평가액)
  netAsset: number;         // 순자산
};

export type RiskProfile = {
  score: number;
  level: '낮음' | '보통' | '높음';
  flags: string[];
  actions: string[];
};

export const buildCeoRiskProfile = (r: RiskInputs): RiskProfile => {
  const flags: string[] = [];
  const actions: string[] = [];
  let score = 0;

  const netAsset = Math.max(1, r.netAsset || 1);

  const retainedRatio = (r.retainedEarnings || 0) / netAsset;
  const loanRatio = (r.officerLoan || 0) / netAsset;
  const nomineeRatio = (r.nomineeSharesValue || 0) / netAsset;
  const reRatio = (r.realEstateValue || 0) / netAsset;

  // 잉여금
  if (retainedRatio > 0.5) {
    score += 25;
    flags.push('미처분잉여금 규모가 커 승계세(증여/상속) 베이스가 커질 수 있습니다.');
    actions.push('정기 출연(사근복)·복지지급 구조화로 유보 누적 속도를 관리하세요.');
  } else if (retainedRatio > 0.3) {
    score += 15;
    flags.push('미처분잉여금이 중간 이상 수준입니다(승계/배당 전략 점검 권장).');
    actions.push('출연/배당/투자 계획을 함께 놓고 주식가치(NAV/EPS) 목표를 설정하세요.');
  }

  // 가지급금
  if (loanRatio > 0.2) {
    score += 30;
    flags.push('가지급금 비중이 높아 세무상 부인/인정이자/상여처분 리스크가 큽니다.');
    actions.push('가지급금 발생 원인을 끊는 보상/복지 구조(사근복)로 재설계하세요.');
  } else if (loanRatio > 0.1) {
    score += 18;
    flags.push('가지급금이 존재합니다. 승계/외부감사/금융거래 시 지적 가능성이 있습니다.');
    actions.push('정리 로드맵(상환, 정산, 급여/복지 구조 전환)을 설정하세요.');
  }

  // 차명주식
  if (nomineeRatio > 0.05) {
    score += 35;
    flags.push('차명주식은 그 자체로 법적·세무 리스크가 큽니다(정리 시나리오 필요).');
    actions.push('명의정리(환원/정상화) 시나리오를 별도로 계산하고 실행 순서를 설계하세요.');
  }

  // 부동산 과다
  if (reRatio > 0.5) {
    score += 15;
    flags.push('부동산 비중이 높아 순자산가치 중심으로 주식가치가 커질 수 있습니다.');
    actions.push('부동산 평가/처분/법인 내 활용 전략과 승계 플랜을 함께 보세요.');
  }

  // 레벨
  let level: RiskProfile['level'] = '낮음';
  if (score >= 60) level = '높음';
  else if (score >= 30) level = '보통';

  // 기본 액션(없으면)
  if (actions.length === 0) {
    actions.push('사근복 출연 시나리오(현금/현물)로 주식가치·세금·리스크 변화를 먼저 비교하세요.');
    actions.push('승계 시점(연도)과 증여/상속 선택에 따른 세부담 차이를 함께 검토하세요.');
  }

  return { score, level, flags: flags.slice(0, 3), actions: actions.slice(0, 3) };
};
