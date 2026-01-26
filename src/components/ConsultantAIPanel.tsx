import React, { useState, useEffect } from 'react';

interface ConsultantAIPanelProps {
  currentUser: any;
  module: 'CORP_TAX' | 'STAFF_TAX' | 'CEO_TAX' | 'NETPAY';
  calcResult: any;
  caseMeta: {
    companyName: string;
    region: string;
    employeeCount: number | null;
  };
}

const ACTIONS = {
  SUMMARY: { label: '📊 요약', emoji: '📊', color: 'blue' },
  RISK_TOP3: { label: '⚠️ 리스크 TOP3', emoji: '⚠️', color: 'red' },
  SAGUNBOK_ROADMAP: { label: '🗺️ 사근복 로드맵', emoji: '🗺️', color: 'green' },
  OBJECTION: { label: '💬 반론 대응', emoji: '💬', color: 'purple' },
  CHECKLIST: { label: '✅ 체크리스트', emoji: '✅', color: 'yellow' },
  PDF_ONEPAGER: { label: '📄 PDF 원페이저', emoji: '📄', color: 'indigo' },
};

const API_BASE_URL = 'http://localhost:3002';

export default function ConsultantAIPanel({ currentUser, module, calcResult, caseMeta }: ConsultantAIPanelProps) {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // 컨설턴트 계정이 아니면 표시하지 않음
  if (!currentUser || currentUser.type !== 'consultant') {
    return null;
  }

  // API Key 상태 확인
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/consultant/api-key/status`, {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`, // Mock token
        },
      });
      const data = await response.json();
      setHasApiKey(data.hasKey || false);
    } catch (err) {
      console.error('Failed to check API key status:', err);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('API Key를 입력해주세요');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/consultant/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`,
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();
      if (data.ok) {
        setHasApiKey(true);
        setShowKeyInput(false);
        setApiKey('');
        setError(null);
      } else {
        setError('API Key 저장 실패');
      }
    } catch (err) {
      setError('API Key 저장 중 오류가 발생했습니다');
      console.error(err);
    }
  };

  const runAI = async (action: string) => {
    setLoading(action);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`,
        },
        body: JSON.stringify({
          module,
          action,
          calcResult,
          caseMeta,
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        setResults(prev => ({
          ...prev,
          [action]: data.result,
        }));
      } else {
        setError(data.error || 'AI 실행 실패');
      }
    } catch (err) {
      setError('AI 실행 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              컨설턴트 전용 AI
            </h3>
            <p className="text-sm text-slate-600">Claude 3.5 Sonnet 기반 맞춤 컨설팅</p>
          </div>
        </div>

        {/* API Key 설정 버튼 */}
        {!hasApiKey && (
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-bold"
          >
            🔑 API Key 등록
          </button>
        )}
        {hasApiKey && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl">
            <span className="text-lg">✓</span>
            <span className="text-sm font-bold">API Key 등록됨</span>
          </div>
        )}
      </div>

      {/* API Key 입력 폼 */}
      {showKeyInput && !hasApiKey && (
        <div className="mb-6 p-4 bg-white rounded-2xl border-2 border-purple-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Claude API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={saveApiKey}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold"
            >
              저장
            </button>
            <button
              onClick={() => setShowKeyInput(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* API Key 없으면 안내 메시지 */}
      {!hasApiKey && !showKeyInput && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔐</div>
          <p className="text-slate-600 mb-2">Claude API Key를 등록하면</p>
          <p className="text-slate-600">AI 컨설팅 기능을 사용할 수 있습니다</p>
        </div>
      )}

      {/* Action Buttons */}
      {hasApiKey && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {Object.entries(ACTIONS).map(([key, action]) => (
              <button
                key={key}
                onClick={() => runAI(key)}
                disabled={loading !== null}
                className={`
                  px-4 py-3 rounded-xl font-bold text-white
                  transition-all transform hover:scale-105 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${loading === key ? 'animate-pulse' : ''}
                  ${action.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/50 hover:shadow-lg' : ''}
                  ${action.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/50 hover:shadow-lg' : ''}
                  ${action.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/50 hover:shadow-lg' : ''}
                  ${action.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-purple-500/50 hover:shadow-lg' : ''}
                  ${action.color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-yellow-500/50 hover:shadow-lg' : ''}
                  ${action.color === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-indigo-500/50 hover:shadow-lg' : ''}
                `}
              >
                <span className="text-xl mr-2">{action.emoji}</span>
                {loading === key ? '생성 중...' : action.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              {Object.entries(results).map(([action, result]) => (
                <div key={action} className="p-4 bg-white rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{ACTIONS[action as keyof typeof ACTIONS].emoji}</span>
                    <h4 className="text-lg font-bold text-slate-800">
                      {ACTIONS[action as keyof typeof ACTIONS].label}
                    </h4>
                  </div>
                  <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {result}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t-2 border-purple-200">
        <p className="text-xs text-slate-500 text-center">
          🔒 이 패널은 <span className="font-bold text-purple-600">컨설턴트 계정</span>에서만 표시됩니다
        </p>
      </div>
    </div>
  );
}
