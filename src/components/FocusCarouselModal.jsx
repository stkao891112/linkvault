import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Zap,
  X,
  Tag,
  Image as ImageIcon,
  Check,
  Plus,
  Link2
} from 'lucide-react';
import { getFaviconUrl } from '../services/aiService';

export default function FocusCarouselModal({
  isOpen,
  onClose,
  items = [],
  screenshotPreview = '',
  categories = [],
  onSaveBatch,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [editableItems, setEditableItems] = useState([]);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Initialize editable state when items change or modal opens
  useEffect(() => {
    if (isOpen && items && items.length > 0) {
      setEditableItems(
        items.map((item) => ({
          ...item,
          title: item.title || '',
          guessedUrl: item.guessedUrl || '',
          domain: item.domain || '',
          oneLiner: item.oneLiner || '',
          highlights: Array.isArray(item.highlights) ? [...item.highlights] : [],
          suggestedCategory: item.suggestedCategory || 'cat-tools',
          tags: Array.isArray(item.tags) ? [...item.tags] : ['截圖辨識'],
          userNote: item.userNote || '來自截圖智能辨識',
        }))
      );
      setCurrentIndex(0);
      setDirection(1);
      setConfirmedItems([]);
      setIsCompleted(false);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  }, [isOpen, items]);

  const currentItem = editableItems[currentIndex];
  const totalCount = editableItems.length;

  // Update current item field
  const updateCurrentItem = useCallback(
    (field, value) => {
      setEditableItems((prev) => {
        const updated = [...prev];
        if (updated[currentIndex]) {
          updated[currentIndex] = {
            ...updated[currentIndex],
            [field]: value,
          };
        }
        return updated;
      });
    },
    [currentIndex]
  );

  // Move to next card
  const handleNext = useCallback(
    (saveCurrent = false) => {
      if (!currentItem) return;

      let nextConfirmed = [...confirmedItems];
      if (saveCurrent) {
        nextConfirmed = [...nextConfirmed, currentItem];
        setConfirmedItems(nextConfirmed);
      }

      if (currentIndex < totalCount - 1) {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
        setIsAddingTag(false);
        setNewTagInput('');
      } else {
        // Reached end of carousel
        setIsCompleted(true);
        if (onSaveBatch) {
          onSaveBatch(nextConfirmed);
        }
      }
    },
    [currentItem, confirmedItems, currentIndex, totalCount, onSaveBatch]
  );

  // Skip current card
  const handleSkip = useCallback(() => {
    if (currentIndex < totalCount - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setIsAddingTag(false);
      setNewTagInput('');
    } else {
      setIsCompleted(true);
      if (onSaveBatch && confirmedItems.length > 0) {
        onSaveBatch(confirmedItems);
      }
    }
  }, [currentIndex, totalCount, onSaveBatch, confirmedItems]);

  // One-click save all remaining items
  const handleSaveAll = useCallback(() => {
    const allToSave = [...confirmedItems];
    // Add current and all remaining unconfirmed items
    for (let i = currentIndex; i < totalCount; i++) {
      allToSave.push(editableItems[i]);
    }
    setConfirmedItems(allToSave);
    setIsCompleted(true);
    if (onSaveBatch) {
      onSaveBatch(allToSave);
    }
  }, [confirmedItems, currentIndex, totalCount, editableItems, onSaveBatch]);

  // Keyboard navigation stream
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showScreenshotModal) {
          setShowScreenshotModal(false);
        } else {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        // Tab triggers Skip
        e.preventDefault();
        handleSkip();
        return;
      }

      if (e.key === 'Enter') {
        if (e.target.tagName === 'TEXTAREA' && !e.ctrlKey && !e.metaKey) {
          return; // Allow newlines in textarea unless Ctrl/Cmd+Enter
        }
        e.preventDefault();
        handleNext(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCompleted, showScreenshotModal, handleNext, handleSkip, onClose]);

  // Add tag handler
  const handleAddTag = () => {
    if (newTagInput.trim() && currentItem) {
      const updatedTags = Array.from(new Set([...(currentItem.tags || []), newTagInput.trim()]));
      updateCurrentItem('tags', updatedTags);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  // Remove tag handler
  const handleRemoveTag = (tagToRemove) => {
    if (currentItem) {
      const updatedTags = (currentItem.tags || []).filter((t) => t !== tagToRemove);
      updateCurrentItem('tags', updatedTags);
    }
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* 1. Frosted Obsidian Glass Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl transition-all"
        aria-hidden="true"
      />

      {/* 2. Main Focus Carousel Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 max-w-2xl w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-[0_0_70px_-15px_rgba(99,102,241,0.35)] overflow-hidden flex flex-col my-auto"
      >
        {/* Ambient Top Glow Accent */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-r from-indigo-500/20 via-purple-500/25 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* ==================================================== */}
        {/* Celebration State View */}
        {/* ==================================================== */}
        {isCompleted ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-[0_0_40px_rgba(16,185,129,0.5)]"
            >
              <Check className="w-10 h-10 stroke-[3]" />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-300">
                🎉 截圖多網站識別收錄完成！
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                已將 <span className="text-emerald-400 font-bold">{confirmedItems.length}</span> 個精選網站重點存入知識庫，並自動同步至雲端與本機。
              </p>
            </div>

            {/* Quick summary of confirmed items */}
            <div className="w-full max-h-48 overflow-y-auto space-y-2 text-left bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {confirmedItems.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-800/50">
                  <span className="font-semibold text-slate-200 truncate mr-2">{c.title}</span>
                  <span className="font-mono text-indigo-400 text-[11px] shrink-0">{c.domain}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
            >
              完成並返回情報庫
            </button>
          </div>
        ) : (
          <>
            {/* ==================================================== */}
            {/* Top Stepper Header Bar */}
            {/* ==================================================== */}
            <div className="relative px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              {/* Left Badge & Stepper Counter */}
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>截圖識別流</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-300 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  [ {currentIndex + 1} / {totalCount} ]
                </div>
              </div>

              {/* Center / Right Screenshot Preview Chip & Close */}
              <div className="flex items-center gap-2">
                {screenshotPreview && (
                  <button
                    type="button"
                    onClick={() => setShowScreenshotModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                    title="檢視原始截圖"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">檢視來源截圖</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Smooth Progress Bar on Header Bottom */}
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                  initial={false}
                  animate={{
                    width: `${((currentIndex + 1) / totalCount) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* ==================================================== */}
            {/* Single Focused Card Body with Spring Slide Animation */}
            {/* ==================================================== */}
            <div className="p-5 sm:p-7 space-y-5 overflow-hidden flex-1">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={{
                    enter: (dir) => ({
                      x: dir > 0 ? 80 : -80,
                      opacity: 0,
                      scale: 0.97,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                      scale: 1,
                    },
                    exit: (dir) => ({
                      x: dir > 0 ? -80 : 80,
                      opacity: 0,
                      scale: 0.97,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="space-y-4 text-left"
                >
                  {/* Row 1: Title Input with Favicon */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      網站 / 專案名稱
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-inner">
                      <img
                        src={getFaviconUrl(currentItem.guessedUrl || currentItem.domain)}
                        alt=""
                        className="w-5 h-5 rounded-sm object-contain shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <input
                        type="text"
                        value={currentItem.title}
                        onChange={(e) => updateCurrentItem('title', e.target.value)}
                        placeholder="請輸入網站標題"
                        className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-100 placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 2: Guessed URL with Link Preview Button */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      官方首頁 / GitHub 網址
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                      <Link2 className="w-4 h-4 text-slate-500 shrink-0" />
                      <input
                        type="url"
                        value={currentItem.guessedUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentItem('guessedUrl', val);
                          try {
                            const d = new URL(val.startsWith('http') ? val : `https://${val}`).hostname.replace(/^www\./, '');
                            updateCurrentItem('domain', d);
                          } catch {}
                        }}
                        placeholder="https://..."
                        className="w-full bg-transparent text-xs font-mono text-cyan-300 placeholder:text-slate-600 outline-none"
                      />
                      {currentItem.guessedUrl && (
                        <a
                          href={currentItem.guessedUrl.startsWith('http') ? currentItem.guessedUrl : `https://${currentItem.guessedUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors shrink-0"
                          title="在新分頁開啟"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Category Pills Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      分類選擇
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {categories
                        .filter((c) => !c.isSystem)
                        .map((cat) => {
                          const isSelected = currentItem.suggestedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => updateCurrentItem('suggestedCategory', cat.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-950 text-indigo-200 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span>{cat.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Row 4: One-Liner Description */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      一句話核心價值 / 定位
                    </label>
                    <textarea
                      rows={2}
                      value={currentItem.oneLiner}
                      onChange={(e) => updateCurrentItem('oneLiner', e.target.value)}
                      placeholder="簡述此網站的核心亮點..."
                      className="w-full text-xs p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Row 5: Extracted Highlights Bullets */}
                  {currentItem.highlights && currentItem.highlights.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        AI 提煉亮點
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {currentItem.highlights.map((h, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Row 6: Tags Row */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      標籤
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(currentItem.tags || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-300"
                        >
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-rose-400 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {isAddingTag ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              } else if (e.key === 'Escape') {
                                setIsAddingTag(false);
                              }
                            }}
                            autoFocus
                            placeholder="輸入標籤..."
                            className="px-2 py-0.5 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-slate-100 outline-none w-24"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            新增
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingTag(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-950 border border-dashed border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>加標籤</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ==================================================== */}
            {/* Geek Keyboard Stream Action Bar */}
            {/* ==================================================== */}
            <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Keyboard Shortcuts Hint */}
              <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2 font-mono">
                <span>[Enter ⏎] 收錄下一張</span>
                <span>•</span>
                <span>[Tab ⇥] 跳過</span>
                <span>•</span>
                <span>[Esc] 關閉</span>
              </div>

              {/* Action Buttons Cluster */}
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                {/* Skip Card Button (Tab) */}
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                  title="跳過此筆 (Tab)"
                >
                  跳過此筆 <span className="font-mono text-[10px] text-slate-500 ml-1">Tab</span>
                </button>

                {/* Batch Save All Button */}
                {totalCount > 1 && (
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-950/80 border border-cyan-800/60 transition-colors cursor-pointer shadow-xs"
                    title="一鍵全部依序收錄"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>⚡ 一鍵全部收錄</span>
                  </button>
                )}

                {/* Confirm & Slide Next Button (Enter) */}
                <button
                  type="button"
                  onClick={() => handleNext(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <span>
                    {currentIndex === totalCount - 1 ? '確認收錄並完成' : '確認收錄並下一張'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ==================================================== */}
      {/* Zoomed Screenshot Modal Overlay */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showScreenshotModal && screenshotPreview && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowScreenshotModal(false)}
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setShowScreenshotModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={screenshotPreview}
                alt="原始截圖"
                className="max-h-[80vh] w-auto object-contain rounded-xl border border-slate-700 shadow-2xl"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
