import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Link2,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Camera,
  Plus,
  Trash2,
  X,
  RotateCw,
  Edit3,
  Tag
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
  onTriggerVision,
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
  const [heroNewTag, setHeroNewTag] = useState('');
  const fileInputRef = useRef(null);

  const handleApplyPreset = (preset) => {
    setUrl(preset.url);
    setUserNote(preset.note);
    setShowOptions(true);
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && onTriggerVision) {
        onTriggerVision(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInputPaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result;
              if (dataUrl && onTriggerVision) {
                onTriggerVision(dataUrl);
              }
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    }
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

      const normalizedResult = {
        ...result,
        title: result.title || url.trim(),
        tags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : (result.aiSummary?.suggestedTags || ['常用收藏']),
        aiSummary: {
          oneLiner: result.aiSummary?.oneLiner || '',
          highlights: Array.isArray(result.aiSummary?.highlights) ? result.aiSummary.highlights : ['手動收錄之優質資源'],
          useCases: Array.isArray(result.aiSummary?.useCases) ? result.aiSummary.useCases : ['日常開發與設計參考'],
          suggestedCategory: result.categoryId || result.aiSummary?.suggestedCategory || 'cat-tools',
          suggestedTags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : (result.aiSummary?.suggestedTags || ['常用收藏']),
        },
      };

      setAnalysisResult(normalizedResult);
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

  const handleUpdateTitle = (val) => {
    setAnalysisResult((prev) => (prev ? { ...prev, title: val } : null));
  };

  const handleUpdateOneLiner = (val) => {
    setAnalysisResult((prev) =>
      prev
        ? {
            ...prev,
            aiSummary: {
              ...(prev.aiSummary || {}),
              oneLiner: val,
            },
          }
        : null
    );
  };

  const handleUpdateHighlight = (index, val) => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextH = [...(prev.aiSummary?.highlights || [])];
      nextH[index] = val;
      return {
        ...prev,
        aiSummary: {
          ...(prev.aiSummary || {}),
          highlights: nextH,
        },
      };
    });
  };

  const handleRemoveHighlight = (index) => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextH = (prev.aiSummary?.highlights || []).filter((_, i) => i !== index);
      return {
        ...prev,
        aiSummary: {
          ...(prev.aiSummary || {}),
          highlights: nextH,
        },
      };
    });
  };

  const handleAddHighlight = () => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextH = [...(prev.aiSummary?.highlights || []), ''];
      return {
        ...prev,
        aiSummary: {
          ...(prev.aiSummary || {}),
          highlights: nextH,
        },
      };
    });
  };

  const handleUpdateUseCase = (index, val) => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextU = [...(prev.aiSummary?.useCases || [])];
      nextU[index] = val;
      return {
        ...prev,
        aiSummary: {
          ...(prev.aiSummary || {}),
          useCases: nextU,
        },
      };
    });
  };

  const handleRemoveUseCase = (index) => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextU = (prev.aiSummary?.useCases || []).filter((_, i) => i !== index);
      return {
        ...prev,
        aiSummary: {
          ...(prev.aiSummary || {}),
          useCases: nextU,
        },
      };
    });
  };

  const handleAddUseCase = () => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextU = [...(prev.aiSummary?.useCases || []), ''];
      return {
        ...prev,
        aiSummary: {
          ...(prev.aiSummary || {}),
          useCases: nextU,
        },
      };
    });
  };

  const handleRemoveTag = (tagToRemove) => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const nextTags = (prev.tags || []).filter((t) => t !== tagToRemove);
      return {
        ...prev,
        tags: nextTags,
        aiSummary: {
          ...(prev.aiSummary || {}),
          suggestedTags: nextTags,
        },
      };
    });
  };

  const handleAddTag = () => {
    const val = heroNewTag.trim().replace(/^#/, '');
    if (!val) return;
    setAnalysisResult((prev) => {
      if (!prev) return null;
      const currentTags = prev.tags || [];
      if (currentTags.includes(val)) return prev;
      const nextTags = [...currentTags, val];
      return {
        ...prev,
        tags: nextTags,
        aiSummary: {
          ...(prev.aiSummary || {}),
          suggestedTags: nextTags,
        },
      };
    });
    setHeroNewTag('');
  };

  const handleConfirmSave = () => {
    if (!url.trim()) return;

    const finalCatId = selectedCategory === 'auto'
      ? (analysisResult?.categoryId || 'cat-tools')
      : selectedCategory;

    const cleanHighlights = (analysisResult?.aiSummary?.highlights || [])
      .map((h) => h.trim())
      .filter(Boolean);
    const cleanUseCases = (analysisResult?.aiSummary?.useCases || [])
      .map((u) => u.trim())
      .filter(Boolean);

    const finalAiSummary = analysisResult?.aiSummary ? {
      ...analysisResult.aiSummary,
      oneLiner: analysisResult.aiSummary.oneLiner?.trim() || userNote.trim() || '使用者手動收錄網址',
      highlights: cleanHighlights.length > 0 ? cleanHighlights : ['手動收錄之優質資源'],
      useCases: cleanUseCases.length > 0 ? cleanUseCases : ['日常開發與設計參考'],
      suggestedCategory: finalCatId,
      suggestedTags: analysisResult.tags?.length ? analysisResult.tags : ['常用收藏'],
    } : {
      oneLiner: userNote.trim() || '使用者手動收錄網址',
      highlights: ['手動收錄之優質資源'],
      useCases: ['日常開發與設計參考'],
      suggestedCategory: finalCatId,
      suggestedTags: ['常用收藏'],
    };

    const newBookmark = {
      id: `bm-${Date.now()}`,
      url: url.trim(),
      title: analysisResult?.title?.trim() || url.trim(),
      domain: analysisResult?.domain || new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
      favicon: analysisResult?.favicon || `https://www.google.com/s2/favicons?domain=web&sz=64`,
      categoryId: finalCatId,
      userNote: userNote.trim(),
      aiSummary: finalAiSummary,
      tags: analysisResult?.tags?.length ? analysisResult.tags : ['常用收藏'],
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
    setHeroNewTag('');
  };

  return (
    <section className="relative rounded-2xl sm:rounded-3xl border border-slate-700/80 bg-slate-900/70 backdrop-blur-2xl p-4 sm:p-8 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] overflow-hidden mb-6 sm:mb-8">
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-gradient-to-tl from-cyan-500/20 via-blue-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] text-xs font-semibold text-indigo-300 backdrop-blur-xl animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300">
            ✨ v2.0 Silicon Valley Edition
          </span>
          <span className="w-1 h-1 rounded-full bg-indigo-400" />
          <span className="text-slate-400 font-medium">AI 智慧精摘引擎</span>
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(99,102,241,0.25)] leading-tight">
          看到好網站？貼上網址，AI 自動提煉
        </h2>
        <p className="text-xs sm:text-base text-slate-300/80 max-w-xl mx-auto leading-relaxed">
          告別雜亂無章的書籤欄。輸入 GitHub 專案或素材網站，即刻萃取核心價值、亮點與分類標籤。
        </p>
      </div>

      {/* Main Hero Input Box */}
      <form onSubmit={handleStartAnalysis} className="relative z-10 max-w-3xl mx-auto space-y-3">
        {/* Outer Glow & Border Beam Container */}
        <div className={`relative p-[1.5px] rounded-2xl transition-all duration-300 ${
          isAnalyzing ? 'shadow-2xl shadow-indigo-500/30' : ''
        }`}>
          {/* Neon Border Beam & Pulse Shimmer when isAnalyzing */}
          {isAnalyzing && (
            <>
              {/* Rotating Conic Border Beam */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div
                  className="absolute -inset-[150%] animate-border-beam"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0 310deg, #6366f1 330deg, #ec4899 348deg, #38bdf8 360deg)',
                  }}
                />
              </div>

              {/* Ambient Outer Glow Pulse */}
              <div
                className="absolute -inset-1 rounded-2xl blur-md opacity-75 animate-beam-pulse pointer-events-none"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0 310deg, #6366f1 330deg, #ec4899 348deg, #38bdf8 360deg)',
                }}
              />
            </>
          )}

          {/* Actual Input Row Container */}
          <div className={`relative z-10 flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-slate-950/90 border transition-all duration-300 shadow-xl ${
            isAnalyzing
              ? 'border-indigo-500/80 ring-2 ring-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.4)]'
              : 'border-slate-700/80 hover:border-slate-600 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.3)]'
          }`}>
            {/* Shimmer sweep scanner bar during analysis */}
            {isAnalyzing && (
              <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl pointer-events-none">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-shimmer-sweep" />
              </div>
            )}

            <div className="flex-1 flex items-center pl-3.5 pr-2 gap-3 min-h-[48px]">
              <Link2 className={`w-5 h-5 shrink-0 transition-colors ${isAnalyzing ? 'text-cyan-400 animate-pulse' : 'text-indigo-400'}`} />
              <input
                type="url"
                placeholder="貼上網址 (例：https://... 或直接 Ctrl+V 貼上截圖)"
                value={url}
                disabled={isAnalyzing}
                onPaste={handleInputPaste}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 px-1 pb-1 sm:p-0">
              {/* Hidden File Input for Screenshot */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl text-xs font-medium border bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border-cyan-500/30 hover:border-cyan-500/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="上傳截圖進行多網站視覺智能辨識"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">📸 截圖辨識</span>
                <span className="sm:hidden">截圖</span>
              </button>

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
                <span className="hidden sm:inline">筆記備註</span>
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
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                      <span className="text-cyan-100">提煉中...</span>
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
            <span className="text-[11px] text-cyan-300/80 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span>📸 支援 Ctrl+V / Cmd+V 貼圖辨識</span>
            </span>
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

        {/* Live Result Preview Banner with In-place Editing */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 sm:p-6 rounded-2xl bg-slate-950/95 border border-indigo-500/40 text-left space-y-4 shadow-2xl backdrop-blur-xl"
            >
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                      AI 已完成重點提煉
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        ✏️ 支援即時編輯微調
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-400">點擊下方各欄位可直接修改，確認無誤後收錄</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors border border-slate-800"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>重新分析</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>確認存入知識庫</span>
                  </button>
                </div>
              </div>

              {/* Title Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3 text-indigo-400" />
                  <span>網站標題 (Title)</span>
                </label>
                <input
                  type="text"
                  value={analysisResult.title || ''}
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  placeholder="網站標題"
                  className="w-full text-sm font-bold bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {/* OneLiner Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>AI 一句話核心定位 (One-Liner)</span>
                </label>
                <textarea
                  rows={2}
                  value={analysisResult.aiSummary?.oneLiner || ''}
                  onChange={(e) => handleUpdateOneLiner(e.target.value)}
                  placeholder="一句話精準定位該工具或專案的核心價值..."
                  className="w-full text-xs bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-slate-200 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-500"
                />
              </div>

              {/* Highlights Editable List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>核心亮點清單 (Highlights)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({(analysisResult.aiSummary?.highlights || []).length} 條)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-500/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新增亮點</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(analysisResult.aiSummary?.highlights || []).map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-indigo-400 font-bold shrink-0 w-4 text-right">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleUpdateHighlight(i, e.target.value)}
                        placeholder={`亮點 ${i + 1}`}
                        className="flex-1 text-xs bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-slate-200 outline-none transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(i)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                        title="刪除此條亮點"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!analysisResult.aiSummary?.highlights || analysisResult.aiSummary.highlights.length === 0) && (
                    <div className="text-xs text-slate-500 italic py-1">目前尚無亮點，點擊上方「新增亮點」添加</div>
                  )}
                </div>
              </div>

              {/* UseCases Editable List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>適用場景 (Use Cases)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({(analysisResult.aiSummary?.useCases || []).length} 條)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddUseCase}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 px-2.5 py-1 rounded-md border border-cyan-500/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新增場景</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(analysisResult.aiSummary?.useCases || []).map((u, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0 w-4 text-right">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={u}
                        onChange={(e) => handleUpdateUseCase(i, e.target.value)}
                        placeholder={`適用情境 ${i + 1}`}
                        className="flex-1 text-xs bg-slate-900/90 border border-slate-700/70 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-slate-200 outline-none transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveUseCase(i)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                        title="刪除此場景"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!analysisResult.aiSummary?.useCases || analysisResult.aiSummary.useCases.length === 0) && (
                    <div className="text-xs text-slate-500 italic py-1">目前尚無適用場景，點擊上方「新增場景」添加</div>
                  )}
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span>標籤管理 (Tags)</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(analysisResult.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-lg"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                        title="刪除標籤"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="新增標籤..."
                      value={heroNewTag}
                      onChange={(e) => setHeroNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="text-[11px] bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-slate-200 outline-none w-24 sm:w-28"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition-colors border border-slate-700"
                    >
                      新增
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  💡 以上微調內容將於點擊「確認存入知識庫」時完整同步儲存
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 text-center"
                  >
                    重新分析
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>確認存入知識庫</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </form>
    </section>
  );
}
