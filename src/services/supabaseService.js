import { createClient } from '@supabase/supabase-js';

// 繁體中文資料表名稱定義
export const SUPABASE_TABLES = {
  BOOKMARKS: '書籤情報',
  CATEGORIES: '知識分類',
};

// 儲存於 LocalStorage 的設定鍵名
export const STORAGE_KEYS = {
  SUPABASE_URL: 'linkvault_supabase_url',
  SUPABASE_ANON_KEY: 'linkvault_supabase_anon_key',
};

let supabaseClient = null;
let currentConfig = { url: '', anonKey: '' };
let activeSubscription = null;

// ==========================================
// 繁體中文資料表 <-> 前端 camelCase 雙向映射器
// ==========================================

export function toSupabaseBookmark(b) {
  return {
    '編號': b.id,
    '網址': b.url,
    '標題': b.title || '無標題',
    '網域': b.domain || '',
    '圖標': b.favicon || '',
    '分類編號': b.categoryId || 'cat-tools',
    '個人筆記': b.userNote || '',
    'AI摘要': b.aiSummary || null,
    '標籤清單': Array.isArray(b.tags) ? b.tags : [],
    '是否最愛': Boolean(b.isFavorite),
    '閱讀狀態': b.status || 'unread',
    '建立時間': b.createdAt || new Date().toISOString(),
    'GitHub數據': b.githubStats || null,
  };
}

export function fromSupabaseBookmark(row) {
  if (!row) return null;
  return {
    id: row['編號'],
    url: row['網址'],
    title: row['標題'] || '',
    domain: row['網域'] || '',
    favicon: row['圖標'] || '',
    categoryId: row['分類編號'] || 'cat-tools',
    userNote: row['個人筆記'] || '',
    aiSummary: row['AI摘要'] || null,
    tags: Array.isArray(row['標籤清單']) ? row['標籤清單'] : [],
    isFavorite: Boolean(row['是否最愛']),
    status: row['閱讀狀態'] || 'unread',
    createdAt: row['建立時間'] || new Date().toISOString(),
    githubStats: row['GitHub數據'] || null,
  };
}

export function toSupabaseCategory(c) {
  return {
    '編號': c.id,
    '名稱': c.name || '未命名分類',
    '代表色': c.color || '#3b82f6',
    '圖標名稱': c.icon || 'Layers',
    '是否系統預設': Boolean(c.isSystem),
  };
}

export function fromSupabaseCategory(row) {
  if (!row) return null;
  return {
    id: row['編號'],
    name: row['名稱'] || '',
    color: row['代表色'] || '#3b82f6',
    icon: row['圖標名稱'] || 'Layers',
    isSystem: Boolean(row['是否系統預設']),
  };
}

// ==========================================
// 完整繁體中文 Supabase 一鍵建表與即時推播 SQL 腳本
// ==========================================
export const SUPABASE_SETUP_SQL = `-- ==========================================
-- LinkVault AI - Supabase 繁體中文結構建表腳本
-- 請在 Supabase 專案的「SQL Editor」中貼上並點擊 Run 執行
-- ==========================================

-- 1. 建立「知識分類」資料表
create table if not exists public."知識分類" (
  "編號" text primary key,
  "名稱" text not null,
  "代表色" text default '#3b82f6',
  "圖標名稱" text default 'Layers',
  "是否系統預設" boolean default false,
  "建立時間" timestamptz default timezone('utc'::text, now()) not null
);

-- 2. 建立「書籤情報」資料表
create table if not exists public."書籤情報" (
  "編號" text primary key,
  "網址" text not null,
  "標題" text not null,
  "網域" text,
  "圖標" text,
  "分類編號" text,
  "個人筆記" text,
  "AI摘要" jsonb,
  "標籤清單" jsonb default '[]'::jsonb,
  "是否最愛" boolean default false,
  "閱讀狀態" text default 'unread',
  "建立時間" timestamptz default timezone('utc'::text, now()) not null,
  "GitHub數據" jsonb
);

-- 3. 預設寫入基礎知識分類
insert into public."知識分類" ("編號", "名稱", "代表色", "圖標名稱", "是否系統預設")
values
  ('cat-all', '全部收藏', '#3b82f6', 'Layers', true),
  ('cat-github', 'GitHub 開源專案', '#10b981', 'Github', false),
  ('cat-assets', '設計與素材庫', '#f59e0b', 'Palette', false),
  ('cat-ai', 'AI 輔助與模型', '#8b5cf6', 'Sparkles', false),
  ('cat-frontend', '前端組件與動畫', '#06b6d4', 'Code2', false),
  ('cat-tools', '效能與實用工具', '#ec4899', 'Wrench', false)
on conflict ("編號") do nothing;

-- 4. 啟用 Row Level Security (RLS) 並開放 Anon 存取
alter table public."知識分類" enable row level security;
alter table public."書籤情報" enable row level security;

drop policy if exists "允許所有人讀寫 知識分類" on public."知識分類";
create policy "允許所有人讀寫 知識分類" on public."知識分類"
  for all using (true) with check (true);

drop policy if exists "允許所有人讀寫 書籤情報" on public."書籤情報";
create policy "允許所有人讀寫 書籤情報" on public."書籤情報"
  for all using (true) with check (true);

-- 5. 啟用 Supabase Realtime 即時推播廣播
-- 電腦與手機端只要有任何新增、修改、刪除，即可免手動刷新自動更新！
alter publication supabase_realtime add table public."知識分類";
alter publication supabase_realtime add table public."書籤情報";
`;

