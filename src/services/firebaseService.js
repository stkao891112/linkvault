/**
 * Google Firebase Service (Official Firebase SDK v12)
 * Features:
 * - Google Account Authentication (Firebase Auth)
 * - Per-User Data Isolation (Stored under `users/{uid}/bookmarks` and `users/{uid}/categories`)
 * - Realtime Live Sync via Firestore `onSnapshot`
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

export const FIREBASE_STORAGE_KEYS = {
  CONFIG: 'linkvault_firebase_config',
};

// Default fallback config or localStorage
export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_STORAGE_KEYS.CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredFirebaseConfig(config) {
  try {
    localStorage.setItem(FIREBASE_STORAGE_KEYS.CONFIG, JSON.stringify(config || {}));
    // Re-initialize app if config changed
    reinitFirebaseApp(config);
  } catch (e) {
    console.warn('[Firebase] Failed to save config to localStorage:', e);
  }
}

let firebaseAppInstance = null;
let firebaseAuthInstance = null;
let firestoreDbInstance = null;

/**
 * Initialize or get Firebase App, Auth, Firestore
 */
export function getFirebaseInstance(explicitConfig = null) {
  const config = explicitConfig || getStoredFirebaseConfig();
  if (!config || !config.projectId || !config.apiKey) {
    return { app: null, auth: null, db: null };
  }

  try {
    if (!firebaseAppInstance) {
      if (getApps().length > 0) {
        firebaseAppInstance = getApp();
      } else {
        firebaseAppInstance = initializeApp({
          apiKey: config.apiKey.trim(),
          authDomain: config.authDomain?.trim() || `${config.projectId.trim()}.firebaseapp.com`,
          projectId: config.projectId.trim(),
          storageBucket: config.storageBucket?.trim() || `${config.projectId.trim()}.appspot.com`,
          messagingSenderId: config.messagingSenderId?.trim() || '',
          appId: config.appId?.trim() || '',
        });
      }
    }

    if (!firebaseAuthInstance && firebaseAppInstance) {
      firebaseAuthInstance = getAuth(firebaseAppInstance);
      setPersistence(firebaseAuthInstance, browserLocalPersistence).catch(() => {});
    }

    if (!firestoreDbInstance && firebaseAppInstance) {
      firestoreDbInstance = getFirestore(firebaseAppInstance);
    }

    return {
      app: firebaseAppInstance,
      auth: firebaseAuthInstance,
      db: firestoreDbInstance,
    };
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
    return { app: null, auth: null, db: null, error: err };
  }
}

export function reinitFirebaseApp(newConfig) {
  firebaseAppInstance = null;
  firebaseAuthInstance = null;
  firestoreDbInstance = null;
  return getFirebaseInstance(newConfig);
}

/**
 * Test Firebase Connection (Validates config by pinging Firestore / Auth)
 */
