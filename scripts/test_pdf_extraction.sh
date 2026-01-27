#!/bin/bash
# test_pdf_extraction.sh
# PDF 추출 테스트 스크립트

API_URL="https://sagunbok.com/api/ai/analyze-financial-statement"
PDF_FILE="$1"
MODEL_TYPE="${2:-claude}"
CONSULTANT_ID="${3:-consultant_001}"

if [ -z "$PDF_FILE" ]; then
  echo "Usage: $0 <pdf_file> [model_type] [consultant_id]"
  echo "Example: $0 solar_river.pdf claude consultant_001"
  exit 1
fi

if [ ! -f "$PDF_FILE" ]; then
  echo "Error: PDF file not found: $PDF_FILE"
  exit 1
fi

echo "=========================================="
echo "PDF 추출 테스트"
echo "=========================================="
echo "PDF 파일: $PDF_FILE"
echo "모델: $MODEL_TYPE"
echo "컨설턴트 ID: $CONSULTANT_ID"
echo "=========================================="
echo ""

echo "📤 PDF 업로드 중..."
curl -X POST "$API_URL" \
  -H "Authorization: Bearer $CONSULTANT_ID" \
  -F "file=@$PDF_FILE" \
  -F "modelType=$MODEL_TYPE" \
  -w "\n\n⏱️  응답 시간: %{time_total}s\n" \
  -s | python3 -m json.tool

echo ""
echo "=========================================="
echo "✅ 테스트 완료"
echo "=========================================="
