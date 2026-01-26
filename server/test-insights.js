// 테스트: 삼성전자 리뷰 분석
const testData = {
  company: { 
    name: "삼성전자", 
    industry: "전자/IT", 
    headcount: 120000 
  },
  review_data: {
    source: "test_data",
    collected_at: new Date().toISOString(),
    rating: {
      overall: 3.2,
      work_life: 3.0,
      pay_benefit: 3.5,
      culture: 3.1,
      management: 2.9,
      growth: 3.3,
      recommend_to_friend_pct: "55%"
    },
    reviews: [
      {
        date: "2025-01",
        pros: "복지가 좋고 연봉이 높다. 네임밸류가 있어 이직할 때 유리하다.",
        cons: "야근이 많고 워라밸이 좋지 않다. 상하 관계가 수직적이다.",
        to_management: "직원들의 의견을 더 경청해주세요. 수평적인 조직문화를 만들어주세요.",
        rating_optional: 3
      },
      {
        date: "2025-01",
        pros: "대기업이라 안정적이다. 교육 프로그램이 잘 되어 있다.",
        cons: "업무 강도가 높고 스트레스가 많다. 의사결정이 느리다.",
        to_management: "의사결정 프로세스를 개선해주세요.",
        rating_optional: 3.2
      },
      {
        date: "2024-12",
        pros: "복지 좋음",
        cons: "야근 많음, 경직된 문화",
        to_management: "유연근무제 도입해주세요",
        rating_optional: 3.0
      }
    ],
    sample_size: 3
  },
  optional_context: {
    recent_changes: "없음",
    current_welfare_summary: "카페테리아, 건강검진, 식대, 자녀학자금"
  }
};

console.log("=== 테스트 데이터 ===");
console.log(JSON.stringify(testData, null, 2));
