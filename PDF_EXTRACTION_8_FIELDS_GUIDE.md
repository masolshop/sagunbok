# PDF 재무제표 자동 추출 시스템 (8개 항목)

## 📋 개요

PDF 또는 Excel 재무제표를 업로드하면 AI가 자동으로 8개 핵심 항목을 추출하여 구조화된 JSON 형식과 React 테이블로 제공하는 시스템입니다.

### 추출 항목 (8개)

1. **회사명** (company_name)
2. **대표자** (ceo_name)
3. **사업자등록번호** (business_number)
4. **업종** (industry)
5. **재무제표 연도** (statement_year)
6. **매출액** (revenue)
7. **이익잉여금** (retained_earnings)
8. **가지급금(대여금)** (loans_to_officers)

---

## 🎯 주요 기능

### A) Python PDF 추출 스크립트 (`scripts/pdf_extract_company_fields.py`)

- **의존성**: PyMuPDF (fitz)
- **추출 방법**:
  - 정규식 패턴 매칭
  - 키워드 기반 검색
  - 표 구조 분석
- **신뢰도 점수**: 각 필드마다 0.0 ~ 1.0 점수 제공
- **페이지 추적**: 추출된 정보의 페이지 번호 기록
- **원문 스니펫**: 실제 원문에서 추출한 텍스트 일부 (최대 100자)

**사용법**:
```bash
# 텍스트 표 출력
python3 scripts/pdf_extract_company_fields.py "재무제표.pdf" text

# JSON 출력
python3 scripts/pdf_extract_company_fields.py "재무제표.pdf" json

# 둘 다 출력
python3 scripts/pdf_extract_company_fields.py "재무제표.pdf" both
```

### B) JSON 스키마 (`docs/EXTRACTED_FIELDS_SCHEMA.json`)

각 필드의 구조:
```json
{
  "company_name": {
    "value": "쏠라리버(주)",
    "confidence": 0.95,
    "page_number": 1,
    "snippet": "회사명: 쏠라리버(주) 대표이사: 김태양",
    "method": "vision_api"
  }
}
```

**필드 설명**:
- `value`: 추출된 값 (문자열)
- `confidence`: 신뢰도 점수 (0.0 ~ 1.0)
- `page_number`: 페이지 번호 (1부터 시작)
- `snippet`: 원문 스니펫 (최대 100자)
- `method`: 추출 방법 (regex, keyword, table, vision_api, default)
- `unit` (선택): 금액 단위 (원, 천원, 백만원 등)

### C) React 테이블 컴포넌트 (`src/components/ExtractedFieldsTable.tsx`)

**주요 기능**:
1. **테이블 뷰**: 8개 필드를 표 형태로 표시
2. **신뢰도 시각화**: 
   - 90% 이상: 🟢 녹색
   - 70~89%: 🟡 노란색
   - 70% 미만: 🔴 빨간색
3. **근거 보기 토글**: 각 행마다 "▼ 보기" 버튼
   - 출처 페이지
   - 원문 스니펫
   - 추출 방법
4. **복사하기 버튼**: 텍스트 표 형식으로 클립보드에 복사

**사용 예시**:
```tsx
import ExtractedFieldsTable from "../components/ExtractedFieldsTable";

<ExtractedFieldsTable 
  data={extractedFieldsData}
  onCopy={() => {
    console.log('텍스트 표가 복사되었습니다.');
  }}
/>
```

### D) 텍스트 표 생성 함수 (`src/utils/extractedFieldsFormatter.ts`)

**제공 포맷**:
1. **텍스트 표**: 복붙용 ASCII 표
2. **CSV**: 스프레드시트용
3. **Markdown**: 문서용
4. **JSON**: API 연동용

**사용 예시**:
```typescript
import { formatTextTable, formatCSV, formatMarkdown, formatJSON } from "../utils/extractedFieldsFormatter";

// 텍스트 표
const textTable = formatTextTable(data);

// CSV
const csv = formatCSV(data);

// Markdown
const markdown = formatMarkdown(data);

// JSON
const json = formatJSON(data);

// 클립보드 복사
import { copyToClipboard } from "../utils/extractedFieldsFormatter";
await copyToClipboard(textTable);
```

---

## 🔧 백엔드 API

### 엔드포인트: `POST /api/ai/analyze-financial-statement`

**요청**:
```bash
curl -X POST https://sagunbok.com/api/ai/analyze-financial-statement \
  -H "Authorization: Bearer <consultant_id>" \
  -F "file=@재무제표.pdf" \
  -F "modelType=claude"
```

