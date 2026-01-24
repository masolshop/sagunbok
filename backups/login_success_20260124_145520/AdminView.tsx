import React, { useState, useEffect } from 'react';

interface Member {
  type: 'company' | 'manager' | 'consultant';
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  referrer?: string;
  status: string;
  registeredAt: string;
}

interface AdminViewProps {
  currentUser?: any;
}

const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'company' | 'manager' | 'consultant'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 전체 관리자 여부 확인
  const isSuperAdmin = currentUser?.phone === '01063529091';
  const isConsultant = currentUser?.userType === 'consultant';
  const consultantName = currentUser?.name;

  useEffect(() => {
    fetchMembers();
  }, []);

  // Apps Script Web App URL (v6.2.8 - I열 승인여부 통일)
  const API_URL = 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec';

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'getAllMembers' });
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      if (data.success && data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncJsonFiles = async () => {
    if (!confirm('Google Drive JSON 파일을 동기화하시겠습니까?')) return;
    
    try {
      const params = new URLSearchParams({ action: 'syncJson' });
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ JSON 파일 동기화가 완료되었습니다!');
      } else {
        alert('❌ JSON 동기화 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Failed to sync JSON:', error);
      alert('❌ JSON 동기화 중 오류가 발생했습니다.');
    }
  };

  const downloadJsonFiles = async () => {
    try {
      const params = new URLSearchParams({ action: 'getJsonUrls' });
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      if (data.success && data.urls) {
        alert('JSON 파일 다운로드 링크:\n\n' +
          `전체 회원: ${data.urls.allMembers}\n\n` +
          `컨설턴트별: ${data.urls.byConsultant}\n\n` +
          '링크를 복사하여 브라우저에서 다운로드하세요.');
      } else {
        alert('❌ JSON URL 조회 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Failed to get JSON URLs:', error);
      alert('❌ JSON URL 조회 중 오류가 발생했습니다.');
    }
  };

  const updateMemberStatus = async (phone: string, type: 'company' | 'manager' | 'consultant', newStatus: string) => {
    try {
      const params = new URLSearchParams({
        action: 'updateMemberStatus',
        phone,
        type,
        status: newStatus
      });
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();
      if (data.success) {
        alert('승인 상태가 업데이트되었습니다.');
        fetchMembers();
      } else {
        alert('업데이트 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 필터링 로직
  const filteredMembers = members.filter(m => {
    // 컨설턴트는 자신이 추천한 회원만 볼 수 있음
    if (isConsultant && !isSuperAdmin) {
      if (m.type === 'company' && m.referrer !== consultantName) {
        return false;
      }
      // 컨설턴트는 다른 컨설턴트를 볼 수 없음
      if (m.type === 'consultant') {
        return false;
      }
    }

    // 타입 필터
    if (filter !== 'all' && m.type !== filter) return false;

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        m.name?.toLowerCase().includes(term) ||
        m.phone?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.companyName?.toLowerCase().includes(term) ||
        m.referrer?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // 통계
  const stats = {
    total: filteredMembers.length,
    pending: filteredMembers.filter(m => m.status === '승인대기').length,
    approved: filteredMembers.filter(m => m.status === '승인완료').length,
    rejected: filteredMembers.filter(m => m.status === '승인거부').length,
    companies: filteredMembers.filter(m => m.type === 'company').length,
    managers: filteredMembers.filter(m => m.type === 'manager').length,
    consultants: filteredMembers.filter(m => m.type === 'consultant').length
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">
              {isSuperAdmin ? '전체 관리자 대시보드' : '컨설턴트 대시보드'}
            </h1>
            <p className="text-2xl lg:text-3xl text-slate-500 font-bold leading-relaxed mt-2">
              {isSuperAdmin 
                ? '모든 회원을 관리하고 승인할 수 있습니다.' 
                : `${consultantName}님이 추천한 기업회원 리스트입니다.`}
            </p>
          </div>
          <div className="flex gap-3">
            {isSuperAdmin && (
              <>
                <button 
                  onClick={syncJsonFiles}
                  className="px-6 py-3 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-lg whitespace-nowrap"
                >
                  💾 JSON 동기화
                </button>
                <button 
                  onClick={downloadJsonFiles}
                  className="px-6 py-3 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-lg whitespace-nowrap"
                >
                  📥 JSON 다운로드
                </button>
              </>
            )}
            <button 
              onClick={fetchMembers}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg whitespace-nowrap"
            >
              {loading ? '⏳ 로딩중...' : '🔄 새로고침'}
            </button>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              {isSuperAdmin ? '👑' : '👔'}
            </div>
            <div>
              <div className="text-sm font-black text-blue-400 uppercase tracking-widest">
                {isSuperAdmin ? 'Super Admin' : 'Consultant'}
              </div>
              <div className="text-2xl font-black text-slate-900">{currentUser?.name || '관리자'}</div>
              <div className="text-sm text-slate-600 font-bold">{currentUser?.phone}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">전체</div>
          <div className="text-4xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-2xl border-2 border-yellow-100 shadow-sm">
          <div className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-2">승인대기</div>
          <div className="text-4xl font-black text-yellow-700">{stats.pending}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100 shadow-sm">
          <div className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">승인완료</div>
          <div className="text-4xl font-black text-green-700">{stats.approved}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 shadow-sm">
          <div className="text-xs font-black text-red-600 uppercase tracking-widest mb-2">승인거부</div>
          <div className="text-4xl font-black text-red-700">{stats.rejected}</div>
        </div>
        {isSuperAdmin && (
          <>
            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
              <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">기업회원</div>
              <div className="text-4xl font-black text-blue-700">{stats.companies}</div>
            <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100 shadow-sm">
              <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">매니저</div>
              <div className="text-4xl font-black text-indigo-700">{stats.managers}</div>
            </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100 shadow-sm">
              <div className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2">컨설턴트</div>
              <div className="text-4xl font-black text-purple-700">{stats.consultants}</div>
            </div>
          </>
        )}
      </div>

      {/* JSON DB Info - 전체 관리자만 표시 */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">💾</div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-slate-900 mb-2">JSON DB 이중 백업 시스템</h3>
              <ul className="space-y-2 text-slate-700 font-bold mb-4">
                <li>• <b>메인 DB</b>: Google Sheets (수동 관리 용이)</li>
                <li>• <b>백업 DB</b>: Google Drive JSON 파일 (자동 동기화)</li>
                <li>• <b>자동 동기화</b>: 회원가입/승인 시 JSON 자동 업데이트</li>
                <li>• <b>파일 종류</b>: ① 전체 회원 DB ② 컨설턴트별 추천 회원 DB</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={syncJsonFiles}
                  className="px-5 py-2 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-sm"
                >
                  💾 수동 동기화
                </button>
                <button
                  onClick={downloadJsonFiles}
                  className="px-5 py-2 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition-all text-sm"
                >
                  📥 다운로드 링크 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-black transition-all ${
                filter === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('company')}
              className={`px-6 py-3 rounded-xl font-black transition-all ${
                filter === 'company' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏢 기업회원
            </button>
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setFilter('manager')}
                  className={`px-6 py-3 rounded-xl font-black transition-all ${
                    filter === 'manager' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  👨‍💼 매니저
                </button>
                <button
                  onClick={() => setFilter('consultant')}
                  className={`px-6 py-3 rounded-xl font-black transition-all ${
                    filter === 'consultant' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  👔 컨설턴트
                </button>
              </>
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름, 전화번호, 이메일, 회사명 검색..."
            className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">구분</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">이름</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">전화번호</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">이메일</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">회사명</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">추천인</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">가입일</th>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">상태</th>
                {isSuperAdmin && (
                  <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest">액션</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-12 text-center text-slate-400 font-bold">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-12 text-center text-slate-400 font-bold">
                    회원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black ${
                        member.type === 'company' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {member.type === 'company' ? '🏢 기업' : '👔 컨설턴트'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">{member.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{member.phone}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-sm">{member.email || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{member.companyName || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{member.referrer || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-sm">
                      {member.registeredAt ? new Date(member.registeredAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                        member.status === '승인완료' 
                          ? 'bg-green-100 text-green-700' 
                          : member.status === '승인대기'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {member.status !== '승인완료' && (
                            <button
                              onClick={() => updateMemberStatus(member.phone, member.type, '승인완료')}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition-all"
                            >
                              승인
                            </button>
                          )}
                          {member.status !== '승인거부' && (
                            <button
                              onClick={() => updateMemberStatus(member.phone, member.type, '승인거부')}
                              className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-lg hover:bg-red-700 transition-all"
                            >
                              거부
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 컨설턴트용 추가 안내 */}
      {isConsultant && !isSuperAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">컨설턴트 대시보드 안내</h3>
              <ul className="space-y-2 text-slate-700 font-bold">
                <li>• 내가 추천한 기업회원만 표시됩니다.</li>
                <li>• 회원의 가입일, 승인 상태를 확인할 수 있습니다.</li>
                <li>• 승인 권한은 전체 관리자만 가능합니다.</li>
                <li>• 추천인 필드에 내 이름({consultantName})이 입력된 회원만 표시됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