// ==========================================
// Supabase 客戶端配置與生命週期管理
// ==========================================

export function getStoredSupabaseConfig() {
  try {
    const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
    const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || '';
    return { url: url.trim(), anonKey: anonKey.trim() };
  } catch {
    return { url: '', anonKey: '' };
  }
}

export function saveStoredSupabaseConfig({ url, anonKey }) {
  try {
    if (url) {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    }

    if (anonKey) {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
    }
  } catch (err) {
    console.warn('Failed to save Supabase config to localStorage:', err);
  }
}

/**
 * 從 Vercel Serverless API (/api/supabase-config) 自動取得全域雲端環境變數
 */
export async function fetchServerlessSupabaseConfig() {
  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.supabaseUrl && data.supabaseAnonKey) {
        return {
          url: data.supabaseUrl.trim(),
          anonKey: data.supabaseAnonKey.trim(),
          isServerless: true,
        };
      }
    }
  } catch {
    // 離線或非 Vercel 環境靜默忽略
  }
  return null;
}

/**
 * 依序解析最優 Supabase 連線設定：
 * 1. 使用者於設定手動指定的 LocalStorage 配置
 * 2. Vercel Serverless API (/api/supabase-config)
 * 3. Vite 打包環境變數 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 */
export async function resolveSupabaseConfig() {
  const local = getStoredSupabaseConfig();
  if (local.url && local.anonKey) {
    return { ...local, source: 'local' };
  }

  const serverless = await fetchServerlessSupabaseConfig();
  if (serverless?.url && serverless?.anonKey) {
    return { ...serverless, source: 'serverless' };
  }

  const viteUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const viteKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (viteUrl && viteKey) {
    return { url: viteUrl, anonKey: viteKey, source: 'env' };
  }

  return { url: '', anonKey: '', source: 'none' };
}

/**
 * 初始化或重建 Supabase 客戶端
 */
export function initSupabase(url, anonKey) {
  if (!url || !anonKey) {
    supabaseClient = null;
    currentConfig = { url: '', anonKey: '' };
    return null;
  }

  if (
    supabaseClient &&
    currentConfig.url === url &&
    currentConfig.anonKey === anonKey
  ) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfig = { url, anonKey };
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseClient = null;
    return null;
  }
}

export function getSupabase() {
  return supabaseClient;
}

/**
 * 測試連線與查詢權限
 */
export async function testSupabaseConnection(client = supabaseClient) {
  if (!client) {
    return { success: false, message: '尚未配置 Supabase 網址或金鑰' };
  }
  try {
    const { error } = await client
      .from(SUPABASE_TABLES.CATEGORIES)
      .select('編號', { count: 'exact', head: true });

    if (error) {
      // 若資料表不存在
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: false,
          needsTableSetup: true,
          message: '連線成功，但資料表尚未建立。請點擊「複製建表 SQL」並至 Supabase SQL Editor 執行。',
        };
      }
      return { success: false, message: `查詢失敗：${error.message}` };
    }

    return { success: true, message: '連線成功！即時同步已就緒' };
  } catch (err) {
    return { success: false, message: `網路或連線錯誤：${err.message}` };
  }
}

// ==========================================
// 雲端資料庫操作 (CRUD)
// ==========================================

export async function fetchCategoriesFromSupabase() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLES.CATEGORIES)
      .select('*')
      .order('建立時間', { ascending: true });

    if (error) {
      console.warn('Fetch categories error:', error);
      return null;
    }
    return (data || []).map(fromSupabaseCategory);
  } catch (err) {
    console.warn('Fetch categories exception:', err);
    return null;
  }
}

export async function fetchBookmarksFromSupabase() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLES.BOOKMARKS)
      .select('*')
      .order('建立時間', { ascending: false });

    if (error) {
      console.warn('Fetch bookmarks error:', error);
      return null;
    }
    return (data || []).map(fromSupabaseBookmark);
  } catch (err) {
    console.warn('Fetch bookmarks exception:', err);
    return null;
  }
}

