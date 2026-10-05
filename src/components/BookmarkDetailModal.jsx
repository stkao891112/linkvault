import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Star,
  Sparkles,
  GitFork,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  Save,
  RotateCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeUrlWithAI } from '../services/aiService';
import { getDomainTheme } from '../utils/domainTheme';

export default function BookmarkDetailModal({
  bookmark,
  isOpen,
  onClose,
  categories,
  onUpdateBookmark,
  onDeleteBookmark,
  customApiKey,
  apiProvider,
  customBaseUrl = '',
  customModel = '',
  onNavigateNext,
  onNavigatePrev,
  hasNext = false,
  hasPrev = false,
  currentIndex = 0,
  totalCount = 0,
}) {
  const [userNote, setUserNote] = useState(bookmark?.userNote || '');
  const [selectedCatId, setSelectedCatId] = useState(bookmark?.categoryId || 'cat-tools');
  const [tags, setTags] = useState(bookmark?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setUserNote(bookmark.userNote || '');
      setSelectedCatId(bookmark.categoryId || 'cat-tools');
      setTags(bookmark.tags || []);
    }
  }, [bookmark]);

  const currentCategory = categories.find((c) => c.id === selectedCatId);
  const theme = bookmark ? getDomainTheme(bookmark.domain, bookmark.categoryId) : null;

  const handleSaveNotesAndMeta = () => {
    const updated = {
      ...bookmark,
      userNote,
      categoryId: selectedCatId,
      tags,
    };
    onUpdateBookmark(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleAddTag = () => {
    const val = newTagInput.trim().replace(/^#/, '');
    if (val && !tags.includes(val)) {
      const newTags = [...tags, val];
      setTags(newTags);
      setNewTagInput('');
      onUpdateBookmark({ ...bookmark, tags: newTags });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    onUpdateBookmark({ ...bookmark, tags: newTags });
  };

  const handleCopyMarkdown = () => {
    const md = `### [${bookmark.title}](${bookmark.url})\n\n**網域**: \`${bookmark.domain}\` | **分類**: ${currentCategory?.name || '未分類'}\n\n**個人筆記**: ${userNote || '無'}\n\n**AI 提煉重點**:\n${bookmark.aiSummary?.oneLiner ? `> ${bookmark.aiSummary.oneLiner}\n\n` : ''}${
      (bookmark.aiSummary?.highlights || []).map((h) => `- ${h}`).join('\n')
    }\n\n**適用場景**:\n${(bookmark.aiSummary?.useCases || []).map((u) => `- ${u}`).join('\n')}\n\n**標籤**: ${tags.map((t) => `#${t}`).join(' ')}`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReanalyze = async () => {
    try {
      setIsReanalyzing(true);
      const res = await analyzeUrlWithAI({
        url: bookmark.url,
        userNote,
        customApiKey,
        apiProvider,
        customBaseUrl,
        customModel,
      });

      const updated = {
        ...bookmark,
        title: res.title || bookmark.title,
        aiSummary: res.aiSummary,
        tags: Array.from(new Set([...tags, ...(res.tags || [])])),
        githubStats: res.githubStats || bookmark.githubStats,
      };
      onUpdateBookmark(updated);
    } catch (e) {
      console.error('Reanalysis failed:', e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleToggleFav = () => {
    onUpdateBookmark({ ...bookmark, isFavorite: !bookmark.isFavorite });
  };

  const handleToggleStatus = () => {
    const nextStatus = bookmark.status === 'read' ? 'unread' : 'read';
    onUpdateBookmark({ ...bookmark, status: nextStatus });
  };

  return (
    <AnimatePresence>
      {isOpen && bookmark && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* 1. Backdrop (Semi-transparent, preserves stage background visibility) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
          />

          {/* 2. Slide-over Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="pointer-events-auto w-screen max-w-2xl bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-slate-100"
            >
              {/* Header: Title, Navigation, Actions */}
              <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
                {/* Left: Domain + Pagination Indicator */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 border border-slate-800">
                    <img
                      src={bookmark.favicon}
                      alt=""
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border truncate ${theme?.badgeClass || 'text-slate-300'}`}>
                        {bookmark.domain}
                      </span>
                      {totalCount > 0 && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {currentIndex + 1} / {totalCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: J/K Arrow Navigation, Star, Status, Close */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Prev/Next Keyboard Navigation Arrows */}
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 mr-1">
                    <button
                      onClick={onNavigatePrev}
                      disabled={!hasPrev}
                      title="上一篇 (快捷鍵: K)"
                      className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-slate-500 px-1 font-mono select-none">K / J</span>
                    <button
                      onClick={onNavigateNext}
                      disabled={!hasNext}
                      title="下一篇 (快捷鍵: J)"
                      className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Favorite button with F shortcut hint */}
                  <button
                    onClick={handleToggleFav}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      bookmark.isFavorite
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={bookmark.isFavorite ? '已加最愛 (快捷鍵: F)' : '加入最愛 (快捷鍵: F)'}
                  >
                    <Star className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  {/* Status Toggle */}
                  <button
                    onClick={handleToggleStatus}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      bookmark.status === 'read'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                        : 'bg-violet-950/40 border-violet-500/30 text-violet-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{bookmark.status === 'read' ? '已掌握' : '待研讀'}</span>
                  </button>

                  {/* Close button with Esc hint */}
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                    title="關閉抽屜 (快捷鍵: Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Title & External Link */}
          <div>
            <h1 className="text-xl font-bold text-slate-100 leading-snug">
              {bookmark.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-md transition-colors"
              >
                <span>打開原始網頁</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {bookmark.githubStats && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {bookmark.githubStats.stars.toLocaleString()} Stars
                  </span>
                  {bookmark.githubStats.language && (
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-700/60">
                      {bookmark.githubStats.language}
                    </span>
                  )}
                  {bookmark.githubStats?.forks != null && (
                    <span className="flex items-center gap-1 text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-700/60">
                      <GitFork className="w-3 h-3" />
                      {bookmark.githubStats.forks.toLocaleString()} forks
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Notes (Editable) */}
          <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>個人筆記與心得備註</span>
              </label>
              {isSavedRecently && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 已更新儲存
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="記錄你對這個專案的具體想法、適用專案、核心優勢..."
              className="w-full text-sm bg-slate-950 border border-amber-700/50 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none leading-relaxed transition-all"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotesAndMeta}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>儲存筆記修改</span>
              </button>
            </div>
          </div>

          {/* AI Comprehensive Insights */}
          <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI 核心情報提煉</span>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-800 transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                <span>{isReanalyzing ? '重新分析中...' : '重新提煉'}</span>
              </button>
            </div>

            {/* One-Liner */}
            {bookmark.aiSummary?.oneLiner && (
              <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  一句話定位
                </div>
                <div className="text-sm font-medium text-slate-200 leading-relaxed">
                  {bookmark.aiSummary.oneLiner}
                </div>
              </div>
            )}

            {/* Highlights */}
            {bookmark.aiSummary?.highlights && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  核心亮點與特色
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {bookmark.aiSummary.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                      <span className="text-indigo-400 font-bold mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Use cases */}
            {bookmark.aiSummary?.useCases && bookmark.aiSummary.useCases.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  推薦應用情境
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {bookmark.aiSummary.useCases.map((u, i) => (
                    <div key={i} className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-300 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Categorization & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category selection */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                歸屬分類
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value);
                  onUpdateBookmark({ ...bookmark, categoryId: e.target.value });
                }}
                className="w-full text-xs font-medium p-2.5 bg-slate-950 border border-slate-700/80 rounded-lg outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
              >
                {categories.filter((c) => !c.isSystem).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Management */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                標籤管理
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="新增標籤..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 text-xs p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                >
                  新增
                </button>
              </div>
            </div>

          </div>

        </div>

              {/* Bottom Keyboard Navigation Hints & Action Toolbar */}
              <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {/* Keyboard Navigation Shortcuts Bar */}
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 text-[10px]">J</kbd> 下一篇
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 text-[10px]">K</kbd> 上一篇
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 text-[10px]">F</kbd> 標記最愛
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 text-[10px]">Esc</kbd> 關閉
                  </span>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
                  <button
                    onClick={() => {
                      if (confirm('確定要刪除這筆收藏嗎？')) {
                        onDeleteBookmark(bookmark.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>刪除此情報</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>複製 Markdown</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                    >
                      完成關閉
                    </button>
                  </div>
                </div>
              </div>

            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