export async function testFirebaseConnection(config) {
  if (!config?.projectId || !config?.apiKey) {
    return { success: false, message: '請提供完整的 Project ID 與 Web API Key' };
  }

  try {
    const { db } = reinitFirebaseApp(config);
    if (!db) {
      return { success: false, message: 'Firebase 初始化失敗，請檢查設定欄位' };
    }
    // Attempt lightweight REST query to check project validity
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId.trim()}/databases/(default)/documents?key=${config.apiKey.trim()}`;
    const res = await fetch(url);
    if (res.ok) {
      return {
        success: true,
        message: `成功連線至 Firebase 專案 [${config.projectId}]！`,
      };
    }
    const data = await res.json().catch(() => ({}));
    return {
      success: false,
      message: `連線失敗 (${res.status})：${data.error?.message || '請確認 API Key 與 Project ID'}`,
    };
  } catch (err) {
    return { success: false, message: `網路連線異常：${err.message}` };
  }
}

// ========================================================
// Firebase Authentication (Google Sign-In)
// ========================================================

/**
 * Sign in with Google using popup
 */
export async function loginWithGoogle() {
  const { auth } = getFirebaseInstance();
  if (!auth) {
    throw new Error('Firebase 尚未設定完成，請先在「設定」中填入 Firebase 專案參數！');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
      email: user.email || '',
      photoURL: user.photoURL || '',
    };
  } catch (error) {
    console.error('[Firebase Auth] Login error:', error);
    let friendlyMsg = error.message;

    if (error.code === 'auth/popup-closed-by-user') {
      friendlyMsg = '登入視窗已被關閉，請重新點擊登入';
    } else if (error.code === 'auth/unauthorized-domain') {
      friendlyMsg = `此網域尚未加入 Firebase 白名單！\n請前往 Firebase 控制台 -> Authentication -> Settings -> Authorized domains，新增當前網域 (${window.location.hostname})。`;
    } else if (error.code === 'auth/operation-not-allowed') {
      friendlyMsg = 'Firebase 專案尚未啟用 Google 登入！\n請至 Firebase 控制台 -> Authentication -> Sign-in method 啟用「Google」登入提供者。';
    } else if (error.code === 'auth/configuration-not-found') {
      friendlyMsg = 'Firebase Authentication 設定未完成，請確認 Web API Key 與 Project ID。';
    }

    throw new Error(friendlyMsg);
  }
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebase() {
  const { auth } = getFirebaseInstance();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Subscribe to Auth State changes
 */
export function subscribeToAuth(onUserChange) {
  const { auth } = getFirebaseInstance();
  if (!auth) {
    onUserChange(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      onUserChange({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
        email: user.email || '',
        photoURL: user.photoURL || '',
      });
    } else {
      onUserChange(null);
    }
  });
}

// ========================================================
// Firestore Per-User Isolated Cloud Data Operations
// Path: `users/{userId}/bookmarks/{bookmarkId}`
// Path: `users/{userId}/categories/{categoryId}`
// ========================================================

function getUserBookmarksCollection(db, userId) {
  return collection(db, 'users', userId, 'bookmarks');
}

function getUserCategoriesCollection(db, userId) {
  return collection(db, 'users', userId, 'categories');
}

/**
 * Fetch bookmarks for a specific user
 */
export async function fetchBookmarksFromFirestore(userId) {
  if (!userId) return null;
  const { db } = getFirebaseInstance();
  if (!db) return null;

  try {
    const colRef = getUserBookmarksCollection(db, userId);
    const snap = await getDocs(colRef);
    const items = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });
    return items;
  } catch (err) {
    console.warn('[Firebase] fetchBookmarks error:', err);
    return null;
  }
}

/**
 * Fetch categories for a specific user
 */
export async function fetchCategoriesFromFirestore(userId) {
  if (!userId) return null;
  const { db } = getFirebaseInstance();
  if (!db) return null;

  try {
    const colRef = getUserCategoriesCollection(db, userId);
    const snap = await getDocs(colRef);
    const items = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });
    return items;
  } catch (err) {
    console.warn('[Firebase] fetchCategories error:', err);
    return null;
  }
}

/**
 * Upsert a single bookmark for a specific user
 */
export async function upsertBookmarkToFirestore(userId, bookmark) {
  if (!userId || !bookmark?.id) return;
  const { db } = getFirebaseInstance();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'bookmarks', bookmark.id);
    const payload = {
      id: bookmark.id,
      url: bookmark.url || '',
      title: bookmark.title || '',
      domain: bookmark.domain || '',
      favicon: bookmark.favicon || '',
      categoryId: bookmark.categoryId || 'cat-tools',
      userNote: bookmark.userNote || '',
      aiSummary: bookmark.aiSummary || null,
      tags: bookmark.tags || [],
      isFavorite: Boolean(bookmark.isFavorite),
      status: bookmark.status || 'unread',
      createdAt: bookmark.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('[Firebase] upsertBookmark error:', err);
  }
}

/**
 * Delete a bookmark for a specific user
 */
export async function deleteBookmarkFromFirestore(userId, bookmarkId) {
  if (!userId || !bookmarkId) return;
  const { db } = getFirebaseInstance();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firebase] deleteBookmark error:', err);
  }
}

/**
 * Upsert a single category for a specific user
 */
export async function upsertCategoryToFirestore(userId, category) {
  if (!userId || !category?.id) return;
  const { db } = getFirebaseInstance();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'categories', category.id);
    const payload = {
      id: category.id,
      name: category.name || '',
      color: category.color || '#3b82f6',
      icon: category.icon || 'Layers',
      isSystem: Boolean(category.isSystem),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('[Firebase] upsertCategory error:', err);
  }
}

/**
 * Delete a category for a specific user
 */
export async function deleteCategoryFromFirestore(userId, categoryId) {
  if (!userId || !categoryId) return;
  const { db } = getFirebaseInstance();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firebase] deleteCategory error:', err);
  }
}

/**
 * Batch upload all bookmarks & categories for a user
 */
export async function batchUploadAllToFirestore(userId, bookmarks, categories) {
  if (!userId) {
    return { success: false, message: '請先登入 Google 帳號以進行雲端同步' };
  }
  const { db } = getFirebaseInstance();
  if (!db) {
    return { success: false, message: 'Firebase 資料庫尚未就緒' };
  }

  try {
    const batch = writeBatch(db);

    // Categories
    for (const cat of categories || []) {
      const docRef = doc(db, 'users', userId, 'categories', cat.id);
      batch.set(
        docRef,
        {
          id: cat.id,
          name: cat.name || '',
          color: cat.color || '#3b82f6',
          icon: cat.icon || 'Layers',
          isSystem: Boolean(cat.isSystem),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // Bookmarks
    for (const bm of bookmarks || []) {
      const docRef = doc(db, 'users', userId, 'bookmarks', bm.id);
      batch.set(
        docRef,
        {
          id: bm.id,
          url: bm.url || '',
          title: bm.title || '',
          domain: bm.domain || '',
          favicon: bm.favicon || '',
          categoryId: bm.categoryId || 'cat-tools',
          userNote: bm.userNote || '',
          aiSummary: bm.aiSummary || null,
          tags: bm.tags || [],
          isFavorite: Boolean(bm.isFavorite),
          status: bm.status || 'unread',
          createdAt: bm.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return { success: true, count: (bookmarks || []).length };
  } catch (err) {
    console.error('[Firebase] batchUploadAll error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Realtime Live Firestore Subscription using onSnapshot
 * Completely separate per user!
 */
export function subscribeToFirestoreRealtime(userId, callbacks = {}) {
  if (!userId) {
    callbacks.onStatusChange?.('OFFLINE');
    return () => {};
  }

  const { db } = getFirebaseInstance();
  if (!db) {
    callbacks.onStatusChange?.('OFFLINE');
    return () => {};
  }

  callbacks.onStatusChange?.('CONNECTING');

  let unsubBookmarks = () => {};
  let unsubCategories = () => {};

  try {
    // 1. Listen to Bookmarks subcollection
    const bmCol = getUserBookmarksCollection(db, userId);
    unsubBookmarks = onSnapshot(
      bmCol,
      (snapshot) => {
        callbacks.onStatusChange?.('SUBSCRIBED');
        const bms = [];
        snapshot.forEach((d) => {
          bms.push({ id: d.id, ...d.data() });
        });
        callbacks.onBookmarksChange?.(bms);
      },
      (error) => {
        console.warn('[Firebase Firestore] Bookmarks realtime error:', error);
        callbacks.onStatusChange?.('OFFLINE');
      }
    );

    // 2. Listen to Categories subcollection
    const catCol = getUserCategoriesCollection(db, userId);
    unsubCategories = onSnapshot(
      catCol,
      (snapshot) => {
        const cats = [];
        snapshot.forEach((d) => {
          cats.push({ id: d.id, ...d.data() });
        });
        if (cats.length > 0) {
          callbacks.onCategoriesChange?.(cats);
        }
      },
      (error) => {
        console.warn('[Firebase Firestore] Categories realtime error:', error);
      }
    );

    return () => {
      unsubBookmarks();
      unsubCategories();
      callbacks.onStatusChange?.('OFFLINE');
    };
  } catch (err) {
    console.warn('[Firebase] subscribe exception:', err);
    callbacks.onStatusChange?.('OFFLINE');
    return () => {};
  }
}

export const FIRESTORE_PER_USER_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 每個 Google 帳號的書籤與分類完全獨立隔離，只有本人能讀寫
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
