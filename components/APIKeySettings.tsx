
import React, { useState, useEffect } from 'react';

interface APIKeySettingsProps {
  onClose: () => void;
}

const APIKeySettings: React.FC<APIKeySettingsProps> = ({ onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saveToLocal, setSaveToLocal] = useState(true);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // 기존 저장된 키 불러오기
    const savedGemini = localStorage.getItem('gemini_api_key') || sessionStorage.getItem('gemini_api_key') || '';
    const savedOpenAI = localStorage.getItem('openai_api_key') || sessionStorage.getItem('openai_api_key') || '';
    setGeminiKey(savedGemini);
    setOpenaiKey(savedOpenAI);
  }, []);

  const handleSave = () => {
    const storage = saveToLocal ? localStorage : sessionStorage;
    
    if (geminiKey.trim()) {
      storage.setItem('gemini_api_key', geminiKey.trim());
    } else {
      storage.removeItem('gemini_api_key');
      localStorage.removeItem('gemini_api_key');
      sessionStorage.removeItem('gemini_api_key');
    }

    if (openaiKey.trim()) {
      storage.setItem('openai_api_key', openaiKey.trim());
    } else {
      storage.removeItem('openai_api_key');
      localStorage.removeItem('openai_api_key');
      sessionStorage.removeItem('openai_api_key');
    }

    alert('API 키가 저장되었습니다!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">🔑 API 키 설정</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <p className="text-sm text-gray-600 mt-2">AI 기능을 사용하려면 본인의 API 키를 입력하세요.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Google Gemini API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">Google Gemini API Key</label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                API 키 발급받기 →
              </a>
            </div>
            <input
              type={showKeys ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500">
              💡 AI 챗봇 및 진단 분석 기능에 사용됩니다.
            </p>
          </div>

          {/* OpenAI API (향후 지원) */}
          <div className="space-y-3 opacity-50">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">OpenAI API Key (준비 중)</label>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
            <input
              type={showKeys ? "text" : "password"}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              💡 향후 GPT 모델 지원 예정입니다.
            </p>
          </div>

          {/* 보안 옵션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showKeys"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="showKeys" className="text-sm font-medium text-slate-700">
                API 키 표시
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveToLocal"
                checked={saveToLocal}
                onChange={(e) => setSaveToLocal(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="saveToLocal" className="text-sm font-medium text-slate-700">
                브라우저에 영구 저장 (체크 해제 시 세션만 유지)
              </label>
            </div>

            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <p>🔒 <strong>보안 안내:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.</li>
                <li>공용 컴퓨터에서는 세션 저장을 권장합니다.</li>
                <li>API 키는 언제든지 삭제하거나 변경할 수 있습니다.</li>
              </ul>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              저장
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeySettings;
