import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Settings,
  X,
  Cloud,
  Command,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenAddModal,
  onOpenSettings,
  onOpenCommandPalette,
  totalCount,
  filteredCount,
  supabaseSyncStatus = 'OFFLINE',
  currentUser = null,
  onGoogleLogin = () => {},
  onGoogleLogout = () => {},
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                <span className="hidden xs:inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  <span>AI 智能情報庫</span>
                  {totalCount > 0 && (
                    <span className="font-mono text-indigo-300">
                      ({filteredCount !== totalCount ? `${filteredCount}/${totalCount}` : totalCount})
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden lg:block">
                貼上網址與個人備註，AI 快速提煉核心重點與自動分類
              </p>
            </div>
          </div>

          {/* Search Bar & Command Palette Trigger */}
          <div className="hidden sm:block flex-1 max-w-md mx-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="快速搜尋網站、亮點、標籤..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2 text-xs sm:text-sm bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg outline-none transition-all placeholder:text-slate-500 text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="開啟指令調色盤 (Cmd+K / Ctrl+K)"
                >
                  <Command className="w-3 h-3 text-indigo-400" />
                  <span>K</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions & View Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Command Palette Button for Mobile */}
            <button
              onClick={onOpenCommandPalette}
              className="flex sm:hidden items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium transition-all shadow-xs cursor-pointer"
              title="指令調色盤 (⌘K)"
            >
              <Command className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">指令</span>
            </button>

            {/* View Switcher (Grid / Table) */}
            <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
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

            {/* Google Authentication & Per-User Sync Status */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs transition-all shadow-xs cursor-pointer"
                  title={`已登入 Google：${currentUser.displayName || currentUser.email} (點擊管理)`}
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-6 h-6 rounded-full border border-indigo-400/40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
                      {(currentUser.displayName || currentUser.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="text-left hidden sm:block max-w-[110px] truncate">
                    <span className="block font-medium text-[11px] leading-tight truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      獨立雲端同步
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-slate-200 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-slate-800">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full border border-indigo-500/50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                          {(currentUser.displayName || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-100 truncate">{currentUser.displayName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>此帳號專屬資料庫獨立隔離存取中</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer mb-1"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>同步中心與設定</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onGoogleLogout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>登出此 Google 帳號</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-semibold transition-all shadow-xs cursor-pointer hover:border-white/40"
                title="使用 Google 帳號登入並自動同步專屬資料"
              >
                {/* Google Logo SVG */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Google 登入同步</span>
                <span className="sm:hidden">登入</span>
              </button>
            )}

            {/* Cloud Status Indicator */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                supabaseSyncStatus === 'SUBSCRIBED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : supabaseSyncStatus === 'CONNECTED'
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/50'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title={
                supabaseSyncStatus === 'SUBSCRIBED'
                  ? '雲端即時同步中 (點擊開啟設定)'
                  : '離線/本地模式 (點擊開啟雲端設定)'
              }
            >
              {supabaseSyncStatus === 'SUBSCRIBED' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold">即時同步</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline text-[11px]">本地模式</span>
                </>
              )}
            </button>

            {/* Settings & Import/Export */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="資料庫設定與匯出/匯入"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary Add Button (Compact on Mobile) */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-950 cursor-pointer"
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
