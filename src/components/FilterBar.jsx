import React from 'react';
import {
  Search,
  X,
  Star,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  Tag,
  Plus
} from 'lucide-react';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  filterFavorite,
  setFilterFavorite,
  filterUnread,
  setFilterUnread,
  availableTags,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  categoryCounts,
  favCount,
  unreadCount,
  filteredCount,
  onOpenCategoryModal,
  isManualCategoryOrder = false,
  onReorderCategories = () => {},
  onResetCategoryOrder = () => {},
}) {
  const [dragId, setDragId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);

  return (
    <div className="space-y-4 mb-6">
      
      {/* Top Search Bar & View Mode / Sorting Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="搜尋標題、個人筆記、AI 亮點、標籤或網域... (/ 快捷鍵)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl outline-none transition-all placeholder:text-slate-500 text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Tools: View Mode & Sorting */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
          
          {/* Sorting Dropdown */}
          <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-1.5 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">排序:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs"
            >
              <option value="newest" className="bg-slate-900 text-slate-200">最新收錄優先</option>
              <option value="oldest" className="bg-slate-900 text-slate-200">最早收錄</option>
              <option value="stars" className="bg-slate-900 text-slate-200">GitHub Stars 最多</option>
              <option value="title" className="bg-slate-900 text-slate-200">標題字母排序</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:px-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="卡片視圖"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 sm:px-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="表格視圖"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Category Capsule Tab Navigation (Smooth touch scroll) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 touch-pan-x scrollbar-none">
        
        {/* All Categories */}
        <button
          onClick={() => {
            setSelectedCategory('cat-all');
            setFilterFavorite(false);
            setFilterUnread(false);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedCategory === 'cat-all' && !filterFavorite && !filterUnread
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          <span>全部情報</span>
          <span className="text-[10px] opacity-80 font-mono">
            {categoryCounts['cat-all'] || 0}
          </span>
        </button>

        {/* Dynamic Categories (auto-sorted by count, drag to reorder manually) */}
        {categories.filter((c) => !c.isSystem).map((cat) => {
          const isSelected = selectedCategory === cat.id && !filterFavorite && !filterUnread;
          const count = categoryCounts[cat.id] || 0;
          const isDropTarget = overId === cat.id && dragId && dragId !== cat.id;
          return (
            <button
              key={cat.id}
              draggable
              onDragStart={(e) => {
                setDragId(cat.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', cat.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overId !== cat.id) setOverId(cat.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onReorderCategories(dragId, cat.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onClick={() => {
                setSelectedCategory(cat.id);
                setFilterFavorite(false);
                setFilterUnread(false);
              }}
              title="拖曳可調整分類順序"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-grab active:cursor-grabbing ${
                dragId === cat.id ? 'opacity-40' : ''
              } ${isDropTarget ? 'ring-2 ring-indigo-400/70' : ''} ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-80 font-mono">{count}</span>
            </button>
          );
        })}

        {isManualCategoryOrder && (
          <button
            onClick={onResetCategoryOrder}
            title="恢復依數量自動排序"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 whitespace-nowrap transition-colors"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>依數量排序</span>
          </button>
        )}

        {/* Favorite Pill */}
        <button
          onClick={() => {
            setFilterFavorite(!filterFavorite);
            if (!filterFavorite) {
              setSelectedCategory('cat-all');
              setFilterUnread(false);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            filterFavorite
              ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-xs'
              : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${filterFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
          <span>星標最愛</span>
          <span className="text-[10px] opacity-80 font-mono">{favCount}</span>
        </button>

        {/* Unread / To-Read Pill */}
        <button
          onClick={() => {
            setFilterUnread(!filterUnread);
            if (!filterUnread) {
              setSelectedCategory('cat-all');
              setFilterFavorite(false);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            filterUnread
              ? 'bg-violet-950/60 text-violet-300 border-violet-500/50 shadow-xs'
              : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${filterUnread ? 'text-violet-400' : 'text-slate-500'}`} />
          <span>待深度研讀</span>
          <span className="text-[10px] opacity-80 font-mono">{unreadCount}</span>
        </button>

        {/* Add custom category button */}
        <button
          onClick={onOpenCategoryModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 border border-indigo-500/30 whitespace-nowrap transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>自訂分類</span>
        </button>

      </div>

      {/* Active Filter Indicators & Tag Cloud Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850">
        
        {/* Count text */}
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>共找到 <strong className="text-slate-100 font-semibold">{filteredCount}</strong> 筆資源</span>
          {(selectedTag || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTag('');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              清除篩選
            </button>
          )}
        </div>

        {/* Tag pills */}
        {availableTags && availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>熱門標籤:</span>
            </span>
            {availableTags.slice(0, 8).map(([tag, count]) => {
              const isTagActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isTagActive ? '' : tag)}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors border ${
                    isTagActive
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
