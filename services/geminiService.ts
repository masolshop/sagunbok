
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const safeParseJSON = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parsing Error:", e, text);
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }
};

const KNOWLEDGE_BASE_2025 = `
[2025년 하반기 근로복지기금 지원사업 핵심 요약]
1. 접수 기간: 2025. 8. 4.(월) ~ 9. 5.(금)
2. 지원 가능 예산: 7,717백만 원
3. 공동근로복지기금 지원: 1인당 지원 한도 930,000원. 출연금액의 100% 범위 내 차등 지원.
4. 사내근로복지기금 지원: 협력업체 복지 지출 시 50% 범위 내 지원(연 2억 한도).
5. 설립 절차: 설립 합의 -> 설립준비위 -> 정관/출연 협의 -> 설립인가(노동청) -> 등기.

[절세 로직]
- 인상분 기금 전환: 임금 인상분을 기금으로 지급 시 근로자와 기업 모두 4대보험료 및 소득세 절감. 
- 퇴직금 영향: DB형은 전환 시 평균임금 하락으로 퇴직금 감소 가능성 있으나, 절세 이익이 이를 상회하는 경우가 많음.
`;

export const analyzeDiagnosis = async (scored: any, companyContext: any) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      너는 사내/공동근로복지기금 전문 컨설턴트다. 
      아래 지식을 바탕으로 진단 결과를 해석해라.
      ${KNOWLEDGE_BASE_2025}
      [진단 데이터] ${JSON.stringify(scored)}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          topRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                score: { type: Type.NUMBER },
                why: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.STRING },
                title: { type: Type.STRING },
                why: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return safeParseJSON(response.text);
};

export const chatAssistant = async (message: string, currentState: any) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      너는 사내/공동근로복지기금 전문 컨설턴트다.
      사용자의 채팅 내용에서 시뮬레이션에 필요한 데이터를 추출하고 안내해라.
      [지식] ${KNOWLEDGE_BASE_2025}
      [현재 상태] ${JSON.stringify(currentState)}
      [질문] ${message}
      
      추출 가능 데이터: currentMonthlyTaxable, shiftMonthly, taxMode, bracketRate, retirementType, yearsToRetire.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          payload_patch: { type: Type.OBJECT }
        }
      }
    }
  });
  return safeParseJSON(response.text);
};
