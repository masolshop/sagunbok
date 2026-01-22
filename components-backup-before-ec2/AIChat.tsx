
import React, { useState, useRef, useEffect } from 'react';
import { chatAssistant } from '../services/geminiService';

interface AIChatProps {
  companyContext: any;
  calcResults: any[];
  diagnosisResult: any | null;
}

const AIChat: React.FC<AIChatProps> = ({ companyContext, calcResults, diagnosisResult }) => {
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user', text: string }>>([
    { role: 'ai', text: "안녕하세요! 사내근로복지기금 컨설턴트입니다. 2025년 하반기 지원사업 공고(93만원/인 한도 등) 및 최신 정관 데이터를 학습했습니다. 무엇을 도와드릴까요?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const onSend = async () => {
    if (!input || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const state = { companyContext, calcResults, diagnosisResult };
      const res = await chatAssistant(userMsg, state);
      
      let aiText = res.explanation || res.next_question || "말씀하신 내용을 이해했습니다. 2025 하반기 공고에 맞춰 시뮬레이션을 진행해볼까요?";
      if (res.payload_patch) {
        aiText += "\n\n(입력 데이터를 추출하여 시뮬레이션에 반영할 준비가 되었습니다.)";
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "죄송합니다. 처리 중 오류가 발생했습니다." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-2 pb-4 border-b">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center relative">
          🤖
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 leading-tight">AI 컨설턴트</h3>
            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">2025 정책 학습됨</span>
          </div>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Knowledge Base Updated</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4 px-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-slate-700 rounded-tl-none whitespace-pre-wrap'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none space-x-1 flex">
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="bg-gray-50 rounded-2xl p-2 flex border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <input 
            type="text" 
            placeholder="예: 2025년 하반기 지원 한도가 얼마야?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            className="flex-1 bg-transparent border-none outline-none p-3 text-sm"
          />
          <button 
            onClick={onSend}
            className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-700 transition"
          >
            ➤
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">AI는 공고문 및 정관 데이터를 기반으로 안내합니다.</p>
      </div>
    </div>
  );
};

export default AIChat;
