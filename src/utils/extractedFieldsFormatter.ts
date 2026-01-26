/**
 * extractedFieldsFormatter.ts
 * 추출된 필드를 텍스트 표 형식으로 변환하는 유틸리티 함수
 */

export type ExtractedField = {
  value: string;
  confidence: number; // 0.0 ~ 1.0
  page_number: number;
  snippet: string;
  method: string;
  unit?: string;
};

export type ExtractedData = {
  company_name?: ExtractedField | null;
  ceo_name?: ExtractedField | null;
  business_number?: ExtractedField | null;
  industry?: ExtractedField | null;
  statement_year?: ExtractedField | null;
  revenue?: ExtractedField | null;
  retained_earnings?: ExtractedField | null;
  loans_to_officers?: ExtractedField | null;
};

const FIELD_LABELS: Record<keyof ExtractedData, string> = {
  company_name: "회사명",
  ceo_name: "대표자",
  business_number: "사업자등록번호",
  industry: "업종",
  statement_year: "재무제표 연도",
  revenue: "매출액",
  retained_earnings: "이익잉여금",
  loans_to_officers: "가지급금(대여금)",
};

/**
 * 텍스트 표 형식으로 변환 (복붙용)
 * @param data 추출된 필드 데이터
 * @returns 텍스트 표 문자열
 */
export function formatTextTable(data: ExtractedData): string {
  const lines: string[] = [];
  const separator = "=".repeat(80);

  lines.push(separator);
  lines.push("재무제표 자동 추출 결과");
  lines.push(separator);
  lines.push("");

  Object.entries(FIELD_LABELS).forEach(([key, label]) => {
    const field = data[key as keyof ExtractedData];

    if (field) {
      const confidenceBar = "■".repeat(Math.round(field.confidence * 10));
      const confidencePercent = Math.round(field.confidence * 100);

      lines.push(`${label.padEnd(15, " ")} : ${field.value}`);
      lines.push(`${"".padEnd(15, " ")}   신뢰도: ${confidenceBar} ${confidencePercent}%`);
      lines.push(`${"".padEnd(15, " ")}   출처: ${field.page_number}페이지`);
      lines.push(`${"".padEnd(15, " ")}   근거: ${field.snippet}`);
      lines.push("");
    } else {
      lines.push(`${label.padEnd(15, " ")} : [추출 실패]`);
      lines.push("");
    }
  });

  lines.push(separator);

  return lines.join("\n");
}

/**
 * CSV 형식으로 변환
 * @param data 추출된 필드 데이터
 * @returns CSV 문자열
 */
export function formatCSV(data: ExtractedData): string {
  const lines: string[] = [];

  // Header
  lines.push("항목,값,신뢰도(%),페이지,근거,추출방법");

  Object.entries(FIELD_LABELS).forEach(([key, label]) => {
    const field = data[key as keyof ExtractedData];

    if (field) {
      const confidencePercent = Math.round(field.confidence * 100);
      const escapedValue = `"${field.value.replace(/"/g, '""')}"`;
      const escapedSnippet = `"${field.snippet.replace(/"/g, '""')}"`;

      lines.push(
        `${label},${escapedValue},${confidencePercent},${field.page_number},${escapedSnippet},${field.method}`
      );
    } else {
      lines.push(`${label},[추출 실패],0,0,"",`);
    }
  });

  return lines.join("\n");
}

/**
 * Markdown 표 형식으로 변환
 * @param data 추출된 필드 데이터
 * @returns Markdown 표 문자열
 */
export function formatMarkdown(data: ExtractedData): string {
  const lines: string[] = [];

  lines.push("# 재무제표 자동 추출 결과");
  lines.push("");
  lines.push("| 항목 | 값 | 신뢰도 | 페이지 | 근거 |");
  lines.push("| --- | --- | --- | --- | --- |");

  Object.entries(FIELD_LABELS).forEach(([key, label]) => {
    const field = data[key as keyof ExtractedData];

    if (field) {
      const confidenceBar = "█".repeat(Math.round(field.confidence * 10));
      const confidencePercent = Math.round(field.confidence * 100);
      const escapedValue = field.value.replace(/\|/g, "\\|");
      const escapedSnippet = field.snippet.replace(/\|/g, "\\|");

      lines.push(
        `| ${label} | ${escapedValue} | ${confidenceBar} ${confidencePercent}% | ${field.page_number}p | ${escapedSnippet} |`
      );
    } else {
      lines.push(`| ${label} | [추출 실패] | - | - | - |`);
    }
  });

  return lines.join("\n");
}

/**
 * JSON pretty print
 * @param data 추출된 필드 데이터
 * @returns JSON 문자열
 */
export function formatJSON(data: ExtractedData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * 간단한 요약 문자열 생성
 * @param data 추출된 필드 데이터
 * @returns 요약 문자열
 */
export function formatSummary(data: ExtractedData): string {
  const lines: string[] = [];

  if (data.company_name?.value) {
    lines.push(`📌 ${data.company_name.value}`);
  }

  if (data.ceo_name?.value) {
    lines.push(`👤 대표: ${data.ceo_name.value}`);
  }

  if (data.statement_year?.value) {
    lines.push(`📅 ${data.statement_year.value}년 결산`);
  }

  if (data.revenue?.value) {
    lines.push(`💰 매출액: ${data.revenue.value}`);
  }

  if (data.retained_earnings?.value) {
    const isNegative = data.retained_earnings.value.startsWith("-");
    lines.push(
      `${isNegative ? "📉" : "📈"} ${isNegative ? "결손금" : "이익잉여금"}: ${
        data.retained_earnings.value
      }`
    );
  }

  if (data.loans_to_officers?.value && data.loans_to_officers.value !== "미확인") {
    lines.push(`💸 가지급금: ${data.loans_to_officers.value}`);
  }

  return lines.join("\n");
}

/**
 * 클립보드에 복사
 * @param text 복사할 텍스트
 * @returns Promise
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "-999999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      textarea.remove();
    } catch (err) {
      console.error("Failed to copy text: ", err);
      textarea.remove();
      throw err;
    }
  }
}
