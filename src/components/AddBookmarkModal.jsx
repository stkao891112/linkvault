import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Link2,
  FileText,
  Folder,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Palette,
  Lightbulb,
  Tag
} from 'lucide-react';
import { GithubIcon } from './Icons';
import { analyzeUrlWithAI } from '../services/aiService';

const SAMPLE_PRESETS = [
  { label: 'Tailwind CSS', url: 'https://github.com/tailwindlabs/tailwindcss', note: '現代前端主流 Utility-first CSS 框架，v4 全面 Rust 化重寫' },
  { label: 'Unsplash 免費圖庫', url: 'https://unsplash.com', note: '高解析度無版權商業攝影圖庫，找首頁 Hero 背景圖首選' },
  { label: 'v0 by Vercel', url: 'https://v0.dev', note: '生成式 UI 工具，輸入自然語言快速產出 React + Tailwind 程式碼' },
  { label: 'Figma 社群資源', url: 'https://www.figma.com/community', note: '海量設計師分享的開源 UI Kit、設計規範與外掛' },
];

export default function AddBookmarkModal({
  isOpen,
  onClose,
  categories,
  onSaveBookmark,
  customApiKey,
  apiProvider,
  customBaseUrl = '',
  customModel = '',
}) {
  const [url, setUrl] = useState('');
  const [userNote, setUserNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setUrl(preset.url);
    setUserNote(preset.note);
    setErrorMsg('');
  };

  const handleStartAnalysis = async () => {
    if (!url.trim()) {
      setErrorMsg('請輸入或貼上網址');
      return;
    }

    try {
      setErrorMsg('');
      setIsAnalyzing(true);
      setAnalysisStep('正在解析網域與獲取網頁資訊...');

      await new Promise((r) => setTimeout(r, 400));
      setAnalysisStep('正在調用 AI 知識引擎萃取核心特點...');

      const result = await analyzeUrlWithAI({
        url: url.trim(),
        userNote: userNote.trim(),
        customApiKey,
        apiProvider,
        customBaseUrl,
        customModel,
      });

      await new Promise((r) => setTimeout(r, 500));
      setAnalysisStep('智能生成標籤與建議分類...');

      setAnalysisResult(result);
      if (selectedCategory === 'auto' && result.categoryId) {
        setSelectedCategory(result.categoryId);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('分析時發生問題，請檢查網址或重試');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleConfirmSave = () => {
    if (!url.trim()) return;

    const finalCatId = selectedCategory === 'auto'
      ? (analysisResult?.categoryId || 'cat-tools')
      : selectedCategory;

    const newBookmark = {
      id: `bm-${Date.now()}`,
      url: url.trim(),
      title: analysisResult?.title || url.trim(),
      domain: analysisResult?.domain || new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
      favicon: analysisResult?.favicon || `https://www.google.com/s2/favicons?domain=web&sz=64`,
      categoryId: finalCatId,
      userNote: userNote.trim(),
      aiSummary: analysisResult?.aiSummary || {
        oneLiner: userNote.trim() || '使用者手動收錄網址',
        highlights: ['手動收錄之網站資源'],
        useCases: ['日常開發與設計參考'],
        suggestedCategory: finalCatId,
        suggestedTags: ['常用收藏'],
      },
      tags: analysisResult?.tags || ['自訂收藏'],
      isFavorite: false,
      status: 'unread',
      createdAt: new Date().toISOString(),
      githubStats: analysisResult?.githubStats,
    };

    onSaveBookmark(newBookmark);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setUrl('');
    setUserNote('');
    setSelectedCategory('auto');
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-2xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">收錄新網址與 AI 提煉</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">貼上網址並記錄你的想法，AI 將為你快速萃取重點與自動分類</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          
          {/* Preset Buttons for Quick Exploration */}
          {!analysisResult && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>快速體驗試用：點擊帶入範例網址</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-300 hover:border-indigo-500/40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-all font-medium"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              網站 / GitHub 網址 <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                placeholder="https://github.com/... 或 https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500 font-mono text-slate-100"
              />
            </div>
          </div>

          {/* User Note Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                個人筆記 / 為什麼吸引你？
              </label>
              <span className="text-[11px] text-slate-400">選填，提供 AI 提煉時的個人脈絡</span>
            </div>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="例如：看到這個開源專案支援即時協作，想在下一季度的內部後台系統試試看；素材庫的 3D 圖標品質很高，適合 Pitch Deck..."
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                className="w-full p-3 text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500 text-slate-100 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              歸屬分類
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('auto')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  selectedCategory === 'auto'
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI 自動判斷推薦</span>
              </button>
              {categories.filter((c) => !c.isSystem).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-xs'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl p-3">
              {errorMsg}
            </div>
          )}

          {/* AI Analysis Progress / State */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-indigo-300">
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-indigo-400" />
              <div>
                <div className="text-xs font-bold">AI 智慧分析引擎運作中</div>
                <div className="text-xs text-indigo-400">{analysisStep}</div>
              </div>
            </div>
          )}

          {/* AI Analysis Result Preview Card */}
          {analysisResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AI 提煉完成預覽</span>
                </div>
                {analysisResult.githubStats?.stars && (
                  <span className="text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    ★ {analysisResult.githubStats.stars.toLocaleString()} Stars
                  </span>
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-slate-100">{analysisResult.title}</div>
                <p className="text-xs text-slate-400 mt-1">{analysisResult.aiSummary?.oneLiner}</p>
              </div>

              {analysisResult.aiSummary?.highlights && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase text-slate-400">核心亮點</div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {analysisResult.aiSummary.highlights.slice(0, 3).map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags generated */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(analysisResult.tags || []).map((t) => (
                  <span key={t} className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-950/80 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-2">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 sm:border-transparent"
          >
            取消
          </button>

          <div className="flex items-center gap-2">
            {!analysisResult ? (
              <button
                type="button"
                disabled={isAnalyzing || !url.trim()}
                onClick={handleStartAnalysis}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI 快速提煉重點</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-center border border-slate-800 sm:border-transparent"
                >
                  重新分析
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>確認存入</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
