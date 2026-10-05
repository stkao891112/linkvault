import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Star,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  Settings,
  Folder,
  CornerDownLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDomainTheme } from '../utils/domainTheme';

export default function CommandPalette({
  isOpen,
  onClose,
  bookmarks = [],
  categories = [],
  onSelectBookmark,
  onSelectCategory,
  onOpenAddModal,
  onOpenSettings,
  onToggleViewMode,
  onToggleFavoriteFilter,
  onToggleUnreadFilter,
  viewMode = 'grid',
  filterFavorite = false,
  filterUnread = false,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const quickActions = useMemo(() => {
    return [
      {
        id: 'act-add',
        type: 'action',
        title: '快速收錄新網址...',
        subtitle: '貼上網址並由 AI 萃取重點與生成標籤',
        icon: Plus,
        iconColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30',
        shortcut: 'N',
        run: () => {
          onClose();
          onOpenAddModal();
        },
      },
      {
        id: 'act-fav',
        type: 'action',
        title: filterFavorite ? '取消最愛篩選（顯示全部）' : '僅顯示最愛收藏',
        subtitle: filterFavorite ? '回到全部書籤' : '快速篩選標記 ⭐ 最愛的網站',
        icon: Star,
        iconColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
        shortcut: 'F',
        run: () => {
          onClose();
          onToggleFavoriteFilter();
        },
      },
      {
        id: 'act-unread',
        type: 'action',
        title: filterUnread ? '取消待研讀篩選（顯示全部）' : '僅顯示待研讀情報',
        subtitle: filterUnread ? '回到全部書籤' : '集中研讀未消化的技術與設計素材',
        icon: BookOpen,
        iconColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
        run: () => {
          onClose();
          onToggleUnreadFilter();
        },
      },
      {
        id: 'act-view',
        type: 'action',
        title: viewMode === 'grid' ? '切換為表格清單視圖' : '切換為 Bento 卡片視圖',
        subtitle: viewMode === 'grid' ? '高密度資料表視角' : '現代視覺化非對稱網格',
        icon: viewMode === 'grid' ? TableIcon : LayoutGrid,
        iconColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30',
        run: () => {
          onClose();
          onToggleViewMode();
        },
      },
      {
        id: 'act-settings',
        type: 'action',
        title: '開啟設定與 Supabase 雲端同步',
        subtitle: '管理 API Key、自訂模型端點與資料庫即時同步',
        icon: Settings,
        iconColor: 'text-violet-400 bg-violet-950/60 border-violet-500/30',
        run: () => {
          onClose();
          onOpenSettings();
        },
      },
    ];
  }, [
    filterFavorite,
    filterUnread,
    viewMode,
    onClose,
    onOpenAddModal,
    onToggleFavoriteFilter,
    onToggleUnreadFilter,
    onToggleViewMode,
    onOpenSettings,
  ]);

  const categoryActions = useMemo(() => {
    return categories.map((cat) => ({
      id: `cat-${cat.id}`,
      type: 'category',
      title: `切換至分類: ${cat.name}`,
      subtitle: `篩選分類為「${cat.name}」的書籤收藏`,
      icon: Folder,
      iconColor: 'text-slate-300 bg-slate-800 border-slate-700',
      color: cat.color,
      run: () => {
        onClose();
        onSelectCategory(cat.id);
      },
    }));
  }, [categories, onClose, onSelectCategory]);

  const filteredBookmarks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return bookmarks
      .filter((b) => {
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const domainMatch = (b.domain || '').toLowerCase().includes(q);
        const urlMatch = (b.url || '').toLowerCase().includes(q);
        const noteMatch = (b.userNote || '').toLowerCase().includes(q);
        const summaryMatch = (b.aiSummary?.oneLiner || '').toLowerCase().includes(q);
        const highlightsMatch = (b.aiSummary?.highlights || []).some((h) =>
          h.toLowerCase().includes(q)
        );
        const tagMatch = (b.tags || []).some((t) => t.toLowerCase().includes(q));
        return titleMatch || domainMatch || urlMatch || noteMatch || summaryMatch || highlightsMatch || tagMatch;
      })
      .slice(0, 8);
  }, [bookmarks, query]);

  // Combined list of actionable items based on query
  const items = useMemo(() => {
    if (!query.trim()) {
      return [...quickActions, ...categoryActions];
    }

    const bookmarkItems = filteredBookmarks.map((bm) => {
      const theme = getDomainTheme(bm.domain, bm.categoryId);
      return {
        id: `bm-${bm.id}`,
        type: 'bookmark',
        title: bm.title,
        subtitle: bm.aiSummary?.oneLiner || bm.userNote || bm.domain,
        domain: bm.domain,
        favicon: bm.favicon,
        theme,
        bookmark: bm,
        run: () => {
          onClose();
          onSelectBookmark(bm);
        },
      };
    });

    const matchingActions = quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(query.toLowerCase())
    );

    const matchingCategories = categoryActions.filter((c) =>
      c.title.toLowerCase().includes(query.toLowerCase())
    );

    return [...bookmarkItems, ...matchingActions, ...matchingCategories];
  }, [query, quickActions, categoryActions, filteredBookmarks, onClose, onSelectBookmark]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within palette
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        items.length > 0 ? (prev - 1 + items.length) % items.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
          />

          {/* Command Palette Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col backdrop-blur-2xl"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜尋網站情報、AI 筆記、標籤，或輸入指令... (↑↓ 導覽)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-100 placeholder:text-slate-500 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Results / Commands List */}
            <div
              ref={listRef}
              className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto p-2 space-y-1"
            >
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
                  找不到符合「{query}」的書籤或指令
                </div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={item.run}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-indigo-600/20 text-slate-100 border border-indigo-500/40 shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon or Favicon */}
                        {item.type === 'bookmark' ? (
                          <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 border border-slate-800">
                            <img
                              src={item.favicon}
                              alt=""
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              item.iconColor || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate">
                              {item.title}
                            </span>
                            {item.domain && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border truncate ${
                                  item.theme?.badgeClass || 'text-slate-400 bg-slate-800'
                                }`}
                              >
                                {item.domain}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Indicator: Enter or Shortcut */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">執行</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with keyboard guidance */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 text-[10px]">↑↓</kbd>
                  導覽
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 text-[10px]">↵</kbd>
                  選取執行
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 text-[10px]">ESC</kbd>
                  關閉
                </span>
              </div>
              <div className="text-slate-400">
                LinkVault Command Palette
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
