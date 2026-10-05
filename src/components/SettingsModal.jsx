import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Key,
  ShieldCheck,
  Check,
  AlertCircle,
  FileJson,
  Cpu
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onImportData,
  onResetData,
  customApiKey,
  setCustomApiKey,
  apiProvider,
  setApiProvider,
}) {
  if (!isOpen) return null;

  const [tempApiKey, setTempApiKey] = useState(customApiKey || '');
  const [tempProvider, setTempProvider] = useState(apiProvider || 'mock');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  const handleSaveApiSettings = (e) => {
    e.preventDefault();
    setCustomApiKey(tempApiKey.trim());
    setApiProvider(tempProvider);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      categories,
      bookmarks,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LinkVault-AI-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
          onImportData(parsed.bookmarks, parsed.categories || categories);
          setImportError('');
          alert('資料匯入成功！');
          onClose();
        } else {
          setImportError('匯入格式不正確，找不到 bookmarks 陣列');
        }
      } catch (err) {
        setImportError('無法解析 JSON 檔案，請確認格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-xl w-full max-h-[94vh] sm:max-h-[88vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">情報庫設定與備份管理</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">配置 AI 推論引擎、備份與還原本地收藏資料</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs">
          
          {/* AI Engine Configuration */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI 分析引擎配置</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                預設免 API Key 即開即用
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed">
              系統內建「在地智慧語意分析引擎」，能即時爬梳 GitHub 活躍度、網域分類與關鍵重點，無需提供任何金鑰即可完美運行。若您希望調用真實的大語言模型，可在此填寫您的 API Key。
            </p>

            <form onSubmit={handleSaveApiSettings} className="space-y-3 pt-1">
              <div>
                <label className="block font-medium text-slate-400 mb-1">
                  選擇 AI 供應商
                </label>
                <select
                  value={tempProvider}
                  onChange={(e) => setTempProvider(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="mock">內建本地智慧分析引擎 (無需 API Key，零延遲)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="openrouter">OpenRouter (Claude 3.5 Haiku / Llama 3)</option>
                  <option value="groq">Groq (Llama 3.3 70B 極速推論)</option>
                </select>
              </div>

              {tempProvider !== 'mock' && (
                <div>
                  <label className="block font-medium text-slate-400 mb-1">
                    API 金鑰 (API Key)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    金鑰僅保存在您本機的瀏覽器 LocalStorage 中，絕不傳送到任何外部伺服器。
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {saveSuccess ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 已成功儲存設定
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/25"
                >
                  儲存 AI 設定
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Export / Import */}
          <div className="space-y-3">
            <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span>資料備份與還原</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export JSON */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">匯出完整 JSON 備份</div>
                  <p className="text-slate-400 mt-0.5">
                    將目前的 {bookmarks.length} 筆收藏與所有分類完整打包下載。
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載備份檔案 (.json)</span>
                </button>
              </div>

              {/* Import JSON */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-200">匯入 JSON 備份</div>
                  <p className="text-slate-400 mt-0.5">
                    還原過往備份的情報庫檔案或與其他設備同步。
                  </p>
                </div>
                <label className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>選擇 JSON 檔案匯入</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importError && (
              <div className="text-rose-300 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          {/* Reset to Seeds */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">重設為初始精選示範資料</div>
              <p className="text-slate-400">將情報庫還原至初始推薦的 GitHub 與素材庫資料。</p>
            </div>
            <button
              onClick={() => {
                if (confirm('確定要將所有收藏與分類重設為初始示範資料嗎？現有新增的項目將會被重設。')) {
                  onResetData();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 border border-rose-800/60 rounded-lg font-semibold transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置範例</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
}