**응답**:
```json
{
  "ok": true,
  "analysis": {
    "company_name": {
      "value": "쏠라리버(주)",
      "confidence": 0.95,
      "page_number": 1,
      "snippet": "회사명: 쏠라리버(주)",
      "method": "vision_api"
    },
    "ceo_name": {
      "value": "김태양",
      "confidence": 0.95,
      "page_number": 1,
      "snippet": "대표이사: 김태양",
      "method": "vision_api"
    },
    "business_number": {
      "value": "123-45-67890",
      "confidence": 0.98,
      "page_number": 1,
      "snippet": "사업자등록번호: 123-45-67890",
      "method": "regex"
    },
    "industry": {
      "value": "태양광 발전 및 에너지 저장 시스템",
      "confidence": 0.9,
      "page_number": 1,
      "snippet": "업종: 태양광 발전",
      "method": "vision_api"
    },
    "statement_year": {
      "value": "2024",
      "confidence": 0.95,
      "page_number": 1,
      "snippet": "2024년 재무제표",
      "method": "regex"
    },
    "revenue": {
      "value": "5,432,100,000원",
      "confidence": 0.92,
      "page_number": 3,
      "snippet": "매출액 5,432,100,000",
      "method": "vision_api",
      "unit": "원"
    },
    "retained_earnings": {
      "value": "1,234,567,890원",
      "confidence": 0.88,
      "page_number": 4,
      "snippet": "이익잉여금 1,234,567,890",
      "method": "vision_api",
      "unit": "원"
    },
    "loans_to_officers": {
      "value": "50,000,000원",
      "confidence": 0.85,
      "page_number": 4,
      "snippet": "가지급금 50,000,000",
      "method": "vision_api",
      "unit": "원"
    }
  },
  "modelType": "claude",
  "createdAt": "2026-01-26T16:00:00.000Z"
}
```

### 지원 모델

- **Claude** (claude-3-5-sonnet-20241022): Vision API 지원, PDF 이미지 분석 가능 ✅
- **GPT**: 텍스트 기반 분석
- **Gemini**: 텍스트 기반 분석

---

## 📁 프로젝트 구조

```
/home/user/webapp/
├── scripts/
│   └── pdf_extract_company_fields.py     # Python PDF 추출 스크립트
├── docs/
│   ├── EXTRACTED_FIELDS_SCHEMA.json      # JSON 스키마 정의
│   └── EXTRACTED_FIELDS_EXAMPLE.json     # JSON 예시
├── src/
│   ├── components/
│   │   └── ExtractedFieldsTable.tsx      # React 테이블 컴포넌트
│   ├── utils/
│   │   └── extractedFieldsFormatter.ts   # 포맷 변환 유틸리티
│   └── pages/
│       └── CretopReportPage.tsx          # 통합 페이지
└── server/
    └── controllers/
        └── aiController.js                # 백엔드 API 컨트롤러
```

---

## 🎨 UI 스크린샷 (개념)

### 1. PDF 업로드 영역
```
┌─────────────────────────────────────────┐
│  📤 재무제표 파일 업로드 (선택)           │
│  PDF 또는 Excel 파일을 업로드하면 AI가   │
│  자동으로 분석합니다.                    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ✓ 쏠라리버(주).pdf                 │ │
│  │  다른 파일 선택                      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. 추출 결과 테이블
```
┌─────────────────────────────────────────────────────────────┐
│  📊 추출 결과                          📋 복사하기           │
├─────────┬──────────────┬──────────────┬──────────┐
│ 항목     │ 값           │ 신뢰도       │ 근거     │
├─────────┼──────────────┼──────────────┼──────────┤
│ 🏢 회사명 │ 쏠라리버(주) │ ■■■■■■■■■□ 95% │ ▼ 보기  │
│ 👤 대표자 │ 김태양       │ ■■■■■■■■■□ 95% │ ▼ 보기  │
│ 🔢 사업자등록번호 │ 123-45-67890 │ ■■■■■■■■■■ 98% │ ▼ 보기  │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

