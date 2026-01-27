#!/usr/bin/env python3
"""
PDF 재무제표 자동 추출 스크립트
8개 항목 추출: 회사명, 대표자, 사업자등록번호, 업종, 재무제표 연도, 매출액, 잉여금, 가지급금
"""

import fitz  # PyMuPDF
import re
import json
import sys
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class ExtractedField:
    """추출된 필드 정보"""
    value: Optional[str]
    confidence: float  # 0.0 ~ 1.0
    page_number: int
    snippet: str  # 원문 스니펫 (최대 100자)
    method: str  # 추출 방법 (regex, keyword, table 등)


@dataclass
class CompanyInfo:
    """회사 정보 (8개 필드)"""
    company_name: Optional[ExtractedField] = None
    ceo_name: Optional[ExtractedField] = None
    business_number: Optional[ExtractedField] = None
    industry: Optional[ExtractedField] = None
    statement_year: Optional[ExtractedField] = None
    revenue: Optional[ExtractedField] = None
    retained_earnings: Optional[ExtractedField] = None
    loans_to_officers: Optional[ExtractedField] = None


class PDFExtractor:
    """PDF에서 회사 정보 추출"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
        self.pages_text = []
        
        # 전체 페이지 텍스트 추출
        for page_num in range(len(self.doc)):
            page = self.doc[page_num]
            text = page.get_text()
            self.pages_text.append({
                'page_number': page_num + 1,
                'text': text
            })
    
    def extract_snippet(self, text: str, match_pos: int, context_length: int = 50) -> str:
        """매칭된 위치 주변의 스니펫 추출"""
        start = max(0, match_pos - context_length)
        end = min(len(text), match_pos + context_length)
        snippet = text[start:end].strip()
        
        # 줄바꿈을 공백으로 변환
        snippet = re.sub(r'\s+', ' ', snippet)
        
        # 최대 100자로 제한
        if len(snippet) > 100:
            snippet = snippet[:97] + "..."
        
        return snippet
    
    def extract_company_name(self) -> Optional[ExtractedField]:
        """회사명 추출"""
        patterns = [
            (r'([\w가-힣]+(?:주식회사|\(주\)|㈜))', 0.9),
            (r'회사명\s*[:\s]\s*([\w가-힣\(\)]+)', 0.95),
            (r'법인명\s*[:\s]\s*([\w가-힣\(\)]+)', 0.95),
        ]
        
        candidates = []
        
        for page_data in self.pages_text[:3]:  # 첫 3페이지만 검색
            text = page_data['text']
            page_num = page_data['page_number']
            
            for pattern, base_confidence in patterns:
                matches = re.finditer(pattern, text)
                for match in matches:
                    value = match.group(1).strip()
                    snippet = self.extract_snippet(text, match.start())
                    
                    # 신뢰도 조정 (첫 페이지이면 +0.05)
                    confidence = base_confidence + (0.05 if page_num == 1 else 0)
                    
                    candidates.append(ExtractedField(
                        value=value,
                        confidence=confidence,
                        page_number=page_num,
                        snippet=snippet,
                        method='regex'
                    ))
        
        # 가장 신뢰도 높은 결과 반환
        if candidates:
            return max(candidates, key=lambda x: x.confidence)
        return None
    
    def extract_ceo_name(self) -> Optional[ExtractedField]:
        """대표자명 추출"""
        patterns = [
            (r'대표이사\s*[:\s]\s*([\w가-힣]+)', 0.95),
            (r'대표자\s*[:\s]\s*([\w가-힣]+)', 0.9),
            (r'대표\s*[:\s]\s*([\w가-힣]+)', 0.85),
        ]
        
        candidates = []
        
        for page_data in self.pages_text[:3]:
            text = page_data['text']
            page_num = page_data['page_number']
            
            for pattern, base_confidence in patterns:
                matches = re.finditer(pattern, text)
                for match in matches:
                    value = match.group(1).strip()
                    # 2~4글자의 한글 이름인지 검증
                    if 2 <= len(value) <= 4 and re.match(r'^[가-힣]+$', value):
                        snippet = self.extract_snippet(text, match.start())
                        confidence = base_confidence + (0.05 if page_num == 1 else 0)
                        
                        candidates.append(ExtractedField(
                            value=value,
                            confidence=confidence,
                            page_number=page_num,
                            snippet=snippet,
                            method='regex'
                        ))
        
        if candidates:
            return max(candidates, key=lambda x: x.confidence)
        return None
    
    def extract_business_number(self) -> Optional[ExtractedField]:
        """사업자등록번호 추출 (123-45-67890 형식)"""
        patterns = [
            (r'사업자(?:등록)?번호\s*[:\s]\s*(\d{3}-\d{2}-\d{5})', 0.95),
            (r'사업자(?:등록)?번호\s*[:\s]\s*(\d{10})', 0.9),
            (r'(\d{3}-\d{2}-\d{5})', 0.8),
        ]
        
        candidates = []
        
        for page_data in self.pages_text[:3]:
            text = page_data['text']
            page_num = page_data['page_number']
            
            for pattern, base_confidence in patterns:
                matches = re.finditer(pattern, text)
                for match in matches:
                    value = match.group(1).strip()
                    
                    # 하이픈 없으면 추가
                    if '-' not in value and len(value) == 10:
                        value = f"{value[:3]}-{value[3:5]}-{value[5:]}"
                    
                    snippet = self.extract_snippet(text, match.start())
                    confidence = base_confidence + (0.05 if page_num == 1 else 0)
                    
                    candidates.append(ExtractedField(
                        value=value,
                        confidence=confidence,
                        page_number=page_num,
                        snippet=snippet,
                        method='regex'
                    ))
        
        if candidates:
            return max(candidates, key=lambda x: x.confidence)
        return None
    
    def extract_industry(self) -> Optional[ExtractedField]:
        """업종 추출"""
        patterns = [
            (r'업종\s*[:\s]\s*([\w가-힣\s,]+?)(?:\n|$)', 0.9),
            (r'업태\s*[:\s]\s*([\w가-힣\s,]+?)(?:\n|$)', 0.85),
            (r'주요사업\s*[:\s]\s*([\w가-힣\s,]+?)(?:\n|$)', 0.8),
        ]
        
        candidates = []
        
        for page_data in self.pages_text[:3]:
            text = page_data['text']
            page_num = page_data['page_number']
            
            for pattern, base_confidence in patterns:
                matches = re.finditer(pattern, text)
                for match in matches:
                    value = match.group(1).strip()
                    # 최대 50자로 제한
                    if len(value) > 50:
                        value = value[:47] + "..."
                    
                    snippet = self.extract_snippet(text, match.start())
                    confidence = base_confidence + (0.05 if page_num == 1 else 0)
                    
                    candidates.append(ExtractedField(
                        value=value,
                        confidence=confidence,
                        page_number=page_num,
                        snippet=snippet,
                        method='regex'
                    ))
        
        if candidates:
            return max(candidates, key=lambda x: x.confidence)
        return None
    
    def extract_statement_year(self) -> Optional[ExtractedField]:
        """재무제표 연도 추출 (YYYY 형식)"""
        patterns = [
            (r'(\d{4})년?\s*(?:재무제표|결산|회계)', 0.95),
            (r'재무제표.*?(\d{4})', 0.9),
            (r'결산기\s*[:\s]\s*(\d{4})', 0.9),
            (r'회계연도\s*[:\s]\s*(\d{4})', 0.9),
        ]
        
        candidates = []
        
        for page_data in self.pages_text[:5]:
            text = page_data['text']
            page_num = page_data['page_number']
            
            for pattern, base_confidence in patterns:
                matches = re.finditer(pattern, text)
                for match in matches:
                    value = match.group(1).strip()
                    year = int(value)
                    
                    # 2000~2030년 범위 검증
                    if 2000 <= year <= 2030:
                        snippet = self.extract_snippet(text, match.start())
                        
                        # 최근 연도일수록 신뢰도 증가
                        year_bonus = (year - 2020) * 0.01 if year >= 2020 else 0
                        confidence = min(1.0, base_confidence + year_bonus)
                        
                        candidates.append(ExtractedField(
                            value=value,
                            confidence=confidence,
                            page_number=page_num,
                            snippet=snippet,
                            method='regex'
                        ))
        
        if candidates:
            return max(candidates, key=lambda x: (x.confidence, int(x.value)))
        return None
    
    def extract_amount(self, text: str, keywords: List[str]) -> List[Tuple[str, int, float]]:
        """금액 추출 (키워드 기반)"""
        results = []
        
        for keyword in keywords:
            # 키워드 뒤에 오는 숫자 패턴
            patterns = [
                # 숫자 + 천원/백만원/억원 등
                (rf'{keyword}\s*[:\s]?\s*([\d,]+)\s*(천원|백만원|억원|원)?', 0.9),
                # 표 형식
                (rf'{keyword}\s+[^\d]*([\d,]+)', 0.85),
            ]
            
            for pattern, confidence in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    amount_str = match.group(1).replace(',', '')
                    unit = match.group(2) if len(match.groups()) > 1 else None
                    
                    try:
                        amount = int(amount_str)
                        
                        # 단위 변환 (원 단위로 통일)
                        if unit:
                            if '천원' in unit:
                                amount *= 1000
                            elif '백만원' in unit or '백만' in unit:
                                amount *= 1000000
                            elif '억' in unit:
                                amount *= 100000000
                        
                        # 단위 정보를 값에 포함
                        value_with_unit = f"{amount:,}원"
                        if unit:
                            value_with_unit += f" ({unit} 기준)"
                        
                        results.append((value_with_unit, match.start(), confidence))
                    except ValueError:
                        continue
        
        return results
    
    def extract_revenue(self) -> Optional[ExtractedField]:
        """매출액 추출"""
        keywords = ['매출액', '총매출', '영업수익', '매출']
        candidates = []
        
        for page_data in self.pages_text:
            text = page_data['text']
            page_num = page_data['page_number']
            
            amounts = self.extract_amount(text, keywords)
            for value, pos, confidence in amounts:
                snippet = self.extract_snippet(text, pos)
                
                candidates.append(ExtractedField(
                    value=value,
                    confidence=confidence,
                    page_number=page_num,
                    snippet=snippet,
                    method='regex'
                ))
        
        if candidates:
            # 가장 큰 금액을 매출액으로 간주 (신뢰도도 고려)
            return max(candidates, key=lambda x: (x.confidence, self.parse_amount(x.value)))
        return None
    
    def parse_amount(self, value_str: str) -> int:
        """금액 문자열을 숫자로 변환"""
        try:
            # "1,234,567원" → 1234567
            match = re.search(r'([\d,]+)', value_str)
            if match:
                return int(match.group(1).replace(',', ''))
        except:
            pass
        return 0
    
    def extract_retained_earnings(self) -> Optional[ExtractedField]:
        """이익잉여금/결손금 추출"""
        keywords = [
            '이익잉여금',
            '미처분이익잉여금',
            '결손금',
            '이월결손금',
            '당기순이익'
        ]
        candidates = []
        
        for page_data in self.pages_text:
            text = page_data['text']
            page_num = page_data['page_number']
            
            amounts = self.extract_amount(text, keywords)
            for value, pos, confidence in amounts:
                snippet = self.extract_snippet(text, pos)
                
                # 결손금이면 음수 표시
                if '결손' in snippet:
                    value = f"-{value}"
                
                candidates.append(ExtractedField(
                    value=value,
                    confidence=confidence,
                    page_number=page_num,
                    snippet=snippet,
                    method='regex'
                ))
        
        if candidates:
            return max(candidates, key=lambda x: x.confidence)
        return None
    
    def extract_loans_to_officers(self) -> Optional[ExtractedField]:
        """가지급금(대여금) 추출"""
        keywords = [
            '가지급금',
            '임원가지급금',
            '단기대여금',
            '장기대여금',
            '대여금'
        ]
        candidates = []
        
        for page_data in self.pages_text:
            text = page_data['text']
            page_num = page_data['page_number']
            
            amounts = self.extract_amount(text, keywords)
            for value, pos, confidence in amounts:
                snippet = self.extract_snippet(text, pos)
                
                # 임원/가지급 관련이면 신뢰도 증가
                if '임원' in snippet or '가지급' in snippet:
                    confidence = min(1.0, confidence + 0.05)
                
                candidates.append(ExtractedField(
                    value=value,
                    confidence=confidence,
                    page_number=page_num,
                    snippet=snippet,
                    method='regex'
                ))
        
        if candidates:
            return max(candidates, key=lambda x: x.confidence)
        
        # 찾지 못한 경우
        return ExtractedField(
            value="미확인",
            confidence=0.5,
            page_number=0,
            snippet="해당 계정과목을 찾을 수 없습니다.",
            method='default'
        )
    
    def extract_all(self) -> CompanyInfo:
        """모든 필드 추출"""
        info = CompanyInfo()
        
        print("🔍 회사명 추출 중...")
        info.company_name = self.extract_company_name()
        
        print("🔍 대표자 추출 중...")
        info.ceo_name = self.extract_ceo_name()
        
        print("🔍 사업자등록번호 추출 중...")
        info.business_number = self.extract_business_number()
        
        print("🔍 업종 추출 중...")
        info.industry = self.extract_industry()
        
        print("🔍 재무제표 연도 추출 중...")
        info.statement_year = self.extract_statement_year()
        
        print("🔍 매출액 추출 중...")
        info.revenue = self.extract_revenue()
        
        print("🔍 이익잉여금 추출 중...")
        info.retained_earnings = self.extract_retained_earnings()
        
        print("🔍 가지급금 추출 중...")
        info.loans_to_officers = self.extract_loans_to_officers()
        
        return info
    
    def close(self):
        """PDF 파일 닫기"""
        self.doc.close()


def format_text_table(info: CompanyInfo) -> str:
    """텍스트 표 생성 (복붙용)"""
    table = []
    table.append("=" * 80)
    table.append("재무제표 자동 추출 결과")
    table.append("=" * 80)
    table.append("")
    
    fields = [
        ("회사명", info.company_name),
        ("대표자", info.ceo_name),
        ("사업자등록번호", info.business_number),
        ("업종", info.industry),
        ("재무제표 연도", info.statement_year),
        ("매출액", info.revenue),
        ("이익잉여금", info.retained_earnings),
        ("가지급금", info.loans_to_officers),
    ]
    
    for label, field in fields:
        if field:
            confidence_bar = "■" * int(field.confidence * 10)
            table.append(f"{label:15s} : {field.value}")
            table.append(f"{'':15s}   신뢰도: {confidence_bar} {field.confidence:.0%}")
            table.append(f"{'':15s}   출처: {field.page_number}페이지")
            table.append(f"{'':15s}   근거: {field.snippet}")
            table.append("")
        else:
            table.append(f"{label:15s} : [추출 실패]")
            table.append("")
    
    table.append("=" * 80)
    return "\n".join(table)


def to_json(info: CompanyInfo) -> dict:
    """JSON 변환"""
    result = {}
    
    for field_name in ['company_name', 'ceo_name', 'business_number', 'industry',
                       'statement_year', 'revenue', 'retained_earnings', 'loans_to_officers']:
        field = getattr(info, field_name)
        if field:
            result[field_name] = {
                'value': field.value,
                'confidence': round(field.confidence, 2),
                'page_number': field.page_number,
                'snippet': field.snippet,
                'method': field.method
            }
        else:
            result[field_name] = None
    
    return result


def main():
    if len(sys.argv) < 2:
        print("Usage: python pdf_extract_company_fields.py <pdf_file>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else 'both'
    
    print(f"📄 PDF 분석 시작: {pdf_path}")
    print()
    
    extractor = PDFExtractor(pdf_path)
    info = extractor.extract_all()
    
    print()
    print("✅ 추출 완료!")
    print()
    
    if output_format in ['text', 'both']:
        text_table = format_text_table(info)
        print(text_table)
        print()
    
    if output_format in ['json', 'both']:
        json_data = to_json(info)
        print("📊 JSON 결과:")
        print(json.dumps(json_data, ensure_ascii=False, indent=2))
    
    extractor.close()


if __name__ == "__main__":
    main()
