import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import QuickAddHero from './components/QuickAddHero';
import FilterBar from './components/FilterBar';
import BookmarkCard from './components/BookmarkCard';
import BookmarkTable from './components/BookmarkTable';
import AddBookmarkModal from './components/AddBookmarkModal';
import BookmarkDetailModal from './components/BookmarkDetailModal';
import CategoryModal from './components/CategoryModal';
import SettingsModal from './components/SettingsModal';
import CommandPalette from './components/CommandPalette';
import { INITIAL_CATEGORIES, INITIAL_BOOKMARKS } from './data/initialData';
import * as cloudSync from './services/cloudSync';
import {
  resolveSupabaseConfig,
  saveStoredSupabaseConfig,
} from './services/supabaseService';
import {
  saveStoredFirebaseConfig,
  getStoredFirebaseConfig,
} from './services/firebaseService';
import { AnimatePresence } from 'motion/react';
import {
  Compass,
  CheckCircle2,
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

  // 2. Cloud Sync & Realtime State
  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', anonKey: '', source: 'none' });
  const [firebaseConfig, setFirebaseConfig] = useState(() => getStoredFirebaseConfig() || {});
  const [cloudSyncStatus, setCloudSyncStatus] = useState('OFFLINE'); // 'OFFLINE' | 'CONNECTING' | 'CONNECTED' | 'SUBSCRIBED'
  const [activeCloudProvider, setActiveCloudProvider] = useState(() => cloudSync.getActiveCloudProvider());
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  // 3. Filter & View Mode State
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

  // 4. Modal Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailBookmark, setDetailBookmark] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // 5. AI & Settings State
  const [customApiKey, setCustomApiKey] = useState(() => {
    try {
      return localStorage.getItem('linkvault_custom_apikey') || localStorage.getItem('sitevault_custom_apikey') || '';
    } catch {
      return '';
    }
  });

  const [apiProvider, setApiProvider] = useState(() => {
    try {
      return localStorage.getItem('linkvault_api_provider') || localStorage.getItem('sitevault_api_provider') || 'gemini';
    } catch {
      return 'gemini';
    }
  });

  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('linkvault_custom_baseurl') || '';
    } catch {
      return '';
    }
  });

  const [customModel, setCustomModel] = useState(() => {
    try {
      const saved = localStorage.getItem('linkvault_custom_model');
      if (!saved || saved === 'gemini-1.5-flash') return 'gemini-3.8-flash';
      return saved;
    } catch {
      return 'gemini-3.8-flash';
    }
  });

  // 6. Toast Feedback State
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
      localStorage.setItem('linkvault_custom_baseurl', customBaseUrl);
      localStorage.setItem('linkvault_custom_model', customModel);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [customApiKey, apiProvider, customBaseUrl, customModel]);

  // ==========================================
  // Supabase Cloud Sync Initialization & Realtime Subscription
  // ==========================================
  // Cloud Sync Initialization & Realtime Subscription (Firebase & Supabase)
  // ==========================================
  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    async function initializeCloud() {
      try {
        const cloudMeta = await cloudSync.resolveActiveCloudConfig();
        if (!isMounted) return;
        setActiveCloudProvider(cloudMeta.provider);

        if (!cloudMeta.isConfigured) {
          setCloudSyncStatus('OFFLINE');
          return;
        }

        setCloudSyncStatus('CONNECTING');
        const client = await cloudSync.initActiveCloud(cloudMeta);
        if (!client) {
          setCloudSyncStatus('OFFLINE');
          return;
        }

        const { categories: remoteCats, bookmarks: remoteBms } = await cloudSync.fetchRemoteData(cloudMeta.provider);
        if (!isMounted) return;

        let hasRemoteData = false;
        if (remoteBms && remoteBms.length > 0) {
          setBookmarks(remoteBms);
          hasRemoteData = true;
        }
        if (remoteCats && remoteCats.length > 0) {
          setCategories(remoteCats);
          hasRemoteData = true;
        }

        if (remoteBms !== null && remoteCats !== null && remoteBms.length === 0 && bookmarks.length > 0) {
          try {
            await cloudSync.batchUploadAll(bookmarks, categories);
            showToast('已自動將本機情報資料初始化推播至雲端資料庫！');
          } catch (seedErr) {
            console.warn('Initial cloud seed warning:', seedErr);
          }
        } else if (hasRemoteData) {
          const providerLabel = cloudMeta.provider === 'firebase' ? 'Firebase Firestore' : 'Supabase';
          showToast(`🟢 已連線 ${providerLabel} 雲端資料庫並同步最新資料`);
        }

        unsubscribe = cloudSync.subscribeToRemoteRealtime(cloudMeta.provider, {
          onBookmarksChange: (newBms) => {
            if (Array.isArray(newBms) && newBms.length > 0) {
              setBookmarks(newBms);
            }
          },
          onCategoriesChange: (newCats) => {
            if (Array.isArray(newCats) && newCats.length > 0) {
              setCategories(newCats);
            }
          },
          onBookmarkInsert: (newBm) => {
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === newBm.id)) return prev;
              return [newBm, ...prev];
            });
            showToast(`跨裝置即時推播：已同步收錄「${newBm.title?.slice(0, 16)}...」`);
          },
          onBookmarkUpdate: (updatedBm) => {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === updatedBm.id ? updatedBm : b))
            );
            setDetailBookmark((prev) => (prev?.id === updatedBm.id ? updatedBm : prev));
          },
          onBookmarkDelete: (id) => {
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
            setDetailBookmark((prev) => (prev?.id === id ? null : prev));
          },
          onCategoryInsert: (newCat) => {
            setCategories((prev) => {
              if (prev.some((c) => c.id === newCat.id)) return prev;
              return [...prev, newCat];
            });
          },
          onCategoryUpdate: (updatedCat) => {
            setCategories((prev) =>
              prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
            );
          },
          onCategoryDelete: (catId) => {
            setCategories((prev) => prev.filter((c) => c.id !== catId));
          },
          onStatusChange: (status) => {
            if (!isMounted) return;
            if (status === 'SUBSCRIBED') {
              setCloudSyncStatus('SUBSCRIBED');
            } else if (status === 'CONNECTED') {
              setCloudSyncStatus('CONNECTED');
            } else if (status === 'CONNECTING') {
              setCloudSyncStatus('CONNECTING');
            } else {
              setCloudSyncStatus('OFFLINE');
            }
          },
        });
      } catch (err) {
        console.warn('Cloud sync init exception:', err);
        if (isMounted) setCloudSyncStatus('OFFLINE');
      }
    }

    initializeCloud();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [reconnectTrigger]);

  const handleSaveFirebaseConfig = (newCfg) => {
    saveStoredFirebaseConfig(newCfg);
    cloudSync.setActiveCloudProvider(cloudSync.CLOUD_PROVIDERS.FIREBASE);
    setActiveCloudProvider(cloudSync.CLOUD_PROVIDERS.FIREBASE);
    setFirebaseConfig(newCfg);
    setReconnectTrigger((prev) => prev + 1);
    showToast('Firebase 連線設定已儲存');
  };

  const handleSaveSupabaseConfig = (newUrl, newKey) => {
    saveStoredSupabaseConfig({ url: newUrl, anonKey: newKey });
    cloudSync.setActiveCloudProvider(cloudSync.CLOUD_PROVIDERS.SUPABASE);
    setActiveCloudProvider(cloudSync.CLOUD_PROVIDERS.SUPABASE);
    setReconnectTrigger((prev) => prev + 1);
    showToast('Supabase 連線設定已儲存');
  };

  const handleManualSyncToCloud = async () => {
    const res = await cloudSync.batchUploadAll(bookmarks, categories);
    showToast(`已成功同步至雲端資料庫！`);
    return res;
  };



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
    cloudSync.upsertBookmark(newBm).catch((err) => console.warn('Cloud upsert failed:', err));
    showToast(`成功收錄「${newBm.title.slice(0, 20)}...」並完成 AI 提煉！`);
  };

  const handleUpdateBookmark = (updatedBm) => {
    setBookmarks((prev) => prev.map((b) => (b.id === updatedBm.id ? updatedBm : b)));
    if (detailBookmark?.id === updatedBm.id) {
      setDetailBookmark(updatedBm);
    }
    cloudSync.upsertBookmark(updatedBm).catch((err) => console.warn('Cloud update failed:', err));
  };

  const handleDeleteBookmark = (id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    cloudSync.deleteBookmark(id).catch((err) => console.warn('Cloud delete failed:', err));
    showToast('已自情報庫中刪除', 'info');
  };

  const handleToggleFavorite = useCallback((id) => {
    setBookmarks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, isFavorite: !b.isFavorite };
          cloudSync.upsertBookmark(updated).catch((err) => console.warn('Cloud fav update failed:', err));
          return updated;
        }
        return b;
      })
    );
    setDetailBookmark((prev) => (prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev));
  }, []);

  // Zero-Modal Drawer Navigation & Index Calculation
  const currentDetailIndex = useMemo(() => {
    if (!detailBookmark) return -1;
    return filteredBookmarks.findIndex((b) => b.id === detailBookmark.id);
  }, [detailBookmark, filteredBookmarks]);

  const handleNavigateNext = useCallback(() => {
    if (currentDetailIndex >= 0 && currentDetailIndex < filteredBookmarks.length - 1) {
      setDetailBookmark(filteredBookmarks[currentDetailIndex + 1]);
    } else if (!detailBookmark && filteredBookmarks.length > 0) {
      setDetailBookmark(filteredBookmarks[0]);
    }
  }, [currentDetailIndex, detailBookmark, filteredBookmarks]);

  const handleNavigatePrev = useCallback(() => {
    if (currentDetailIndex > 0) {
      setDetailBookmark(filteredBookmarks[currentDetailIndex - 1]);
    }
  }, [currentDetailIndex, filteredBookmarks]);

  // Global Keyboard Shortcuts (Cmd+K, J, K, F, Esc, /, N)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Command Palette: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If user is typing in input, textarea, or contentEditable, do not trigger single-key hotkeys
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsAddModalOpen(true);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handleNavigateNext();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleNavigatePrev();
      } else if (e.key === 'f' || e.key === 'F') {
        if (detailBookmark) {
          e.preventDefault();
          handleToggleFavorite(detailBookmark.id);
        }
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsAddModalOpen(false);
        setDetailBookmark(null);
        setIsCategoryModalOpen(false);
        setIsSettingsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailBookmark, handleNavigateNext, handleNavigatePrev, handleToggleFavorite]);

  const handleToggleStatus = (id) => {
    setBookmarks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, status: b.status === 'read' ? 'unread' : 'read' };
          cloudSync.upsertBookmark(updated).catch((err) => console.warn('Cloud status update failed:', err));
          return updated;
        }
        return b;
      })
    );
  };

  const handleAddCategory = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
    cloudSync.upsertCategory(newCat).catch((err) => console.warn('Cloud add category failed:', err));
    showToast(`已建立「${newCat.name}」自訂分類`);
  };

  const handleDeleteCategory = (catId) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setBookmarks((prev) =>
      prev.map((b) => (b.categoryId === catId ? { ...b, categoryId: 'cat-tools' } : b))
    );
    cloudSync.deleteCategory(catId).catch((err) => console.warn('Cloud delete category failed:', err));
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
    if (cloudSyncStatus === 'SUBSCRIBED' || cloudSyncStatus === 'CONNECTED') {
      cloudSync.batchUploadAll(INITIAL_BOOKMARKS, INITIAL_CATEGORIES).catch((err) =>
        console.warn('Cloud reset upload failed:', err)
      );
    }
    showToast('已重設為初始示範資料');
  };

  const handleImportData = (newBookmarks, newCategories) => {
    setBookmarks(newBookmarks);
    if (newCategories && newCategories.length > 0) {
      setCategories(newCategories);
    }
    if (cloudSyncStatus === 'SUBSCRIBED' || cloudSyncStatus === 'CONNECTED') {
      cloudSync.batchUploadAll(newBookmarks, newCategories || categories).catch((err) =>
        console.warn('Cloud import upload failed:', err)
      );
    }
    showToast(`已成功匯入 ${newBookmarks.length} 筆收藏資料！`);
  };

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
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Tech Matrix Grid Background Canvas */}
      <div 
        className="fixed inset-0 pointer-events-none bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-40 z-0" 
        aria-hidden="true"
      />

      {/* 2. Dynamic Ambient Aurora Orbs */}
      {/* Primary Top Aurora Orb */}
      <div 
        className="fixed -top-40 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-gradient-to-r from-indigo-500/25 via-purple-500/20 to-cyan-500/25 rounded-full blur-[130px] pointer-events-none z-0 animate-float-slow" 
        aria-hidden="true"
      />
      {/* Right Neon Cyan / Violet Glow Orb */}
      <div 
        className="fixed top-1/4 -right-48 w-[520px] h-[520px] bg-gradient-to-bl from-cyan-500/15 via-blue-600/15 to-violet-600/15 rounded-full blur-[140px] pointer-events-none z-0 animate-float-reverse" 
        aria-hidden="true"
      />
      {/* Bottom Left Deep Purple / Pink Nebula Orb */}
      <div 
        className="fixed -bottom-40 -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/15 via-pink-500/10 to-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0 animate-float-slow" 
        aria-hidden="true"
      />

      {/* Main App Content Stack */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top Fixed Header with Realtime Sync Status Indicator */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          totalCount={bookmarks.length}
          filteredCount={filteredBookmarks.length}
          supabaseSyncStatus={supabaseSyncStatus}
        />

      {/* Main Single-Column Fluid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* 1. Hero Quick-Add Section */}
        <QuickAddHero
          categories={categories}
          onSaveBookmark={handleSaveBookmark}
          customApiKey={customApiKey}
          apiProvider={apiProvider}
          customBaseUrl={customBaseUrl}
          customModel={customModel}
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
                  className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700 cursor-pointer"
                >
                  清除所有篩選
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 [grid-auto-flow:dense]">
            <AnimatePresence mode="popLayout">
              {filteredBookmarks.map((bookmark, index) => {
                const isBento = bookmark.isBento !== undefined
                  ? bookmark.isBento
                  : (bookmark.id === 'bm-1' || bookmark.id === 'bm-4' || (bookmark.isFavorite && index % 2 === 0));
                return (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    category={categories.find((c) => c.id === bookmark.categoryId)}
                    onOpenDetail={(bm) => setDetailBookmark(bm)}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteBookmark}
                    onSelectTag={(t) => setSelectedTag(t)}
                    isBento={isBento}
                  />
                );
              })}
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
        customBaseUrl={customBaseUrl}
        customModel={customModel}
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
        customBaseUrl={customBaseUrl}
        customModel={customModel}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        hasNext={currentDetailIndex >= 0 && currentDetailIndex < filteredBookmarks.length - 1}
        hasPrev={currentDetailIndex > 0}
        currentIndex={currentDetailIndex}
        totalCount={filteredBookmarks.length}
      />

      {/* Custom Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Settings & Supabase Cloud Sync Modal */}
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
        customBaseUrl={customBaseUrl}
        setCustomBaseUrl={setCustomBaseUrl}
        customModel={customModel}
        setCustomModel={setCustomModel}
        supabaseConfig={supabaseConfig}
        supabaseSyncStatus={supabaseSyncStatus}
        onSaveSupabaseConfig={handleSaveSupabaseConfig}
        onManualSyncToCloud={handleManualSyncToCloud}
      />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        onSelectBookmark={(bm) => setDetailBookmark(bm)}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'grid' ? 'table' : 'grid'))}
        onToggleFavoriteFilter={() => setFilterFavorite((prev) => !prev)}
        onToggleUnreadFilter={() => setFilterUnread((prev) => !prev)}
        viewMode={viewMode}
        filterFavorite={filterFavorite}
        filterUnread={filterUnread}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-slate-100 text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      </div>
    </div>
  );
}