export async function upsertCategoryToSupabase(category) {
  if (!supabaseClient || !category) return false;
  try {
    const payload = toSupabaseCategory(category);
    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.CATEGORIES)
      .upsert(payload, { onConflict: '編號' });
    if (error) {
      console.error('Upsert category failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Upsert category exception:', err);
    return false;
  }
}

export async function deleteCategoryFromSupabase(categoryId) {
  if (!supabaseClient || !categoryId) return false;
  try {
    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.CATEGORIES)
      .delete()
      .eq('編號', categoryId);
    if (error) {
      console.error('Delete category failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete category exception:', err);
    return false;
  }
}

export async function upsertBookmarkToSupabase(bookmark) {
  if (!supabaseClient || !bookmark) return false;
  try {
    const payload = toSupabaseBookmark(bookmark);
    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.BOOKMARKS)
      .upsert(payload, { onConflict: '編號' });
    if (error) {
      console.error('Upsert bookmark failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Upsert bookmark exception:', err);
    return false;
  }
}

export async function deleteBookmarkFromSupabase(bookmarkId) {
  if (!supabaseClient || !bookmarkId) return false;
  try {
    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.BOOKMARKS)
      .delete()
      .eq('編號', bookmarkId);
    if (error) {
      console.error('Delete bookmark failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete bookmark exception:', err);
    return false;
  }
}

/**
 * 批次將本機資料同步至 Supabase（初始化或離線後上傳）
 */
export async function batchUploadAllToSupabase(bookmarks, categories) {
  if (!supabaseClient) {
    throw new Error('Supabase 尚未初始化');
  }

  let catSuccessCount = 0;
  let bmSuccessCount = 0;

  if (categories && categories.length > 0) {
    const catPayloads = categories.map(toSupabaseCategory);
    const { error: catErr } = await supabaseClient
      .from(SUPABASE_TABLES.CATEGORIES)
      .upsert(catPayloads, { onConflict: '編號' });
    if (catErr) {
      throw new Error(`同步分類失敗：${catErr.message}`);
    }
    catSuccessCount = catPayloads.length;
  }

  if (bookmarks && bookmarks.length > 0) {
    const bmPayloads = bookmarks.map(toSupabaseBookmark);
    const { error: bmErr } = await supabaseClient
      .from(SUPABASE_TABLES.BOOKMARKS)
      .upsert(bmPayloads, { onConflict: '編號' });
    if (bmErr) {
      throw new Error(`同步書籤情報失敗：${bmErr.message}`);
    }
    bmSuccessCount = bmPayloads.length;
  }

  return { catSuccessCount, bmSuccessCount };
}

// ==========================================
// Supabase Realtime 即時推播訂閱
// ==========================================

export function subscribeToRealtimeChanges({
  onBookmarkInsert,
  onBookmarkUpdate,
  onBookmarkDelete,
  onCategoryInsert,
  onCategoryUpdate,
  onCategoryDelete,
  onStatusChange,
}) {
  if (!supabaseClient) {
    if (onStatusChange) onStatusChange('OFFLINE');
    return () => {};
  }

  // 若已有活動訂閱，先移除
  if (activeSubscription) {
    try {
      supabaseClient.removeChannel(activeSubscription);
    } catch {
      // 忽略移除例外
    }
    activeSubscription = null;
  }

  const channel = supabaseClient
    .channel('linkvault-sync-channel')
    // 監聽「書籤情報」資料表所有異動
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: SUPABASE_TABLES.BOOKMARKS },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT' && newRow && onBookmarkInsert) {
          onBookmarkInsert(fromSupabaseBookmark(newRow));
        } else if (eventType === 'UPDATE' && newRow && onBookmarkUpdate) {
          onBookmarkUpdate(fromSupabaseBookmark(newRow));
        } else if (eventType === 'DELETE' && oldRow && onBookmarkDelete) {
          onBookmarkDelete(oldRow['編號']);
        }
      }
    )
    // 監聽「知識分類」資料表所有異動
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: SUPABASE_TABLES.CATEGORIES },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT' && newRow && onCategoryInsert) {
          onCategoryInsert(fromSupabaseCategory(newRow));
        } else if (eventType === 'UPDATE' && newRow && onCategoryUpdate) {
          onCategoryUpdate(fromSupabaseCategory(newRow));
        } else if (eventType === 'DELETE' && oldRow && onCategoryDelete) {
          onCategoryDelete(oldRow['編號']);
        }
      }
    )
    .subscribe((status) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

  activeSubscription = channel;

  return () => {
    if (activeSubscription) {
      try {
        supabaseClient.removeChannel(activeSubscription);
      } catch {
        // 忽略
      }
      activeSubscription = null;
    }
  };
}
