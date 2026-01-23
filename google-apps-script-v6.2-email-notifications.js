/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2 - 이메일 알림 시스템 추가
 * 
 * 주요 변경사항 (v6.2):
 * - 회원가입 시 이메일 자동 발송 (관리자, 본인, 추천인)
 * - 승인 시 이메일 자동 발송 (본인)
 * - HTML 템플릿 기반 이메일 디자인
 * 
 * 기존 기능 (v6.1):
 * - POST와 GET 요청 모두 지원
 * - URL 파라미터로도 데이터 전달 가능
 * - JSON DB 이중 백업
 * - 회원가입/승인 시 자동 동기화
 */

// ========================================
// 설정
// ========================================

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEET_COMPANIES = '기업회원';
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// JSON 파일 이름
const JSON_ALL_MEMBERS = 'sagunbok_members_all.json';
const JSON_BY_CONSULTANT = 'sagunbok_members_by_consultant.json';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

// 관리자 이메일 - TODO: 실제 관리자 이메일로 변경
const ADMIN_EMAIL = 'admin@sagunbok.com';

// 이메일 발신자 이름
const SENDER_NAME = '사근복 AI';

