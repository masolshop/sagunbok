/**
 * 전화번호 정규화 유틸리티
 */

/**
 * 전화번호를 01012345678 형식으로 정규화
 * @param phone - 입력된 전화번호 (010-1234-5678, 01012345678, 1012345678 등)
 * @returns 정규화된 전화번호 (01012345678) 또는 null (잘못된 형식)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // 하이픈, 공백, 괄호 제거
  let cleaned = String(phone).replace(/[-\s()]/g, '');
  
  // 숫자만 남김
  cleaned = cleaned.replace(/\D/g, '');
  
  // 10자리인 경우 (앞의 0이 없는 경우) 0 추가
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  // 11자리 검증
  if (cleaned.length !== 11) {
    return null; // 잘못된 형식
  }
  
  // 010, 011, 016, 017, 018, 019로 시작하는지 확인
  if (!cleaned.match(/^01[0-9]/)) {
    return null;
  }
  
  return cleaned;
}

/**
 * 전화번호를 화면 표시용 형식으로 변환 (010-1234-5678)
 * @param phone - 정규화된 전화번호
 * @returns 하이픈이 포함된 전화번호
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return phone || '';
  
  // 010-1234-5678 형식으로 변환
  return normalized.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}

/**
 * 전화번호 유효성 검사
 * @param phone - 검사할 전화번호
 * @returns 유효 여부
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  return normalizePhoneNumber(phone) !== null;
}

/**
 * 두 전화번호가 동일한지 비교
 * @param phone1 - 첫 번째 전화번호
 * @param phone2 - 두 번째 전화번호
 * @returns 동일 여부
 */
export function isSamePhoneNumber(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  if (!normalized1 || !normalized2) return false;
  
  return normalized1 === normalized2;
}
