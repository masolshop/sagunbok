// 사용자 타입
export interface User {
  userType: 'company' | 'consultant';
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  position?: string;
}

// 기타 타입들은 새 계산기 업로드 시 추가 예정
