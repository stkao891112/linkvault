import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import QuickAddHero from './components/QuickAddHero';
import FilterBar from './components/FilterBar';
import BookmarkCard from './components/BookmarkCard';
import BookmarkTable from './components/BookmarkTable';
import AddBookmarkModal from './components/AddBookmarkModal';
import BookmarkDetailModal from './components/BookmarkDetailModal';
import CategoryModal from './components/CategoryModal';
import SettingsModal from './components/SettingsModal';
import { INITIAL_CATEGORIES, INITIAL_BOOKMARKS } from './data/initialData';
import { AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  Compass,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // 1. Core Data State with LocalStorage Persistence
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('linkvault_categories') || localStorage.getItem('sitevault_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('linkvault_bookmarks') || localStorage.getItem('sitevault_bookmarks');
      return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
    } catch {
      return INITIAL_BOOKMARKS;
    }
  });

  // 2. Filter & View Mode State
  const [selectedCategory, setSelectedCategory] = useState('cat-all');
  const [selectedTag, setSelectedTag] = useState('');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'stars' | 'title'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('linkvault_viewmode') || localStorage.getItem('sitevault_viewmode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  // 3. Modal Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailBookmark, setDetailBookmark] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 4. AI & Settings State
  const [customApiKey, setCustomApiKey] = useState(() => {
    try {
      return localStorage.getItem('linkvault_custom_apikey') || localStorage.getItem('sitevault_custom_apikey') || '';
    } catch {
      return '';
    }
  });

  const [apiProvider, setApiProvider] = useState(() => {
    try {
      return localStorage.getItem('linkvault_api_provider') || localStorage.getItem('sitevault_api_provider') || 'mock';
    } catch {
      return 'mock';
    }
  });

  // 5. Toast Feedback State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('linkvault_categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('linkvault_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('linkvault_viewmode', viewMode);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('linkvault_custom_apikey', customApiKey);
      localStorage.setItem('linkvault_api_provider', apiProvider);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [customApiKey, apiProvider]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsAddModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setDetailBookmark(null);
        setIsCategoryModalOpen(false);
        setIsSettingsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered & Sorted Bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    // 1. Category Filter
    if (selectedCategory !== 'cat-all') {
      result = result.filter((b) => b.categoryId === selectedCategory);
    }

    // 2. Favorite Filter
    if (filterFavorite) {
      result = result.filter((b) => b.isFavorite);
    }

    // 3. Unread / Study Later Filter
    if (filterUnread) {
      result = result.filter((b) => b.status === 'unread');
    }

    // 4. Tag Filter
    if (selectedTag) {
      result = result.filter((b) => (b.tags || []).includes(selectedTag));
    }

    // 5. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const domainMatch = (b.domain || '').toLowerCase().includes(q);
        const noteMatch = (b.userNote || '').toLowerCase().includes(q);
        const oneLinerMatch = (b.aiSummary?.oneLiner || '').toLowerCase().includes(q);
        const highlightsMatch = (b.aiSummary?.highlights || []).some((h) =>
          h.toLowerCase().includes(q)
        );
        const tagMatch = (b.tags || []).some((t) => t.toLowerCase().includes(q));
        return titleMatch || domainMatch || noteMatch || oneLinerMatch || highlightsMatch || tagMatch;
      });
    }

    // 6. Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'stars') {
      result.sort((a, b) => (b.githubStats?.stars || 0) - (a.githubStats?.stars || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [bookmarks, selectedCategory, filterFavorite, filterUnread, selectedTag, searchQuery, sortBy]);

  // Actions
  const handleSaveBookmark = (newBm) => {
    setBookmarks((prev) => [newBm, ...prev]);
    showToast(`成功收錄「${newBm.title.slice(0, 20)}...」並完成 AI 提煉！`);
  };

  const handleUpdateBookmark = (updatedBm) => {
    setBookmarks((prev) => prev.map((b) => (b.id === updatedBm.id ? updatedBm : b)));
    if (detailBookmark?.id === updatedBm.id) {
      setDetailBookmark(updatedBm);
    }
  };

  const handleDeleteBookmark = (id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast('已自情報庫中刪除', 'info');
  };

  const handleToggleFavorite = (id) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))
    );
  };

  const handleToggleStatus = (id) => {
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === 'read' ? 'unread' : 'read' } : b
      )
    );
  };

  const handleAddCategory = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
    showToast(`已建立「${newCat.name}」自訂分類`);
  };

  const handleDeleteCategory = (catId) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setBookmarks((prev) =>
      prev.map((b) => (b.categoryId === catId ? { ...b, categoryId: 'cat-tools' } : b))
    );
    if (selectedCategory === catId) {
      setSelectedCategory('cat-all');
    }
    showToast('已刪除該自訂分類', 'info');
  };

  const handleResetData = () => {
    setCategories(INITIAL_CATEGORIES);
    setBookmarks(INITIAL_BOOKMARKS);
    setSelectedCategory('cat-all');
    setSelectedTag('');
    setFilterFavorite(false);
    setFilterUnread(false);
    showToast('已重設為初始示範資料');
  };

  const handleImportData = (newBookmarks, newCategories) => {
    setBookmarks(newBookmarks);
    if (newCategories && newCategories.length > 0) {
      setCategories(newCategories);
    }
    showToast(`已成功匯入 ${newBookmarks.length} 筆收藏資料！`);
  };

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);

  const categoryCounts = useMemo(() => {
    const counts = { 'cat-all': bookmarks.length };
    categories.forEach((c) => {
      counts[c.id] = bookmarks.filter((b) => b.categoryId === c.id).length;
    });
    return counts;
  }, [categories, bookmarks]);

  const favCount = useMemo(() => bookmarks.filter((b) => b.isFavorite).length, [bookmarks]);
  const unreadCount = useMemo(() => bookmarks.filter((b) => b.status === 'unread').length, [bookmarks]);

  const allTagsWithCount = useMemo(() => {
    const map = {};
    bookmarks.forEach((b) => {
      (b.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [bookmarks]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Fixed Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        totalCount={bookmarks.length}
        filteredCount={filteredBookmarks.length}
      />

      {/* Main Single-Column Fluid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* 1. Hero Quick-Add Section */}
        <QuickAddHero
          categories={categories}
          onSaveBookmark={handleSaveBookmark}
          customApiKey={customApiKey}
          apiProvider={apiProvider}
        />

        {/* 2. Fluid Capsule Filter Bar & Search */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          filterFavorite={filterFavorite}
          setFilterFavorite={setFilterFavorite}
          filterUnread={filterUnread}
          setFilterUnread={setFilterUnread}
          availableTags={allTagsWithCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          categoryCounts={categoryCounts}
          favCount={favCount}
          unreadCount={unreadCount}
          filteredCount={filteredBookmarks.length}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        />

        {/* 3. Bookmarks Display: Grid or Table */}
        {filteredBookmarks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 shadow-lg shadow-black/20 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-200">尚無符合條件的網站或素材</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              可嘗試清除篩選條件，或直接在上方輸入網址，讓 AI 為您快速提煉重點。
            </p>
            <div className="flex items-center gap-2 mt-4">
              {(selectedCategory !== 'cat-all' || selectedTag || searchQuery || filterFavorite || filterUnread) && (
                <button
                  onClick={() => {
                    setSelectedCategory('cat-all');
                    setSelectedTag('');
                    setSearchQuery('');
                    setFilterFavorite(false);
                    setFilterUnread(false);
                  }}
                  className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700"
                >
                  清除所有篩選
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  category={categories.find((c) => c.id === bookmark.categoryId)}
                  onOpenDetail={(bm) => setDetailBookmark(bm)}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteBookmark}
                  onSelectTag={(t) => setSelectedTag(t)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <BookmarkTable
            bookmarks={filteredBookmarks}
            categories={categories}
            onOpenDetail={(bm) => setDetailBookmark(bm)}
            onToggleFavorite={handleToggleFavorite}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteBookmark}
            onSelectTag={(t) => setSelectedTag(t)}
          />
        )}

      </main>

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onSaveBookmark={handleSaveBookmark}
        customApiKey={customApiKey}
        apiProvider={apiProvider}
      />

      {/* Bookmark Detail Drawer Modal */}
      <BookmarkDetailModal
        bookmark={detailBookmark}
        isOpen={!!detailBookmark}
        onClose={() => setDetailBookmark(null)}
        categories={categories}
        onUpdateBookmark={handleUpdateBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        customApiKey={customApiKey}
        apiProvider={apiProvider}
      />

      {/* Custom Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Settings & Import/Export Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        onImportData={handleImportData}
        onResetData={handleResetData}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        apiProvider={apiProvider}
        setApiProvider={setApiProvider}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-slate-100 text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
