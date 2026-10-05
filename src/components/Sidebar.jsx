import React from 'react';
import {
  Layers,
  Palette,
  Sparkles,
  Code2,
  Wrench,
  Folder,
  Plus,
  Star,
  Clock,
  Tag,
  BookmarkCheck,
  TrendingUp,
  FolderPlus
} from 'lucide-react';
import { GithubIcon } from './Icons';

const ICON_MAP = {
  Layers,
  Github: GithubIcon,
  Palette,
  Sparkles,
  Code2,
  Wrench,
  Folder,
};

export default function Sidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  filterFavorite,
  setFilterFavorite,
  filterUnread,
  setFilterUnread,
  bookmarks,
  onOpenCategoryModal,
}) {
  // Calculate counts per category
  const categoryCounts = React.useMemo(() => {
    const counts = { 'cat-all': bookmarks.length };
    categories.forEach((c) => {
      counts[c.id] = bookmarks.filter((b) => b.categoryId === c.id).length;
    });
    return counts;
  }, [categories, bookmarks]);

  // Favorite and Unread counts
  const favCount = bookmarks.filter((b) => b.isFavorite).length;
  const unreadCount = bookmarks.filter((b) => b.status === 'unread').length;

  // Extract all unique tags with count
  const tagCounts = React.useMemo(() => {
    const map = {};
    bookmarks.forEach((b) => {
      (b.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [bookmarks]);

  // Total GitHub Stars accumulated
  const totalStars = React.useMemo(() => {
    return bookmarks.reduce((sum, b) => sum + (b.githubStats?.stars || 0), 0);
  }, [bookmarks]);

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setFilterFavorite(false);
    setFilterUnread(false);
  };

  const handleToggleFavorite = () => {
    setFilterFavorite(!filterFavorite);
    if (!filterFavorite) {
      setSelectedCategory('cat-all');
      setFilterUnread(false);
    }
  };

  const handleToggleUnread = () => {
    setFilterUnread(!filterUnread);
    if (!filterUnread) {
      setSelectedCategory('cat-all');
      setFilterFavorite(false);
    }
  };

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-6 py-6 pr-4 border-r border-slate-800/80 min-h-[calc(100vh-4rem)]">
      
      {/* Category Navigation */}
      <div>
        <div className="flex items-center justify-between px-3 mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            知識分類
          </span>
          <button
            onClick={() => onOpenCategoryModal(null)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 px-2 py-0.5 rounded-md font-medium transition-colors"
            title="新增自訂分類"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>自訂分類</span>
          </button>
        </div>

        <nav className="space-y-1">
          {categories.map((cat) => {
            const IconComp = ICON_MAP[cat.icon] || Folder;
            const isSelected = selectedCategory === cat.id && !filterFavorite && !filterUnread;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left ${
                  isSelected
                    ? 'bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                    isSelected
                      ? 'bg-indigo-900/80 text-indigo-200'
                      : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Filters */}
      <div>
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          快速篩選
        </div>
        <div className="space-y-1">
          <button
            onClick={handleToggleFavorite}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
              filterFavorite
                ? 'bg-amber-950/40 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className={`w-4 h-4 ${filterFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <span>星標最愛</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-medium">
              {favCount}
            </span>
          </button>

          <button
            onClick={handleToggleUnread}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
              filterUnread
                ? 'bg-violet-950/40 text-violet-300 font-semibold border border-violet-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className={`w-4 h-4 ${filterUnread ? 'text-violet-400' : 'text-slate-500'}`} />
              <span>待深度研讀</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-medium">
              {unreadCount}
            </span>
          </button>
        </div>
      </div>

      {/* Tag Cloud */}
      <div className="flex-1">
        <div className="flex items-center justify-between px-3 mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            熱門智慧標籤
          </span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="text-xs text-indigo-400 hover:underline"
            >
              清除
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 px-2">
          {tagCounts.map(([tag, count]) => {
            const isTagActive = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isTagActive ? '' : tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isTagActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>#{tag}</span>
                <span className={`text-[10px] ${isTagActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Insights Card */}
      <div className="mt-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>知識庫摘要</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 shadow-xs">
            <div className="text-lg font-bold text-slate-100">{bookmarks.length}</div>
            <div className="text-[11px] text-slate-400">收錄站點</div>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 shadow-xs">
            <div className="text-lg font-bold text-indigo-400">
              {totalStars > 1000 ? `${(totalStars / 1000).toFixed(0)}k+` : totalStars}
            </div>
            <div className="text-[11px] text-slate-400">GitHub Stars</div>
          </div>
        </div>
      </div>

    </aside>
  );
}
