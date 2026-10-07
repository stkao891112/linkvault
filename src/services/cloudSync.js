/**
 * CloudSync Unified Sync Adapter
 * Seamlessly abstracts and manages multi-cloud persistence across Supabase and Firebase Firestore.
 * Supports per-user data isolation for Google Accounts.
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
  getFirebaseInstance,
  fetchBookmarksFromFirestore,
  fetchCategoriesFromFirestore,
  upsertBookmarkToFirestore,
  deleteBookmarkFromFirestore,
  upsertCategoryToFirestore,
  deleteCategoryFromFirestore,
  batchUploadAllToFirestore,
  subscribeToFirestoreRealtime,
  loginWithGoogle,
  logoutFirebase,
  subscribeToAuth,
  saveUserSettingsToFirestore,
  fetchUserSettingsFromFirestore,
} from './firebaseService';

export const CLOUD_PROVIDERS = {
  SUPABASE: 'supabase',
  FIREBASE: 'firebase',
};

const STORAGE_KEY_ACTIVE_PROVIDER = 'linkvault_active_cloud_provider';

export function getActiveCloudProvider() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROVIDER);
    if (saved === CLOUD_PROVIDERS.SUPABASE) return CLOUD_PROVIDERS.SUPABASE;
    // Default to Firebase if configured or by user choice
    return saved || CLOUD_PROVIDERS.FIREBASE;
  } catch {
    return CLOUD_PROVIDERS.FIREBASE;
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
    const isConfigured = Boolean(fbCfg?.projectId && fbCfg?.apiKey);
    return {
      provider: CLOUD_PROVIDERS.FIREBASE,
      isConfigured,
      config: fbCfg,
    };
  }

  // Supabase
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
    const { app } = getFirebaseInstance(cloudMeta.config);
    return app ? { provider: 'firebase', config: cloudMeta.config } : null;
  }

  // Supabase
  return initSupabase(cloudMeta.config);
}

/**
 * Fetch remote data:
 * If Firebase, requires userId (Google user UID) to isolate accounts.
 */
export async function fetchRemoteData(provider = getActiveCloudProvider(), userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) return { categories: null, bookmarks: null };
    const [bms, cats] = await Promise.all([
      fetchBookmarksFromFirestore(userId),
      fetchCategoriesFromFirestore(userId),
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

/**
 * Batch upload data to cloud
 */
export async function batchUploadAll(bookmarks, categories, provider = getActiveCloudProvider(), userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) return { success: false, message: '請先登入 Google 帳號' };
    return batchUploadAllToFirestore(userId, bookmarks, categories);
  }

  // Supabase
  return batchUploadAllToSupabase(bookmarks, categories);
}

/**
 * Realtime subscription with live callbacks
 */
export function subscribeToRemoteRealtime(provider = getActiveCloudProvider(), callbacks = {}, userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) {
      callbacks.onStatusChange?.('OFFLINE');
      return () => {};
    }
    return subscribeToFirestoreRealtime(userId, callbacks);
  }

  // Supabase Realtime Subscription
  return subscribeToRealtimeChanges(callbacks);
}

/**
 * CRUD with Per-User Firestore Support
 */
export async function upsertBookmark(bookmark, provider = getActiveCloudProvider(), userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) return;
    return upsertBookmarkToFirestore(userId, bookmark);
  }
  return upsertBookmarkToSupabase(bookmark);
}

export async function deleteBookmark(id, provider = getActiveCloudProvider(), userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) return;
    return deleteBookmarkFromFirestore(userId, id);
  }
  return deleteBookmarkFromSupabase(id);
}

export async function upsertCategory(category, provider = getActiveCloudProvider(), userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) return;
    return upsertCategoryToFirestore(userId, category);
  }
  return upsertCategoryToSupabase(category);
}

export async function deleteCategory(id, provider = getActiveCloudProvider(), userId = null) {
  if (provider === CLOUD_PROVIDERS.FIREBASE) {
    if (!userId) return;
    return deleteCategoryFromFirestore(userId, id);
  }
  return deleteCategoryFromSupabase(id);
}

export async function saveUserSettings(userId, settings) {
  return saveUserSettingsToFirestore(userId, settings);
}

export async function fetchUserSettings(userId) {
  return fetchUserSettingsFromFirestore(userId);
}

export { loginWithGoogle, logoutFirebase, subscribeToAuth };
