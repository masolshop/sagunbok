
import React, { useState } from 'react';
import { DIAGNOSIS_AREAS } from '../constants';
import { DiagnosisResult, CompanyContext } from '../types';
import { analyzeDiagnosis } from '../services/geminiService';

interface DiagnosisProps {
  companyContext: CompanyContext;
  setCompanyContext: (ctx: CompanyContext) => void;
  answers: Record<string, number[]>;
  setAnswers: (answers: Record<string, number[]>) => void;
  setDiagnosisResult: (res: DiagnosisResult) => void;
  diagnosisResult: DiagnosisResult | null;
  setAiAnalysis: (res: any) => void;
  aiAnalysis: any | null;
  onSave: () => void;
}

const Diagnosis: React.FC<DiagnosisProps> = ({ 
  companyContext, 
  setCompanyContext, 
  answers,
  setAnswers,
  setDiagnosisResult, 
  diagnosisResult, 
  setAiAnalysis, 
  aiAnalysis,
  onSave 
}) => {
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (areaKey: string, qIdx: number, val: number) => {
    const current = answers[areaKey] || new Array(5).fill(0);
    const newAnswers = [...current];
    newAnswers[qIdx] = val;
    setAnswers({ ...answers, [areaKey]: newAnswers });
  };

  const runDiagnosis = async () => {
    setLoading(true);
    const results = DIAGNOSIS_AREAS.map(area => {
      const areaAnswers = answers[area.key] || [0, 0, 0, 0, 0];
      const sum = areaAnswers.reduce((a, b) => a + b, 0);
      const score = Math.round((sum / 10) * 100);
      return {
        key: area.key,
        title: area.title,
        answers: areaAnswers,
        score,
        level: score >= 70 ? "높음" : score >= 40 ? "보통" : "낮음"
      };
    });

    const overall = Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length);
    const top3 = [...results].sort((a, b) => b.score - a.score).slice(0, 3).map(r => ({ title: r.title, score: r.score }));

    const diagRes = { overall, results, top3 };
    setDiagnosisResult(diagRes);

    try {
      const analysis = await analyzeDiagnosis(diagRes, companyContext);
      setAiAnalysis(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">기업리스크진단</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 font-bold italic leading-snug">7개 핵심 지표를 통한 기금 도입 필요성 및 리스크 정밀 진단</p>
      </header>

      {/* Stats Input Section */}
      <section className="bg-white rounded-[48px] border-4 border-slate-50 p-12 shadow-2xl space-y-10">
        <h3 className="font-black text-slate-900 border-l-[12px] border-[#1a5f7a] pl-6 text-2xl lg:text-3xl">기초 진단 데이터</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-4">
          <div className="space-y-4">
            <label className="text-xl font-black text-slate-500 uppercase tracking-widest block">직원수 (명)</label>
            <input type="number" value={companyContext.employeeCount || ''} onChange={(e) => setCompanyContext({...companyContext, employeeCount: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-6 text-3xl font-black focus:ring-4 focus:ring-blue-500/10 outline-none shadow-inner" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-black text-slate-500 uppercase tracking-widest block">평균 연봉 (원)</label>
            <input type="number" value={companyContext.avgSalary || ''} onChange={(e) => setCompanyContext({...companyContext, avgSalary: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-6 text-3xl font-black focus:ring-4 focus:ring-blue-500/10 outline-none shadow-inner" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-black text-slate-500 uppercase tracking-widest block">가지급금 (원)</label>
            <input type="number" value={companyContext.dueFromCeo || ''} onChange={(e) => setCompanyContext({...companyContext, dueFromCeo: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-6 text-3xl font-black focus:ring-4 focus:ring-blue-500/10 outline-none shadow-inner" />
          </div>
        </div>
      </section>

      {/* Checklist Sections */}
      <div className="space-y-12">
        {DIAGNOSIS_AREAS.map((area) => (
          <div key={area.key} className="bg-white rounded-[48px] border-4 border-slate-50 overflow-hidden shadow-2xl">
            <div className="bg-slate-50 p-8 border-b-2 border-slate-100 flex justify-between items-center px-12">
              <h4 className="font-black text-slate-800 text-2xl lg:text-3xl">{area.title}</h4>
              <span className="text-xs font-black px-4 py-1.5 bg-slate-200 text-slate-500 rounded-full uppercase tracking-widest">Section Index: {area.key}</span>
            </div>
            <div className="p-12 space-y-10">
              {area.questions.map((q, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-6 border-b-2 border-slate-50 last:border-none group transition-all">
                  <p className="text-xl lg:text-2xl font-bold text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                    <span className="text-slate-300 mr-3">{idx + 1}.</span> {q}
                  </p>
                  <div className="flex space-x-4 shrink-0">
                    {[0, 1, 2].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswerChange(area.key, idx, val)}
                        className={`w-16 h-16 rounded-[24px] font-black text-xl transition-all shadow-md ${ (answers[area.key]?.[idx] ?? 0) === val ? 'bg-[#1a5f7a] text-white scale-110 shadow-xl ring-4 ring-blue-500/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200' }`}
                      >
                        {val === 0 ? 'X' : val === 1 ? '?' : 'O'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 sticky bottom-8 z-30">
        <button 
          onClick={runDiagnosis}
          disabled={loading}
          className="flex-1 bg-[#0f2e44] text-white text-3xl font-black py-10 rounded-[40px] hover:bg-black transition-all shadow-2xl disabled:bg-slate-400 transform hover:-translate-y-2 active:translate-y-0"
        >
          {loading ? 'AI 분석 모델 정밀 가동 중...' : '리스크 진단 및 AI 심층 해석 실행 🤖'}
        </button>
      </div>

      {diagnosisResult && (
        <section className="bg-[#1a5f7a] text-white rounded-[60px] p-12 lg:p-20 shadow-2xl space-y-14 animate-in zoom-in-95 duration-700">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
            <div className="space-y-4">
              <h2 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none">진단 결과 보고서</h2>
              <p className="text-2xl lg:text-4xl text-blue-100 font-bold opacity-90 leading-relaxed">
                귀사의 통합 리스크 지수: <br className="lg:hidden" />
                <span className="text-white underline decoration-blue-400 underline-offset-12 decoration-8 decoration-wavy ml-2">{diagnosisResult.overall}점</span>
              </p>
            </div>
            <div className="bg-white/10 p-10 rounded-[48px] backdrop-blur-3xl border-2 border-white/20 shadow-2xl flex items-center justify-center">
              <span className="text-8xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-2xl">{diagnosisResult.overall}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {diagnosisResult.top3.map((t, idx) => (
              <div key={idx} className="bg-white/5 p-10 rounded-[48px] border-2 border-white/10 backdrop-blur-sm space-y-6 group hover:bg-white/10 transition-all">
                <div className="text-sm font-black text-blue-200 uppercase tracking-widest border-b-2 border-white/10 pb-2 inline-block">위험 영역 {idx + 1}</div>
                <div className="font-black text-2xl lg:text-3xl leading-snug h-24 overflow-hidden group-hover:text-blue-300 transition-colors">{t.title}</div>
                <div className="text-5xl lg:text-6xl font-black text-blue-300 tracking-tighter">{t.score}%</div>
              </div>
            ))}
          </div>

          {aiAnalysis && (
            <div className="bg-white text-slate-900 rounded-[60px] p-12 lg:p-16 space-y-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="flex items-center space-x-4 text-[#1a5f7a] font-black text-3xl relative z-10">
                <span className="text-5xl">🤖</span>
                <span>AI 컨설턴트 정밀 소견</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold leading-relaxed text-slate-700 relative z-10">{aiAnalysis.summary}</p>
              
              <div className="space-y-10 mt-16 relative z-10">
                <h4 className="font-black text-[#1a5f7a] text-xl lg:text-2xl uppercase tracking-[0.2em] border-l-8 border-[#1a5f7a] pl-6">Recommended Action Roadmap</h4>
                <div className="grid grid-cols-1 gap-8">
                  {aiAnalysis.actions?.map((action: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start gap-8 p-10 bg-slate-50 border-2 border-slate-100 rounded-[40px] transition-all hover:bg-white hover:shadow-2xl hover:-translate-y-2">
                      <div className="w-20 h-20 rounded-3xl bg-[#1a5f7a] text-white flex items-center justify-center font-black text-3xl shrink-0 shadow-2xl">{action.priority}</div>
                      <div className="space-y-3">
                        <div className="font-black text-slate-900 text-2xl lg:text-3xl tracking-tight">{action.title}</div>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">{action.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={onSave}
                className="w-full mt-12 bg-[#1a5f7a] text-white text-3xl font-black py-10 rounded-[32px] hover:bg-[#0f2e44] transition-all shadow-2xl transform active:scale-[0.98] flex items-center justify-center gap-4"
              >
                <span>진단 결과 관리자 시스템 안전 전송</span>
                <span className="text-4xl">📁</span>
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Diagnosis;
