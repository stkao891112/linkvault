/**
 * Firebase Firestore REST Client Service (Zero NPM Dependency)
 * Provides seamless connection testing, data sync, and persistence using standard Firestore v1 REST API.
 */

export const FIREBASE_STORAGE_KEYS = {
  CONFIG: 'linkvault_firebase_config',
};

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
  } catch (e) {
    console.warn('[Firebase] Failed to save config to localStorage:', e);
  }
}

/**
 * Test Firebase Firestore connection via Firestore REST API
 */
export async function testFirebaseConnection(config) {
  if (!config?.projectId) {
    return { success: false, message: '請輸入 Firebase Project ID' };
  }

  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents${
    apiKey ? `?key=${apiKey}` : ''
  }`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      return { success: true, message: `成功連線至 Firebase 專案 [${projectId}]！` };
    }
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: `連線失敗 (${res.status})：${errData.error?.message || '請確認安全性規則與 Project ID'}`,
    };
  } catch (err) {
    return { success: false, message: `網路連線異常：${err.message}` };
  }
}

/**
 * Fetch bookmarks from Firestore REST
 */
export async function fetchBookmarksFromFirebase(config) {
  if (!config?.projectId) return null;
  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/bookmarks?pageSize=300${
    apiKey ? `&key=${apiKey}` : ''
  }`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const documents = data.documents || [];
    return documents.map((doc) => {
      const fields = doc.fields || {};
      const id = doc.name.split('/').pop();
      return {
        id: fields.id?.stringValue || id,
        url: fields.url?.stringValue || '',
        title: fields.title?.stringValue || '',
        domain: fields.domain?.stringValue || '',
        favicon: fields.favicon?.stringValue || '',
        categoryId: fields.categoryId?.stringValue || 'cat-tools',
        userNote: fields.userNote?.stringValue || '',
        aiSummary: fields.aiSummaryJson?.stringValue
          ? JSON.parse(fields.aiSummaryJson.stringValue)
          : null,
        tags: (fields.tags?.arrayValue?.values || []).map((v) => v.stringValue),
        isFavorite: Boolean(fields.isFavorite?.booleanValue),
        status: fields.status?.stringValue || 'unread',
        createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('[Firebase] fetchBookmarks error:', err);
    return null;
  }
}

/**
 * Fetch categories from Firestore REST
 */
export async function fetchCategoriesFromFirebase(config) {
  if (!config?.projectId) return null;
  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories?pageSize=100${
    apiKey ? `&key=${apiKey}` : ''
  }`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const documents = data.documents || [];
    return documents.map((doc) => {
      const fields = doc.fields || {};
      const id = doc.name.split('/').pop();
      return {
        id: fields.id?.stringValue || id,
        name: fields.name?.stringValue || '',
        color: fields.color?.stringValue || '#3b82f6',
        icon: fields.icon?.stringValue || 'Layers',
        isSystem: Boolean(fields.isSystem?.booleanValue),
      };
    });
  } catch (err) {
    console.warn('[Firebase] fetchCategories error:', err);
    return null;
  }
}

/**
 * Upsert bookmark into Firestore REST
 */
export async function upsertBookmarkToFirebase(config, bookmark) {
  if (!config?.projectId || !bookmark?.id) return;
  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const docId = encodeURIComponent(bookmark.id);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/bookmarks/${docId}${
    apiKey ? `?key=${apiKey}` : ''
  }`;

  const body = {
    fields: {
      id: { stringValue: bookmark.id },
      url: { stringValue: bookmark.url || '' },
      title: { stringValue: bookmark.title || '' },
      domain: { stringValue: bookmark.domain || '' },
      favicon: { stringValue: bookmark.favicon || '' },
      categoryId: { stringValue: bookmark.categoryId || 'cat-tools' },
      userNote: { stringValue: bookmark.userNote || '' },
      aiSummaryJson: { stringValue: JSON.stringify(bookmark.aiSummary || {}) },
      tags: {
        arrayValue: {
          values: (bookmark.tags || []).map((t) => ({ stringValue: t })),
        },
      },
      isFavorite: { booleanValue: Boolean(bookmark.isFavorite) },
      status: { stringValue: bookmark.status || 'unread' },
      createdAt: { stringValue: bookmark.createdAt || new Date().toISOString() },
    },
  };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[Firebase] upsertBookmark error:', err);
  }
}

/**
 * Delete bookmark from Firestore REST
 */
export async function deleteBookmarkFromFirebase(config, id) {
  if (!config?.projectId || !id) return;
  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const docId = encodeURIComponent(id);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/bookmarks/${docId}${
    apiKey ? `?key=${apiKey}` : ''
  }`;

  try {
    await fetch(url, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Firebase] deleteBookmark error:', err);
  }
}

/**
 * Upsert category into Firestore REST
 */
export async function upsertCategoryToFirebase(config, category) {
  if (!config?.projectId || !category?.id) return;
  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const docId = encodeURIComponent(category.id);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories/${docId}${
    apiKey ? `?key=${apiKey}` : ''
  }`;

  const body = {
    fields: {
      id: { stringValue: category.id },
      name: { stringValue: category.name || '' },
      color: { stringValue: category.color || '#3b82f6' },
      icon: { stringValue: category.icon || 'Layers' },
      isSystem: { booleanValue: Boolean(category.isSystem) },
    },
  };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[Firebase] upsertCategory error:', err);
  }
}

/**
 * Delete category from Firestore REST
 */
export async function deleteCategoryFromFirebase(config, id) {
  if (!config?.projectId || !id) return;
  const projectId = config.projectId.trim();
  const apiKey = config.apiKey?.trim();
  const docId = encodeURIComponent(id);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories/${docId}${
    apiKey ? `?key=${apiKey}` : ''
  }`;

  try {
    await fetch(url, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Firebase] deleteCategory error:', err);
  }
}

/**
 * Batch upload all to Firebase
 */
export async function batchUploadAllToFirebase(config, bookmarks, categories) {
  if (!config?.projectId) return { success: false, message: 'Firebase 未設定' };
  try {
    for (const cat of categories || []) {
      await upsertCategoryToFirebase(config, cat);
    }
    for (const bm of bookmarks || []) {
      await upsertBookmarkToFirebase(config, bm);
    }
    return { success: true, count: (bookmarks || []).length };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
