
import React from 'react';

export const TAX_PRESETS = {
  2024: { 
    localTaxFactor: 0.10,
    healthRate: 0.03545,
    healthMin: 9890,
    healthMax: 1288940,
    ltcRate: 0.1295,
    pensionRate: 0.045,
    pensionMinBase: 390000,
    pensionMaxBase: 6170000,
    empInsEmpRate: 0.009,
    empInsErRate: 0.0115
  },
  2025: { 
    localTaxFactor: 0.10,
    healthRate: 0.03545,
    healthMin: 9890,
    healthMax: 1288940,
    ltcRate: 0.1295,
    pensionRate: 0.045,
    pensionMinBase: 390000,
    pensionMaxBase: 6170000,
    empInsEmpRate: 0.009,
    empInsErRate: 0.0115
  },
  2026: { 
    localTaxFactor: 0.10,
    healthRate: 0.03545,
    healthMin: 9890,
    healthMax: 1288940,
    ltcRate: 0.1295,
    pensionRate: 0.045,
    pensionMinBase: 390000,
    pensionMaxBase: 6170000,
    empInsEmpRate: 0.009,
    empInsErRate: 0.0115
  }
};

export const INCOME_TAX_BRACKETS = [
  { upTo: 14000000, rate: 0.06, label: "6% (1,400만원 이하)" },
  { upTo: 50000000, rate: 0.15, label: "15% (5,000만원 이하)" },
  { upTo: 88000000, rate: 0.24, label: "24% (8,800만원 이하)" },
  { upTo: 150000000, rate: 0.35, label: "35% (1.5억 이하)" },
  { upTo: 300000000, rate: 0.38, label: "38% (3억 이하)" },
  { upTo: 500000000, rate: 0.40, label: "40% (5억 이하)" },
  { upTo: 1000000000, rate: 0.42, label: "42% (10억 이하)" },
  { upTo: Infinity, rate: 0.45, label: "45% (10억 초과)" }
];

export const KOREA_REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", 
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

export const DIAGNOSIS_AREAS = [
  { key: "talent", title: "우수인력 채용·고용유지", questions: [
    "최근 1년 이직률이 체감상 높다",
    "채용 난이도(구인기간)가 길다",
    "동종업계 대비 복지 경쟁력이 낮다고 느낀다",
    "핵심인력(리더/기술자) 이탈 리스크가 있다",
    "직원 불만/리뷰에서 복지·처우 이슈가 반복된다"
  ]},
  { key: "wage_litigation", title: "통상임금·퇴직 소송 리스크", questions: [
    "정기상여/정기수당이 고정적으로 지급된다",
    "수당 항목이 많고 지급기준이 불명확한 편이다",
    "선택적 복지/포인트가 임금대체로 오해될 여지가 있다",
    "최근 3년 노무 진정/분쟁/소송이 있었다(또는 조짐)",
    "취업규칙/임금규정이 최신화/정비가 안 되어 있다"
  ]},
  { key: "employee_tax", title: "근로자 절세·실질소득 증가", questions: [
    "현금성 복지(현금·급여성) 비중이 높다",
    "세부담 줄이는 복지 설계(비과세/현물/포인트)가 약하다",
    "복리후생비 중 일부가 임금성으로 처리되는 느낌이다",
    "직원 평균 세부담이 부담된다는 반응이 있다",
    "복지 안내/신청/증빙이 복잡해 체감도가 낮다"
  ]},
  { key: "due_from_ceo", title: "대표 가지급금", questions: [
    "가지급금(또는 대표 대여금)이 의미 있는 규모로 있다",
    "1년 이상 장기 미정리 상태다",
    "인정이자/상여처분 등 세무 리스크가 걱정된다",
    "법인자금과 대표 개인 사용이 혼재되는 구간이 있다",
    "상환계획/정리 로드맵이 없다"
  ]},
  { key: "retained_earnings", title: "미처분 잉여금(유보금)", questions: [
    "미처분 이익잉여금이 과다하다고 느낀다",
    "현금성 자산이 쌓이는데 투자/배당 계획이 약하다",
    "비용집행이 보수적이라 유보만 쌓인다",
    "주주/승계 관점에서 유보금이 리스크가 될 수 있다",
    "합법적으로 비용화/구조화할 필요성이 크다"
  ]},
  { key: "succession", title: "가업승계", questions: [
    "후계자/승계 로드맵이 불명확하다",
    "지분구조(가족/임원/투자자)가 정리되지 않았다",
    "기업가치 상승으로 상속·증여 세부담이 걱정된다",
    "의사결정이 대표 1인에 의존(키맨 리스크)한다",
    "승계와 함께 인재/ESG/복지 체계 패키지 정비가 필요하다"
  ]},
  { key: "tax_labor_risk", title: "세무·노무 리스크(종합)", questions: [
    "최근 5년 내 세무조사/노무감독/진정 이슈가 있었다(또는 조짐)",
    "복지/지급 기준 문서화가 약해 증빙 리스크가 있다",
    "임금·복지·성과급성 지급이 혼용되는 구간이 있다",
    "외주/프리랜서/특수고용 형태 리스크가 있다",
    "규정이 연 1회 이상 업데이트되지 않는다"
  ]}
];
