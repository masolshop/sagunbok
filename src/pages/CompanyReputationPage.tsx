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
      <div className="mt-8 p-8 bg-blue-50 border-2 border-blue-300 rounded-2xl">
        <h3 className="text-2xl font-bold text-blue-900 mb-4">{title}</h3>
        {result.success ? (
          <div className="space-y-3">
            <p className="text-green-700 text-lg font-bold">✅ {result.message}</p>
            {result.data && (
              <pre className="mt-4 p-6 bg-white rounded-lg text-base overflow-x-auto border-2 border-blue-200 font-mono">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-red-600 text-lg font-bold">❌ {result.message}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-10 shadow-2xl text-white">
        <div className="flex items-center gap-5 mb-5">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl">
            🔍
          </div>
          <div>
            <h1 className="text-4xl font-black">기업평판분석</h1>
            <p className="text-blue-100 text-xl mt-2">구인구직 & 리뷰 데이터 분석</p>
          </div>
        </div>
        <p className="text-blue-50 text-lg leading-relaxed">
          사업자등록번호로 회사명을 조회하고, 사람인과 블라인드 등의 플랫폼에서 기업 평판 데이터를 분석합니다.
        </p>
      </div>

      {/* 메인 입력 카드 */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-100 p-10">
        <div className="space-y-8">
          {/* 사업자등록번호 */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              사업자등록번호 (선택)
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={businessNumber}
                onChange={handleBusinessNumberChange}
                placeholder="1234567890 (10자리)"
                maxLength={10}
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-semibold"
              />
              <button
                onClick={handleLookupBusinessNumber}
                disabled={loading || businessNumber.length !== 10}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
              >
                🔍 조회
              </button>
            </div>
            <p className="text-base text-gray-600 mt-3 font-medium">
              * 하이픈 없이 10자리 숫자만 입력하세요
            </p>
          </div>

          {/* 회사명 */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              회사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="회사명을 입력하세요"
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-semibold"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-5 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 text-lg font-bold">
              ❌ {error}
            </div>
          )}

          {/* 로딩 표시 */}
          {loading && (
            <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <span className="ml-5 text-blue-700 text-xl font-bold">분석 중...</span>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
            <button
              onClick={handleSaraminAnalysis}
              disabled={loading || !companyName.trim()}
              className="py-5 px-8 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-200 text-blue-800 text-xl font-bold rounded-xl shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-blue-300"
            >
              <span className="text-3xl">💼</span>
              <span>사람인 분석</span>
            </button>

            <button
              onClick={handleBlindAnalysis}
              disabled={loading || !companyName.trim()}
              className="py-5 px-8 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-200 text-blue-800 text-xl font-bold rounded-xl shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-blue-300"
            >
              <span className="text-3xl">💬</span>
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-10 border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-3">
          <span className="text-3xl">ℹ️</span>
          <span>사용 안내</span>
        </h3>
        <ul className="space-y-4 text-gray-700 text-lg">
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold text-xl">1.</span>
            <span><strong className="text-blue-700">사업자번호 조회</strong>: 10자리 사업자등록번호를 입력하면 회사명을 자동으로 조회합니다.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold text-xl">2.</span>
            <span><strong className="text-blue-700">사람인 분석</strong>: 해당 회사의 채용 공고, 복지 정보, 기업 정보를 분석합니다.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold text-xl">3.</span>
            <span><strong className="text-blue-700">블라인드 분석</strong>: 직원 리뷰, 평점, 회사 분위기 등의 정보를 수집합니다.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold text-xl">4.</span>
            <span>분석 결과는 JSON 형식으로 표시되며, 실시간 데이터를 기반으로 합니다.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyReputationPage;
