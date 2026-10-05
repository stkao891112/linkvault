import React, { useState } from 'react';
import {
  Sparkles,
  Link2,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Folder,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeUrlWithAI } from '../services/aiService';

const SAMPLE_PRESETS = [
  { label: 'Tailwind CSS', url: 'https://github.com/tailwindlabs/tailwindcss', note: '現代前端主流 Utility-first CSS 框架，v4 全面 Rust 化重寫' },
  { label: 'Unsplash 免費圖庫', url: 'https://unsplash.com', note: '高解析度無版權商業攝影圖庫，找首頁 Hero 背景圖首選' },
  { label: 'v0 by Vercel', url: 'https://v0.dev', note: '生成式 UI 工具，輸入自然語言快速產出 React + Tailwind 程式碼' },
  { label: 'Lucide Icons', url: 'https://lucide.dev', note: '開源向量圖標庫，超過 1500+ SVG 圖標，React 深度支援' },
];

export default function QuickAddHero({
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
  const [showOptions, setShowOptions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleApplyPreset = (preset) => {
    setUrl(preset.url);
    setUserNote(preset.note);
    setShowOptions(true);
    setErrorMsg('');
  };

  const handleStartAnalysis = async (e) => {
    e?.preventDefault();
    if (!url.trim()) {
      setErrorMsg('請先輸入或貼上網址');
      return;
    }

    try {
      setErrorMsg('');
      setIsAnalyzing(true);
      setAnalysisStep('解析網域與獲取網頁資訊...');

      await new Promise((r) => setTimeout(r, 350));
      setAnalysisStep('調用 AI 知識引擎提煉核心亮點...');

      const result = await analyzeUrlWithAI({
        url: url.trim(),
        userNote: userNote.trim(),
        customApiKey,
        apiProvider,
        customBaseUrl,
        customModel,
      });

      await new Promise((r) => setTimeout(r, 350));
      setAnalysisStep('生成分類建議與標籤...');

      setAnalysisResult(result);
      if (selectedCategory === 'auto' && result.categoryId) {
        setSelectedCategory(result.categoryId);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('分析時發生問題，請確認網址後重試');
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
        highlights: ['手動收錄之優質資源'],
        useCases: ['日常開發與設計參考'],
        suggestedCategory: finalCatId,
        suggestedTags: ['常用收藏'],
      },
      tags: analysisResult?.tags || ['常用收藏'],
      isFavorite: false,
      status: 'unread',
      createdAt: new Date().toISOString(),
      githubStats: analysisResult?.githubStats,
    };

    onSaveBookmark(newBookmark);
    handleReset();
  };

  const handleReset = () => {
    setUrl('');
    setUserNote('');
    setSelectedCategory('auto');
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setShowOptions(false);
    setErrorMsg('');
  };

  return (
    <section className="relative rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-8 shadow-2xl shadow-black/40 overflow-hidden mb-6 sm:mb-8">
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] sm:text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI 智慧精摘與靈感萃取</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-tight">
          看到好網站？貼上網址，AI 自動提煉
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          告別雜亂無章的書籤欄。輸入 GitHub 專案或素材網站，即刻萃取核心價值、亮點與分類標籤。
        </p>
      </div>

      {/* Main Hero Input Box */}
      <form onSubmit={handleStartAnalysis} className="relative z-10 max-w-3xl mx-auto space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-slate-950/90 border border-slate-700/80 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-xl">
          <div className="flex-1 flex items-center pl-3.5 pr-2 gap-3 min-h-[48px]">
            <Link2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              type="url"
              placeholder="貼上網址 (例：https://github.com/... 或 https://...)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrorMsg('');
              }}
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 px-1 pb-1 sm:p-0">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                showOptions || userNote
                  ? 'bg-slate-800 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>筆記備註</span>
              {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!analysisResult ? (
              <button
                type="submit"
                disabled={isAnalyzing || !url.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>提煉中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI 提煉重點</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>存入知識庫</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick presets chip row */}
        {!analysisResult && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>點擊速試：</span>
            </span>
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-xs text-slate-400 hover:text-indigo-300 bg-slate-950/60 hover:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-center">
            {errorMsg}
          </div>
        )}

        {/* Collapsible Note & Category Box */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3 overflow-hidden text-left"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  個人隨手筆記 / 吸引你的原因（選填）
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：這個開源專案支援即時協作，想在下一季度的內部系統試試看..."
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  指定分類
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('auto')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      selectedCategory === 'auto'
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    AI 自動推薦
                  </button>
                  {categories.filter((c) => !c.isSystem).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Analysis Feedback Box */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center gap-3 text-indigo-300 text-xs font-medium"
            >
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>{analysisStep}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Result Preview Banner */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/40 text-left space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AI 已完成重點提煉！</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    重新分析
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    確認存入知識庫
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100">{analysisResult.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{analysisResult.aiSummary?.oneLiner}</p>
              </div>

              {analysisResult.aiSummary?.highlights && (
                <ul className="text-xs text-slate-400 space-y-1">
                  {analysisResult.aiSummary.highlights.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span className="text-slate-300">{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </form>
    </section>
  );
}
