/**
 * CloudSync Unified Sync Adapter
 * Seamlessly abstracts and manages multi-cloud persistence across Supabase and Firebase Firestore.
 */

import {
  resolveSupabaseConfig,
  initSupabase,
  fetchCategoriesFromSupabase,
  fetchBookmarksFromSupabase,
  upsertBookmarkToSupabase,
  deleteBookmarkFromSupabase,
  upsertCategoryToSupabase,
  deleteCategoryFromSupabase,
  batchUploadAllToSupabase,
  subscribeToRealtimeChanges,
} from './supabaseService';

import {
  getStoredFirebaseConfig,
  fetchBookmarksFromFirebase,
  fetchCategoriesFromFirebase,
  upsertBookmarkToFirebase,
  deleteBookmarkFromFirebase,
  upsertCategoryToFirebase,
  deleteCategoryFromFirebase,
  batchUploadAllToFirebase,
} from './firebaseService';

export const CLOUD_PROVIDERS = {
  SUPABASE: 'supabase',
  FIREBASE: 'firebase',
};

const STORAGE_KEY_ACTIVE_PROVIDER = 'linkvault_active_cloud_provider';

export function getActiveCloudProvider() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROVIDER);
    if (saved === CLOUD_PROVIDERS.FIREBASE) return CLOUD_PROVIDERS.FIREBASE;
    return CLOUD_PROVIDERS.SUPABASE;
  } catch {
    return CLOUD_PROVIDERS.SUPABASE;
  }
}

export function setActiveCloudProvider(provider) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROVIDER, provider);
  } catch (e) {
    console.warn('[CloudSync] Failed to persist active provider:', e);
  }
}

export async function resolveActiveCloudConfig() {
  const provider = getActiveCloudProvider();
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const fbCfg = getStoredFirebaseConfig();
    const isConfigured = Boolean(fbCfg?.projectId);
    return {
      provider: CLOUD_PROVIDERS.FIREBASE,
      isConfigured,
      config: fbCfg,
    };
  }

  // Supabase (Default)
  const sbCfg = await resolveSupabaseConfig();
  const isConfigured = Boolean(sbCfg.url && sbCfg.anonKey);
  return {
    provider: CLOUD_PROVIDERS.SUPABASE,
    isConfigured,
    config: sbCfg,
  };
}

export async function initActiveCloud(cloudMeta) {
  if (!cloudMeta?.isConfigured) return null;

  if (cloudMeta.provider === CLOUD_PROVIDERS.FIREBASE) {
    return { provider: 'firebase', config: cloudMeta.config };
  }

  // Supabase
  return initSupabase(cloudMeta.config);
}

export async function fetchRemoteData(provider = getActiveCloudProvider()) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const cfg = getStoredFirebaseConfig();
    if (!cfg?.projectId) return { categories: null, bookmarks: null };
    const [bms, cats] = await Promise.all([
      fetchBookmarksFromFirebase(cfg),
      fetchCategoriesFromFirebase(cfg),
    ]);
    return { categories: cats, bookmarks: bms };
  }

  // Supabase
  const [bms, cats] = await Promise.all([
    fetchBookmarksFromSupabase(),
    fetchCategoriesFromSupabase(),
  ]);
  return { categories: cats, bookmarks: bms };
}

export async function batchUploadAll(bookmarks, categories, provider = getActiveCloudProvider()) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const cfg = getStoredFirebaseConfig();
    return batchUploadAllToFirebase(cfg, bookmarks, categories);
  }

  // Supabase
  return batchUploadAllToSupabase(bookmarks, categories);
}

export function subscribeToRemoteRealtime(provider = getActiveCloudProvider(), callbacks = {}) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    // Lightweight polling loop for Firebase Firestore changes
    callbacks.onStatusChange?.('CONNECTED');
    const interval = setInterval(async () => {
      try {
        const cfg = getStoredFirebaseConfig();
        if (cfg?.projectId) {
          const bms = await fetchBookmarksFromFirebase(cfg);
          if (bms && bms.length > 0) {
            callbacks.onBookmarksChange?.(bms);
          }
        }
      } catch (e) {
        // Ignore background polling error
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      callbacks.onStatusChange?.('OFFLINE');
    };
  }

  // Supabase Realtime Subscription
  return subscribeToRealtimeChanges(callbacks);
}

export async function upsertBookmark(bookmark, provider = getActiveCloudProvider()) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const cfg = getStoredFirebaseConfig();
    return upsertBookmarkToFirebase(cfg, bookmark);
  }
  return upsertBookmarkToSupabase(bookmark);
}

export async function deleteBookmark(id, provider = getActiveCloudProvider()) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const cfg = getStoredFirebaseConfig();
    return deleteBookmarkFromFirebase(cfg, id);
  }
  return deleteBookmarkFromSupabase(id);
}

export async function upsertCategory(category, provider = getActiveCloudProvider()) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const cfg = getStoredFirebaseConfig();
    return upsertCategoryToFirebase(cfg, category);
  }
  return upsertCategoryToSupabase(category);
}

export async function deleteCategory(id, provider = getActiveCloudProvider()) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    const cfg = getStoredFirebaseConfig();
    return deleteCategoryFromFirebase(cfg, id);
  }
  return deleteCategoryFromSupabase(id);
}
