import React from 'react';
import {
  Sparkles,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Settings,
  X,
  Bookmark,
  ExternalLink
} from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenAddModal,
  onOpenSettings,
  totalCount,
  filteredCount
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 border-b border-slate-800/80 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo & Product Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
                  LinkVault AI
                </span>
                <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  AI 智能情報庫
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden lg:block">
                貼上網址與個人備註，AI 快速提煉核心重點與自動分類
              </p>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile (<sm) to avoid crowding, since FilterBar has a full search */}
          <div className="hidden sm:block flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="快速搜尋網站、亮點、標籤... (/ 快捷鍵)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg outline-none transition-all placeholder:text-slate-500 text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
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
          </div>

          {/* Actions & View Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* View Switcher (Grid / Table) */}
            <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="精美卡片視圖"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>卡片</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="企業級清單表格"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>表格</span>
              </button>
            </div>

            {/* Settings & Import/Export */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors shadow-xs"
              title="資料庫設定與匯出/匯入"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary Add Button (Compact on Mobile) */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-950"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">收錄網址</span>
              <span className="xs:hidden">收錄</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
