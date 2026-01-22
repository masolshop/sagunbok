
import React, { useState, useEffect } from 'react';
import { ReportSubmission } from '../types';

const AdminView: React.FC = () => {
  const [submissions, setSubmissions] = useState<ReportSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sagunbok_submissions') || '[]');
    setSubmissions(saved);
  }, []);

  const clearData = () => {
    if (confirm("모든 데이터를 삭제하시겠습니까?")) {
      localStorage.removeItem('sagunbok_submissions');
      setSubmissions([]);
    }
  };

  const selected = submissions.find(s => s.id === selectedId);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">관리자 대시보드</h1>
          <p className="text-slate-500 mt-2">제출된 자가진단 및 시뮬레이션 결과를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/api/bulk/template" 
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition-all border border-green-200 shadow-sm"
          >
            <span>📊 일괄등록 템플릿</span>
          </a>
          <button 
            onClick={clearData}
            className="text-xs font-bold text-red-500 hover:underline"
          >
            데이터 전체 초기화
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* List */}
        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm h-[600px] flex flex-col">
          <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">제출 리스트 ({submissions.length})</div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {submissions.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">제출된 데이터가 없습니다.</div>
            ) : (
              submissions.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition ${selectedId === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="font-bold text-gray-900">{s.companyName || 'Unknown'}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(s.submittedAt).toLocaleString()}</div>
                  <div className="mt-2 flex space-x-1">
                    {s.diagnosisResult && <span className="text-[10px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded">진단완료</span>}
                    {s.calcResults.length > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">계산기기록</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="xl:col-span-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm h-[600px] overflow-y-auto">
          {selected ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center pb-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selected.companyName} 리포트</h2>
                  <p className="text-sm text-slate-500">ID: {selected.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-400 uppercase">Status</div>
                  <div className="text-green-600 font-bold">전송 완료</div>
                </div>
              </div>

              {selected.companyContext && (
                <div>
                  <h4 className="font-bold mb-3">기초 데이터</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Employee</div>
                      <div className="font-bold text-gray-900">{selected.companyContext.employeeCount || '-'}명</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                       <div className="text-[10px] text-gray-400 uppercase font-bold">Salary Avg</div>
                       <div className="font-bold text-gray-900">{selected.companyContext.avgSalary ? `₩${(selected.companyContext.avgSalary/10000).toLocaleString()}만` : '-'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                       <div className="text-[10px] text-gray-400 uppercase font-bold">Due from CEO</div>
                       <div className="font-bold text-gray-900">{selected.companyContext.dueFromCeo ? `₩${(selected.companyContext.dueFromCeo/10000).toLocaleString()}만` : '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {selected.diagnosisResult && (
                <div>
                   <h4 className="font-bold mb-3">자가진단 요약</h4>
                   <div className="bg-slate-900 text-white p-6 rounded-2xl">
                      <div className="text-center mb-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Index</div>
                        <div className="text-5xl font-black">{selected.diagnosisResult.overall}</div>
                      </div>
                      <div className="space-y-2">
                        {selected.diagnosisResult.top3.map((t, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-400">{t.title}</span>
                            <span className="font-bold text-blue-400">{t.score}%</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {selected.aiAnalysis && (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                   <h4 className="font-bold text-blue-800 mb-2">AI 컨설턴트 핵심 전략</h4>
                   <p className="text-blue-900/80 leading-relaxed text-sm">{selected.aiAnalysis.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              좌측 리스트에서 업체를 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
