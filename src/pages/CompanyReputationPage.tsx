import React, { useState } from 'react';

interface ReputationResult {
  success: boolean;
  message?: string;
  data?: any;
  businessNumber?: string;
  companyName?: string;
}

const CompanyReputationPage: React.FC = () => {
  const [businessNumber, setBusinessNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookupResult, setLookupResult] = useState<ReputationResult | null>(null);
  const [saraminResult, setSaraminResult] = useState<ReputationResult | null>(null);
  const [blindResult, setBlindResult] = useState<ReputationResult | null>(null);

  // 사업자번호 포맷팅 (하이픈 제거)
  const formatBusinessNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  // 사업자번호 입력 핸들러
  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setBusinessNumber(formatted);
  };

  // 사업자번호로 회사명 조회
  const handleLookupBusinessNumber = async () => {
    if (!businessNumber || businessNumber.length !== 10) {
      setError('사업자등록번호는 10자리 숫자여야 합니다.');
      return;
    }

    setLoading(true);
    setError('');
    setLookupResult(null);

    try {
      const response = await fetch('/api/external-data/lookup-business-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber })
      });

      const data = await response.json();
      setLookupResult(data);

      if (data.success && data.companyName) {
        setCompanyName(data.companyName);
        setError('');
      } else {
        setError(data.message || '회사명을 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('사업자번호 조회 실패:', err);
      setError('사업자번호 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사람인 분석
  const handleSaraminAnalysis = async () => {
    if (!companyName.trim()) {
      setError('회사명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSaraminResult(null);

    try {
      const response = await fetch('/api/external-data/job-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName })
      });

      const data = await response.json();
      setSaraminResult(data);

      if (!data.success) {
        setError(data.message || '사람인 분석 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('사람인 분석 실패:', err);
      setError('사람인 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 블라인드 분석
  const handleBlindAnalysis = async () => {
    if (!companyName.trim()) {
      setError('회사명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setBlindResult(null);

    try {
      const response = await fetch('/api/external-data/review-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName })
      });

      const data = await response.json();
      setBlindResult(data);

      if (!data.success) {
        setError(data.message || '블라인드 분석 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('블라인드 분석 실패:', err);
      setError('블라인드 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 결과 렌더링
  const renderResult = (result: ReputationResult | null, title: string) => {
    if (!result) return null;

    return (
      <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
        <h3 className="text-lg font-bold text-blue-900 mb-3">{title}</h3>
        {result.success ? (
          <div className="space-y-2">
            <p className="text-green-700 font-semibold">✅ {result.message}</p>
            {result.data && (
              <pre className="mt-3 p-4 bg-white rounded-lg text-xs overflow-x-auto border border-blue-200">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-red-600 font-semibold">❌ {result.message}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 shadow-2xl text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
            🔍
          </div>
          <div>
            <h1 className="text-3xl font-black">기업평판분석</h1>
            <p className="text-purple-100 text-sm mt-1">구인구직 & 리뷰 데이터 분석</p>
          </div>
        </div>
        <p className="text-purple-100 leading-relaxed">
          사업자등록번호로 회사명을 조회하고, 사람인과 블라인드 등의 플랫폼에서 기업 평판 데이터를 분석합니다.
        </p>
      </div>

      {/* 메인 입력 카드 */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
        <div className="space-y-6">
          {/* 사업자등록번호 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              사업자등록번호 (선택)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={businessNumber}
                onChange={handleBusinessNumberChange}
                placeholder="1234567890 (10자리)"
                maxLength={10}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
              />
              <button
                onClick={handleLookupBusinessNumber}
                disabled={loading || businessNumber.length !== 10}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
              >
                🔍 조회
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * 하이픈 없이 10자리 숫자만 입력하세요
            </p>
          </div>

          {/* 회사명 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              회사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="회사명을 입력하세요"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-semibold">
              ❌ {error}
            </div>
          )}

          {/* 로딩 표시 */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-4 text-purple-700 font-semibold">분석 중...</span>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleSaraminAnalysis}
              disabled={loading || !companyName.trim()}
              className="py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="text-2xl">💼</span>
              <span>사람인 분석</span>
            </button>

            <button
              onClick={handleBlindAnalysis}
              disabled={loading || !companyName.trim()}
              className="py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="text-2xl">💬</span>
              <span>블라인드 분석</span>
            </button>
          </div>
        </div>
      </div>

      {/* 결과 표시 */}
      {renderResult(lookupResult, '사업자번호 조회 결과')}
      {renderResult(saraminResult, '사람인 분석 결과')}
      {renderResult(blindResult, '블라인드 분석 결과')}

      {/* 안내 사항 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">ℹ️</span>
          <span>사용 안내</span>
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">1.</span>
            <span><strong>사업자번호 조회</strong>: 10자리 사업자등록번호를 입력하면 회사명을 자동으로 조회합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">2.</span>
            <span><strong>사람인 분석</strong>: 해당 회사의 채용 공고, 복지 정보, 기업 정보를 분석합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">3.</span>
            <span><strong>블라인드 분석</strong>: 직원 리뷰, 평점, 회사 분위기 등의 정보를 수집합니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">4.</span>
            <span>분석 결과는 JSON 형식으로 표시되며, 실시간 데이터를 기반으로 합니다.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyReputationPage;
