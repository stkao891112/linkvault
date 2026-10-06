import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Link2,
  Loader2,
  CheckCircle2,
  Lightbulb,
  Tag,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
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
  const [modalNewTag, setModalNewTag] = useState('');

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

      const normalizedResult = {
        ...result,
        title: result.title || url.trim(),
        tags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : (result.aiSummary?.suggestedTags || ['常用收藏']),
        aiSummary: {
          oneLiner: result.aiSummary?.oneLiner || '',
          highlights: Array.isArray(result.aiSummary?.highlights) ? result.aiSummary.highlights : ['手動收錄之網站資源'],
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
      setErrorMsg('分析時發生問題，請檢查網址或重試');
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
    const val = modalNewTag.trim().replace(/^#/, '');
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
    setModalNewTag('');
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
      highlights: cleanHighlights.length > 0 ? cleanHighlights : ['手動收錄之網站資源'],
      useCases: cleanUseCases.length > 0 ? cleanUseCases : ['日常開發與設計參考'],
      suggestedCategory: finalCatId,
      suggestedTags: analysisResult.tags?.length ? analysisResult.tags : ['常用收藏'],
    } : {
      oneLiner: userNote.trim() || '使用者手動收錄網址',
      highlights: ['手動收錄之網站資源'],
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
      tags: analysisResult?.tags?.length ? analysisResult.tags : ['自訂收藏'],
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
    setModalNewTag('');
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

          {/* AI Analysis Result Preview Card with In-place Editing */}
          {analysisResult && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    AI 提煉完成
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      ✏️ 支援即時編輯微調
                    </span>
                  </span>
                </div>
                {analysisResult.githubStats?.stars && (
                  <span className="text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                    ★ {analysisResult.githubStats.stars.toLocaleString()} Stars
                  </span>
                )}
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
                  className="w-full text-xs font-bold bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-all placeholder:text-slate-500"
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
                  className="w-full text-xs bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-500"
                />
              </div>

              {/* Highlights Editable List */}
              <div className="space-y-1.5">
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
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30 transition-colors"
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
                        className="flex-1 text-xs bg-slate-900 border border-slate-700/70 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(i)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0"
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
              <div className="space-y-1.5">
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
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30 transition-colors"
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
                        placeholder={`適用場景 ${i + 1}`}
                        className="flex-1 text-xs bg-slate-900 border border-slate-700/70 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveUseCase(i)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0"
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
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span>標籤管理 (Tags)</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(analysisResult.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md"
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
                      value={modalNewTag}
                      onChange={(e) => setModalNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="text-[11px] bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-md px-2 py-0.5 text-slate-200 outline-none w-24"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-md transition-colors border border-slate-700"
                    >
                      新增
                    </button>
                  </div>
                </div>
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
