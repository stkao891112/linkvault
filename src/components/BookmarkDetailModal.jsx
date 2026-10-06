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
  ChevronRight,
  Edit3,
  Eye,
  Plus
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bookmark?.title || '');
  const [editUrl, setEditUrl] = useState(bookmark?.url || '');
  const [editUserNote, setEditUserNote] = useState(bookmark?.userNote || '');
  const [editOneLiner, setEditOneLiner] = useState(bookmark?.aiSummary?.oneLiner || '');
  const [editHighlights, setEditHighlights] = useState(bookmark?.aiSummary?.highlights || []);
  const [editUseCases, setEditUseCases] = useState(bookmark?.aiSummary?.useCases || []);
  const [editCategoryId, setEditCategoryId] = useState(bookmark?.categoryId || 'cat-tools');
  const [editTags, setEditTags] = useState(bookmark?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const resetEditState = (bm) => {
    if (!bm) return;
    setEditTitle(bm.title || '');
    setEditUrl(bm.url || '');
    setEditUserNote(bm.userNote || '');
    setEditOneLiner(bm.aiSummary?.oneLiner || '');
    setEditHighlights(Array.isArray(bm.aiSummary?.highlights) ? [...bm.aiSummary.highlights] : []);
    setEditUseCases(Array.isArray(bm.aiSummary?.useCases) ? [...bm.aiSummary.useCases] : []);
    setEditCategoryId(bm.categoryId || 'cat-tools');
    setEditTags(Array.isArray(bm.tags) ? [...bm.tags] : []);
    setNewTagInput('');
  };

  useEffect(() => {
    if (bookmark) {
      resetEditState(bookmark);
      setIsEditing(false);
    }
  }, [bookmark?.id]);

  const currentCategory = categories.find((c) => c.id === (isEditing ? editCategoryId : (bookmark?.categoryId || 'cat-tools')));
  const theme = bookmark ? getDomainTheme(bookmark.domain, bookmark.categoryId) : null;

  const handleSaveAllChanges = () => {
    if (!bookmark) return;

    let domain = bookmark.domain;
    let favicon = bookmark.favicon;
    const cleanUrl = editUrl.trim();
    if (cleanUrl) {
      try {
        const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
        domain = parsed.hostname.replace(/^www\./, '');
        if (domain !== bookmark.domain) {
          favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        }
      } catch {
        // Keep existing domain
      }
    }

    const cleanHighlights = editHighlights.map((h) => h.trim()).filter(Boolean);
    const cleanUseCases = editUseCases.map((u) => u.trim()).filter(Boolean);

    const updated = {
      ...bookmark,
      title: editTitle.trim() || bookmark.title,
      url: cleanUrl || bookmark.url,
      domain,
      favicon,
      categoryId: editCategoryId,
      userNote: editUserNote.trim(),
      aiSummary: {
        ...(bookmark.aiSummary || {}),
        oneLiner: editOneLiner.trim(),
        highlights: cleanHighlights,
        useCases: cleanUseCases,
        suggestedCategory: editCategoryId,
        suggestedTags: editTags,
      },
      tags: editTags,
    };

    onUpdateBookmark(updated);
    setIsEditing(false);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleCancelEdit = () => {
    resetEditState(bookmark);
    setIsEditing(false);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      handleCancelEdit();
    } else {
      resetEditState(bookmark);
      setIsEditing(true);
    }
  };

  const handleUpdateHighlight = (index, val) => {
    const next = [...editHighlights];
    next[index] = val;
    setEditHighlights(next);
  };

  const handleRemoveHighlight = (index) => {
    setEditHighlights(editHighlights.filter((_, i) => i !== index));
  };

  const handleAddHighlight = () => {
    setEditHighlights([...editHighlights, '']);
  };

  const handleUpdateUseCase = (index, val) => {
    const next = [...editUseCases];
    next[index] = val;
    setEditUseCases(next);
  };

  const handleRemoveUseCase = (index) => {
    setEditUseCases(editUseCases.filter((_, i) => i !== index));
  };

  const handleAddUseCase = () => {
    setEditUseCases([...editUseCases, '']);
  };

  const handleAddTag = () => {
    const val = newTagInput.trim().replace(/^#/, '');
    if (val && !editTags.includes(val)) {
      const newTags = [...editTags, val];
      setEditTags(newTags);
      setNewTagInput('');
      if (!isEditing) {
        onUpdateBookmark({ ...bookmark, tags: newTags });
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = editTags.filter((t) => t !== tagToRemove);
    setEditTags(newTags);
    if (!isEditing) {
      onUpdateBookmark({ ...bookmark, tags: newTags });
    }
  };

  const handleCopyMarkdown = () => {
    const activeTitle = isEditing ? editTitle : bookmark.title;
    const activeUrl = isEditing ? editUrl : bookmark.url;
    const activeDomain = bookmark.domain;
    const activeNote = isEditing ? editUserNote : (bookmark.userNote || '');
    const activeOneLiner = isEditing ? editOneLiner : bookmark.aiSummary?.oneLiner;
    const activeHighlights = isEditing ? editHighlights : (bookmark.aiSummary?.highlights || []);
    const activeUseCases = isEditing ? editUseCases : (bookmark.aiSummary?.useCases || []);
    const activeTags = isEditing ? editTags : (bookmark.tags || []);

    const lines = [
      `### [${activeTitle}](${activeUrl})`,
      '',
      `**網域**: \`${activeDomain}\` | **分類**: ${currentCategory?.name || '未分類'}`,
      '',
      `**個人筆記**: ${activeNote || '無'}`,
      '',
      '**AI 提煉重點**:',
      ...(activeOneLiner ? [`> ${activeOneLiner}`, ''] : []),
      ...activeHighlights.map((h) => `- ${h}`),
      '',
      '**適用場景**:',
      ...activeUseCases.map((u) => `- ${u}`),
      '',
      `**標籤**: ${activeTags.map((t) => `#${t}`).join(' ')}`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReanalyze = async () => {
    try {
      setIsReanalyzing(true);
      const targetUrl = isEditing ? editUrl : bookmark.url;
      const targetNote = isEditing ? editUserNote : (bookmark.userNote || '');

      const res = await analyzeUrlWithAI({
        url: targetUrl,
        userNote: targetNote,
        customApiKey,
        apiProvider,
        customBaseUrl,
        customModel,
      });

      const newHighlights = Array.isArray(res.aiSummary?.highlights) ? res.aiSummary.highlights : [];
      const newUseCases = Array.isArray(res.aiSummary?.useCases) ? res.aiSummary.useCases : [];
      const mergedTags = Array.from(new Set([...(isEditing ? editTags : bookmark.tags || []), ...(res.tags || [])]));

      const updated = {
        ...bookmark,
        url: targetUrl,
        title: res.title || (isEditing ? editTitle : bookmark.title),
        categoryId: res.categoryId || (isEditing ? editCategoryId : bookmark.categoryId),
        aiSummary: {
          ...bookmark.aiSummary,
          ...res.aiSummary,
          highlights: newHighlights,
          useCases: newUseCases,
        },
        tags: mergedTags,
        githubStats: res.githubStats || bookmark.githubStats,
      };

      onUpdateBookmark(updated);

      setEditTitle(updated.title);
      setEditUrl(updated.url);
      setEditCategoryId(updated.categoryId);
      setEditOneLiner(res.aiSummary?.oneLiner || '');
      setEditHighlights(newHighlights);
      setEditUseCases(newUseCases);
      setEditTags(mergedTags);

      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2000);
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
          {/* 1. Backdrop */}
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
              <div className="px-5 py-3.5 sm:py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
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

                {/* Right: Actions, Edit Toggle, Navigation, Close */}
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

                  {/* Favorite button */}
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
                    <span className="hidden xs:inline">{bookmark.status === 'read' ? '已掌握' : '待研讀'}</span>
                  </button>

                  {/* Edit Mode Toggle Button */}
                  <button
                    onClick={handleToggleEdit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      isEditing
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-indigo-200'
                    }`}
                    title={isEditing ? '返回唯讀檢視' : '切換至編輯模式'}
                  >
                    {isEditing ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-amber-300" />
                        <span>唯讀檢視</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>✏️ 編輯內容</span>
                      </>
                    )}
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
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* Edit Mode Notice Banner */}
                {isEditing && (
                  <div className="bg-indigo-950/50 border border-indigo-500/40 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs text-indigo-200 shadow-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <Edit3 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-medium truncate">
                        編輯模式：可修改標題、網址、心得與 AI 提煉內容
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        放棄
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllChanges}
                        className="text-xs font-semibold px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        儲存變更
                      </button>
                    </div>
                  </div>
                )}

                {/* Recently Saved Toast Indicator */}
                {isSavedRecently && (
                  <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>情報與筆記已成功同步更新！</span>
                  </div>
                )}

                {/* 1. Title & URL Section */}
                {isEditing ? (
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        網站標題 (Title) *
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="請輸入網站標題..."
                        className="w-full text-base font-bold bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none transition-all placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        網站網址 (URL) *
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs font-mono bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-slate-200 outline-none transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl font-bold text-slate-100 leading-snug">
                      {bookmark.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
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
                )}

                {/* 2. User Notes Section */}
                <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>個人筆記與心得備註</span>
                    </label>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>快速編輯筆記</span>
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editUserNote}
                      onChange={(e) => setEditUserNote(e.target.value)}
                      placeholder="記錄你對這個專案的具體想法、適用專案、核心優勢..."
                      className="w-full text-sm bg-slate-950 border border-amber-700/50 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none leading-relaxed transition-all"
                    />
                  ) : (
                    <div>
                      {bookmark.userNote ? (
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {bookmark.userNote}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          尚未填寫個人心得筆記（點擊右上角「✏️ 編輯內容」即可記錄）
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. AI Comprehensive Insights Section */}
                <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>AI 核心情報提煉</span>
                      {isEditing && (
                        <span className="text-[10px] font-normal text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30">
                          可直接修改
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleReanalyze}
                      disabled={isReanalyzing}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-800 transition-colors cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                      <span>{isReanalyzing ? '重新分析中...' : '重新提煉'}</span>
                    </button>
                  </div>

                  {/* One-Liner */}
                  {isEditing ? (
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        AI 一句話定位 (One-Liner)
                      </div>
                      <textarea
                        rows={2}
                        value={editOneLiner}
                        onChange={(e) => setEditOneLiner(e.target.value)}
                        placeholder="一句話精準定位該工具或專案的核心價值..."
                        className="w-full text-xs bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-slate-200 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-500"
                      />
                    </div>
                  ) : (
                    bookmark.aiSummary?.oneLiner && (
                      <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800 shadow-xs">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          一句話定位
                        </div>
                        <div className="text-sm font-medium text-slate-200 leading-relaxed">
                          {bookmark.aiSummary.oneLiner}
                        </div>
                      </div>
                    )
                  )}

                  {/* Highlights */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          核心亮點與特色清單 ({editHighlights.length} 條)
                        </div>
                        <button
                          type="button"
                          onClick={handleAddHighlight}
                          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>新增亮點</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {editHighlights.map((h, i) => (
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
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                              title="刪除此條亮點"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {editHighlights.length === 0 && (
                          <div className="text-xs text-slate-500 italic py-1">目前無亮點，點擊「新增亮點」即可添加</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    bookmark.aiSummary?.highlights && (
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
                    )
                  )}

                  {/* Use Cases */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          適合場景與推薦情境 ({editUseCases.length} 條)
                        </div>
                        <button
                          type="button"
                          onClick={handleAddUseCase}
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>新增場景</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {editUseCases.map((u, i) => (
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
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                              title="刪除此場景"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {editUseCases.length === 0 && (
                          <div className="text-xs text-slate-500 italic py-1">目前無適用場景，點擊「新增場景」即可添加</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    bookmark.aiSummary?.useCases && bookmark.aiSummary.useCases.length > 0 && (
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
                    )
                  )}
                </div>

                {/* 4. Categorization & Tags Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      歸屬分類
                    </label>
                    <select
                      value={isEditing ? editCategoryId : (bookmark?.categoryId || 'cat-tools')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isEditing) {
                          setEditCategoryId(val);
                        } else {
                          onUpdateBookmark({ ...bookmark, categoryId: val });
                        }
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
                      {(isEditing ? editTags : bookmark?.tags || []).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                        >
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="刪除標籤"
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
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
                      >
                        新增
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Action Toolbar */}
              <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {isEditing ? (
                  <>
                    <div className="text-xs text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>正在編輯情報內容（未儲存變更）</span>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors border border-slate-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>✕ 放棄修改</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllChanges}
                        className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>💾 儲存變更</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>✏️ 編輯</span>
                        </button>

                        <button
                          onClick={onClose}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                        >
                          完成關閉
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