### 3. 근거 보기 (토글)
```
┌──────────────────────────────────────────────────────────────┐
│ 📄 출처: 1페이지                                              │
│ 📝 원문: "회사명: 쏠라리버(주) 대표이사: 김태양"              │
│ 🔍 방법: Vision API 분석                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 배포 정보

### 프론트엔드
- **URL**: https://sagunbok.com
- **배포 시간**: 2026-01-26 16:05 UTC
- **번들 파일**: `index-TKzzFBbE.js` (1,174 KB)
- **경로**: `/var/www/sagunbok/`

### 백엔드
- **서버**: sagunbok-api
- **변경 파일**: 
  - `controllers/aiController.js`
- **PM2 상태**: Online
- **포트**: 3002

### Git
- **브랜치**: `genspark_ai_developer`
- **커밋**: `96bb4c9` (feat: Add PDF extraction with 8-field structured output)
- **원격**: https://github.com/masolshop/sagunbok.git

---

## 🧪 테스트 시나리오

### 1. 프론트엔드 검증
1. https://sagunbok.com 접속
2. 하드 리프레시 (Ctrl+Shift+R 또는 Cmd+Shift+R)
3. 컨설턴트 계정 로그인
4. "기업재무제표분석" 메뉴 클릭

### 2. PDF 업로드 테스트
1. AI 모델 선택 (Claude 권장)
2. API 키 입력 및 저장
3. PDF 파일 업로드
4. "AI가 재무제표를 분석하고 있습니다..." 확인
5. 분석 완료 후 "✅ 재무제표 분석 완료! 8개 항목이 자동 추출되었습니다." 메시지 확인

### 3. 추출 결과 확인
1. 📊 추출 결과 테이블 표시 확인
2. 8개 항목의 값 확인
3. 신뢰도 바 색상 확인 (녹색/노란색/빨간색)
4. "▼ 보기" 버튼 클릭하여 근거 확인
   - 출처 페이지
   - 원문 스니펫
   - 추출 방법

### 4. 복사 기능 테스트
1. "📋 복사하기" 버튼 클릭
2. "✅ 텍스트 표가 클립보드에 복사되었습니다!" 메시지 확인
3. 메모장에 붙여넣기하여 ASCII 표 확인

---

## 📊 텍스트 표 출력 예시

```
================================================================================
재무제표 자동 추출 결과
================================================================================

회사명             : 쏠라리버(주)
                  신뢰도: ■■■■■■■■■□ 95%
                  출처: 1페이지
                  근거: 회사명: 쏠라리버(주) 대표이사: 김태양

대표자             : 김태양
                  신뢰도: ■■■■■■■■■□ 95%
                  출처: 1페이지
                  근거: 대표이사: 김태양 사업자등록번호: 123-45-67890

사업자등록번호         : 123-45-67890
                  신뢰도: ■■■■■■■■■■ 98%
                  출처: 1페이지
                  근거: 사업자등록번호: 123-45-67890

업종              : 태양광 발전 및 에너지 저장 시스템
                  신뢰도: ■■■■■■■■■□ 90%
                  출처: 1페이지
                  근거: 업종: 태양광 발전 및 에너지 저장 시스템

재무제표 연도         : 2024
                  신뢰도: ■■■■■■■■■□ 95%
                  출처: 1페이지
                  근거: 2024년 재무제표

매출액             : 5,432,100,000원
                  신뢰도: ■■■■■■■■■□ 92%
                  출처: 3페이지
                  근거: 매출액 5,432,100,000

이익잉여금           : 1,234,567,890원
                  신뢰도: ■■■■■■■■□□ 88%
                  출처: 4페이지
                  근거: 이익잉여금 1,234,567,890

가지급금(대여금)       : 50,000,000원
                  신뢰도: ■■■■■■■■□□ 85%
                  출처: 4페이지
                  근거: 가지급금 50,000,000

================================================================================
```

---

## 🔧 추가 개선 사항

### 구현됨 ✅
- [x] Python PDF 추출 스크립트 (PyMuPDF)
- [x] JSON 스키마 및 예시
- [x] React 테이블 컴포넌트 (신뢰도 시각화, 근거 토글)
- [x] 텍스트 표 포맷터 (Text, CSV, Markdown, JSON)
- [x] 백엔드 API 8개 필드 구조화
- [x] Vision API 연동 (Claude)
- [x] 프론트엔드/백엔드 배포

### 향후 개선 가능 항목 📝
- [ ] OCR 기능 추가 (Tesseract 또는 Google Cloud Vision)
- [ ] 다중 페이지 분석 강화
- [ ] 표 인식 정확도 개선
- [ ] GPT/Gemini Vision API 연동
- [ ] 추출 실패 시 재시도 로직
- [ ] 추출 결과 편집 기능
- [ ] 추출 이력 저장 및 관리

---

## 📞 문의

문제 발생 시 다음 정보를 포함하여 문의해주세요:
1. PDF 파일명 및 크기
2. 선택한 AI 모델
3. 추출 실패한 항목
4. 브라우저 콘솔 에러 메시지

---

## 📝 라이선스

MIT License

---

**작성일**: 2026-01-26  
**작성자**: GenSpark AI Developer  
**버전**: 1.0.0
