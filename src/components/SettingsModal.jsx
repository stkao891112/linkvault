import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Key,
  Check,
  AlertCircle,
  FileJson,
  Cpu,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  CheckCircle2,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import {
  SUPABASE_SETUP_SQL,
  testSupabaseConnection,
} from '../services/supabaseService';
import {
  testFirebaseConnection,
  saveStoredFirebaseConfig,
  getStoredFirebaseConfig,
  FIRESTORE_PER_USER_RULES,
} from '../services/firebaseService';
import {
  CLOUD_PROVIDERS,
  getActiveCloudProvider,
  setActiveCloudProvider,
} from '../services/cloudSync';
import {
  fetchAvailableModels,
  DEFAULT_PROVIDER_MODELS,
} from '../services/aiService';

export default function SettingsModal({
  isOpen,
  onClose,
  bookmarks,
  categories,
  onImportData,
  onResetData,
  customApiKey,
  setCustomApiKey,
  apiProvider,
  setApiProvider,
  customBaseUrl = '',
  setCustomBaseUrl = () => {},
  customModel = '',
  setCustomModel = () => {},
  firebaseConfig = {},
  onSaveFirebaseConfig = () => {},
  activeCloudProvider = 'firebase',
  setActiveCloudProvider = () => {},
  cloudSyncStatus = 'OFFLINE',
  supabaseConfig = { url: '', anonKey: '', source: 'none' },
  supabaseSyncStatus = 'OFFLINE',
  onSaveSupabaseConfig = () => {},
  onManualSyncToCloud = () => {},
  currentUser = null,
  onGoogleLogin = () => {},
  onGoogleLogout = () => {},
}) {
  // Active Tab: sync | ai | backup
  const [activeTab, setActiveTab] = useState('sync');

  // Cloud Provider: firebase | supabase
  const [cloudProvider, setCloudProvider] = useState(() => getActiveCloudProvider());

  // Firebase State
  const [tempFirebaseConfig, setTempFirebaseConfig] = useState(() => {
    const saved = getStoredFirebaseConfig();
    return saved || {
      apiKey: '',
      projectId: '',
      appId: '',
      authDomain: '',
      storageBucket: '',
      messagingSenderId: '',
    };
  });
  const [firebasePasteInput, setFirebasePasteInput] = useState('');
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState(null);
  const [firebaseSaveSuccess, setFirebaseSaveSuccess] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  // Supabase State
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState(supabaseConfig.url || '');
  const [tempSupabaseAnonKey, setTempSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState(null);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [syncToCloudResult, setSyncToCloudResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseSaveSuccess, setSupabaseSaveSuccess] = useState(false);

  // AI Settings State
  const [tempApiKey, setTempApiKey] = useState(customApiKey || '');
  const [tempProvider, setTempProvider] = useState(apiProvider || 'gemini');
  const [tempBaseUrl, setTempBaseUrl] = useState(customBaseUrl || '');
  const [tempModel, setTempModel] = useState(customModel || 'gemini-2.0-flash');
  const [isCustomModelInput, setIsCustomModelInput] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  // Dynamic Model Fetching State (Strictly No Manual Typing)
  const [availableModels, setAvailableModels] = useState(() => {
    return DEFAULT_PROVIDER_MODELS[apiProvider] || DEFAULT_PROVIDER_MODELS.gemini;
  });
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelFetchMessage, setModelFetchMessage] = useState(null);

  // Sync temp state with props when modal opens or props change
  useEffect(() => {
    setTempSupabaseUrl(supabaseConfig.url || '');
    setTempSupabaseAnonKey(supabaseConfig.anonKey || '');
  }, [supabaseConfig]);

  useEffect(() => {
    setTempApiKey(customApiKey || '');
    setTempProvider(apiProvider || 'gemini');
    setTempBaseUrl(customBaseUrl || '');
    const modelToSet = customModel || (apiProvider === 'gemini' ? 'gemini-2.0-flash' : '');
    setTempModel(modelToSet);

    const defaults = DEFAULT_PROVIDER_MODELS[apiProvider || 'gemini'] || [];
    if (modelToSet && !defaults.some((m) => m.id === modelToSet)) {
      setIsCustomModelInput(true);
    }
  }, [customApiKey, apiProvider, customBaseUrl, customModel]);

  // Load models dynamically or from presets
  const handleFetchModels = async (provider = tempProvider, key = tempApiKey, base = tempBaseUrl) => {
    setIsFetchingModels(true);
    setModelFetchMessage(null);
    try {
      const list = await fetchAvailableModels({
        provider,
        apiKey: key,
        baseUrl: base,
      });

      if (list && list.length > 0) {
        setAvailableModels(list);
        const exists = list.some((m) => m.id === tempModel);
        if (!exists) {
          setTempModel(list[0].id);
        }
        setModelFetchMessage({
          type: 'success',
          text: `成功獲取 ${list.length} 個可用模型！`,
        });
      }
    } catch (err) {
      console.warn('Fetch models error:', err);
      const fallback = DEFAULT_PROVIDER_MODELS[provider] || [];
      setAvailableModels(fallback);
      setModelFetchMessage({
        type: 'error',
        text: err.message || '獲取模型失敗，已載入預設常用模型選單',
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  // When switching provider in modal, refresh the model list
  const handleProviderChange = (newProvider) => {
    setTempProvider(newProvider);
    const defaults = DEFAULT_PROVIDER_MODELS[newProvider] || [];
    setAvailableModels(defaults);
    if (defaults.length > 0) {
      setTempModel(defaults[0].id);
    }

    if (newProvider === 'gemini' && tempApiKey) {
      handleFetchModels(newProvider, tempApiKey, tempBaseUrl);
    } else if (newProvider === 'custom') {
      handleFetchModels(newProvider, tempApiKey, tempBaseUrl || 'http://localhost:11434/v1');
    }
  };

  const handleSaveApiSettings = (e) => {
    e.preventDefault();
    setCustomApiKey(tempApiKey.trim());
    setApiProvider(tempProvider);
    setCustomBaseUrl(tempBaseUrl.trim());
    setCustomModel(tempModel.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Parse Firebase Config Snippet
  const handleParseFirebaseSnippet = (text) => {
    setFirebasePasteInput(text);
    if (!text || !text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      if (parsed?.apiKey && parsed?.projectId) {
        setTempFirebaseConfig((prev) => ({ ...prev, ...parsed }));
        return;
      }
    } catch {}

    const apiKeyMatch = text.match(/apiKey["']?\s*:\s*["']([^"']+)["']/);
    const projectIdMatch = text.match(/projectId["']?\s*:\s*["']([^"']+)["']/);
    const appIdMatch = text.match(/appId["']?\s*:\s*["']([^"']+)["']/);
    const authDomainMatch = text.match(/authDomain["']?\s*:\s*["']([^"']+)["']/);
    const storageBucketMatch = text.match(/storageBucket["']?\s*:\s*["']([^"']+)["']/);
    const messagingSenderIdMatch = text.match(/messagingSenderId["']?\s*:\s*["']([^"']+)["']/);

    if (apiKeyMatch || projectIdMatch) {
      setTempFirebaseConfig((prev) => ({
        ...prev,
        apiKey: apiKeyMatch ? apiKeyMatch[1] : prev.apiKey,
        projectId: projectIdMatch ? projectIdMatch[1] : prev.projectId,
        appId: appIdMatch ? appIdMatch[1] : prev.appId,
        authDomain: authDomainMatch ? authDomainMatch[1] : prev.authDomain,
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : prev.storageBucket,
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : prev.messagingSenderId,
      }));
    }
  };

  // Save Firebase Configuration
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    onSaveFirebaseConfig(tempFirebaseConfig);
    setFirebaseSaveSuccess(true);
    setTimeout(() => setFirebaseSaveSuccess(false), 2500);

    if (tempFirebaseConfig.apiKey && tempFirebaseConfig.projectId) {
      handleTestFirebase(tempFirebaseConfig);
    }
  };

  // Test Firebase Connection
  const handleTestFirebase = async (config = tempFirebaseConfig) => {
    setIsTestingFirebase(true);
    setFirebaseTestResult(null);
    try {
      const res = await testFirebaseConnection(config, currentUser?.uid);
      setFirebaseTestResult(res);
    } catch (err) {
      setFirebaseTestResult({
        success: false,
        message: `連線失敗：${err.message || '請確認 API Key 與安全性規則'}`,
      });
    } finally {
      setIsTestingFirebase(false);
    }
  };

  // Batch Push Local Data to Firebase for Current Google User
  const handlePushAllToFirebase = async () => {
    if (!currentUser) {
      alert('請先登入 Google 帳號！');
      return;
    }
    setIsSyncingToCloud(true);
    setFirebaseTestResult(null);
    try {
      const res = await onManualSyncToCloud();
      setFirebaseTestResult({
        success: true,
        message: `✨ 已成功將本機 ${bookmarks.length} 筆書籤與 ${categories.length} 個分類推播至 Google 帳號 (${currentUser.email}) 專屬雲端庫！`,
      });
    } catch (err) {
      setFirebaseTestResult({
        success: false,
        message: `同步失敗：${err.message}`,
      });
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  // Copy Firestore Security Rules
  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_PER_USER_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  // Save Supabase Configuration
  const handleSaveSupabase = async (e) => {
    e.preventDefault();
    const url = tempSupabaseUrl.trim();
    const key = tempSupabaseAnonKey.trim();
    onSaveSupabaseConfig(url, key);
    setSupabaseSaveSuccess(true);
    setTimeout(() => setSupabaseSaveSuccess(false), 2500);

    if (url && key) {
      handleTestSupabase(url, key);
    }
  };

  // Test Supabase Connection
  const handleTestSupabase = async (url = tempSupabaseUrl, key = tempSupabaseAnonKey) => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(url.trim(), key.trim(), {
        auth: { persistSession: false },
      });
      const result = await testSupabaseConnection(testClient);
      setSupabaseTestResult(result);
    } catch (err) {
      setSupabaseTestResult({
        success: false,
        message: `連線失敗：${err.message}`,
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  // Batch Push Local Data to Supabase
  const handlePushAllToCloud = async () => {
    if (!tempSupabaseUrl || !tempSupabaseAnonKey) {
      alert('請先填寫並儲存 Supabase 網址與 Anon Key！');
      return;
    }
    setIsSyncingToCloud(true);
    setSyncToCloudResult(null);
    try {
      const res = await onManualSyncToCloud();
      setSyncToCloudResult({
        success: true,
        message: `已成功同步 ${res?.bmSuccessCount ?? bookmarks.length} 筆書籤與 ${res?.catSuccessCount ?? categories.length} 個分類至 Supabase 雲端！`,
      });
    } catch (err) {
      setSyncToCloudResult({
        success: false,
        message: `同步失敗：${err.message}`,
      });
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  // Copy SQL to Clipboard
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // JSON Export
  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      categories,
      bookmarks,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LinkVault-AI-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Import
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
          onImportData(parsed.bookmarks, parsed.categories || categories);
          setImportError('');
          alert('資料匯入成功！');
          onClose();
        } else {
          setImportError('匯入格式不正確，找不到 bookmarks 陣列');
        }
      } catch (err) {
        setImportError('無法解析 JSON 檔案，請確認格式');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-2xl w-full max-h-[94vh] sm:max-h-[88vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">情報庫設定與同步中心</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Supabase 跨裝置雙向即時同步、AI 模型調配與資料備份
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sync'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>雲端即時同步 (Supabase)</span>
            {supabaseSyncStatus === 'SUBSCRIBED' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI 分析引擎與模型選擇</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON 備份與還原</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs">
          
          {/* TAB 1: Supabase Realtime Cloud Sync */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              
              {/* Sync Status Banner */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      supabaseSyncStatus === 'SUBSCRIBED'
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
                        : supabaseSyncStatus === 'CONNECTED'
                        ? 'bg-blue-950/80 border border-blue-500/40 text-blue-400'
                        : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {supabaseSyncStatus === 'SUBSCRIBED' ? (
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">
                        {supabaseSyncStatus === 'SUBSCRIBED'
                          ? '🟢 雲端雙向即時同步中 (Realtime Active)'
                          : supabaseSyncStatus === 'CONNECTED'
                          ? '🟡 雲端連線就緒 (Connected)'
                          : '⚪ 本地離線模式 (Local-First Offline)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {supabaseSyncStatus === 'SUBSCRIBED'
                        ? '電腦與手機端只要有任何新增、收藏或刪除，另一端無需刷新即刻秒級同步！'
                        : '未連線時所有變更安全保存在本機，連線後自動上傳未同步資料。'}
                    </p>
                  </div>
                </div>

                {supabaseConfig.source === 'serverless' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 shrink-0 hidden sm:inline-block">
                    由 Vercel 雲端環境變數自動載入
                  </span>
                )}
              </div>

              {/* Cloud Provider Tabs */}
              <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setCloudProvider('firebase');
                    setActiveCloudProvider('firebase');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    cloudProvider === 'firebase'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🔥 Google Firebase (推薦 · 免費用量高無上限)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCloudProvider('supabase');
                    setActiveCloudProvider('supabase');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    cloudProvider === 'supabase'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⚡ Supabase PostgreSQL</span>
                </button>
              </div>

              {cloudProvider === 'firebase' ? (
                <>
                  {/* Google Account Authentication & Per-User Isolation Banner */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Google 帳號登入與各帳號獨立資料隔離</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        每個帳號各自獨立 · 互不混淆
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      透過 Google 帳號登入，系統會自動在 Firestore 的 <code className="text-amber-300 px-1 py-0.5 rounded bg-slate-950 font-mono">users/&#123;你的Google UID&#125;/</code> 專屬目錄下建立書籤與分類，完全切分不同 Google 帳號的資料！
                    </p>

                    {currentUser ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="Google User"
                              className="w-10 h-10 rounded-full border-2 border-emerald-500/50 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                              {(currentUser.displayName || 'G').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{currentUser.displayName}</span>
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                雲端即時同步中
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{currentUser.email}</div>
                            <div className="text-[10px] text-slate-500 font-mono">UID: {currentUser.uid}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={onGoogleLogout}
                            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>登出此 Google 帳號</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-amber-500/20">
                        <div className="text-[11px] text-slate-300">
                          <div className="font-semibold text-slate-200 mb-0.5">尚未登入 Google 帳號 (目前為本機離線模式)</div>
                          <span>點擊右側按鈕使用 Google 帳號登入，即可開啟專屬雲端資料庫並自動秒級同步。</span>
                        </div>
                        <button
                          type="button"
                          onClick={onGoogleLogin}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                          <span>使用 Google 帳號登入</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Firebase Cloud Firestore Config Form */}
                  <form onSubmit={handleSaveFirebase} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-amber-400" />
                        <span>Google Firebase (Cloud Firestore & Auth) 專案設定</span>
                      </div>
                      <span className="text-[11px] text-amber-400/90 font-medium">
                        免費額度每日 50,000 次讀取 · 不受 2 個資料庫上限限制
                      </span>
                    </div>

                    {/* Smart Paste Block */}
                    <div className="p-3 bg-slate-900/60 border border-amber-500/20 rounded-xl space-y-1.5">
                      <label className="block font-semibold text-amber-300 text-[11px] flex items-center justify-between">
                        <span>✨ 智慧快速貼上 (直接貼上 Firebase SDK 程式碼片段或 JSON)</span>
                        <a
                          href="https://console.firebase.google.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                        >
                          開啟 Firebase 控制台 <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                      </label>
                      <textarea
                        rows={3}
                        placeholder={'在此貼上 const firebaseConfig = { apiKey: "...", projectId: "..." }; 系統將自動辨識各欄位！'}
                        value={firebasePasteInput}
                        onChange={(e) => handleParseFirebaseSnippet(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-[11px] text-slate-200 focus:ring-2 focus:ring-amber-500/20 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-400 mb-1">
                          Project ID (專案 ID) <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例如 linkvault-app"
                          value={tempFirebaseConfig.projectId || ''}
                          onChange={(e) => setTempFirebaseConfig((prev) => ({ ...prev, projectId: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-400 mb-1">
                          Web API Key <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="AIzaSy..."
                          value={tempFirebaseConfig.apiKey || ''}
                          onChange={(e) => setTempFirebaseConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-400 mb-1">
                          App ID (應用程式 ID)
                        </label>
                        <input
                          type="text"
                          placeholder="1:123456789:web:abcdef..."
                          value={tempFirebaseConfig.appId || ''}
                          onChange={(e) => setTempFirebaseConfig((prev) => ({ ...prev, appId: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-400 mb-1">
                          Auth Domain (認證網域)
                        </label>
                        <input
                          type="text"
                          placeholder="your-project.firebaseapp.com"
                          value={tempFirebaseConfig.authDomain || ''}
                          onChange={(e) => setTempFirebaseConfig((prev) => ({ ...prev, authDomain: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>

                    {/* Status Feedback */}
                    {firebaseTestResult && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          firebaseTestResult.success
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        }`}
                      >
                        {firebaseTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div>{firebaseTestResult.message}</div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isTestingFirebase || !tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId}
                          onClick={() => handleTestFirebase()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                          <span>{isTestingFirebase ? '測試中...' : '測試 Firebase 連線'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSyncingToCloud || !currentUser}
                          onClick={handlePushAllToFirebase}
                          className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 disabled:opacity-50 border border-amber-500/40 text-amber-300 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className={`w-3.5 h-3.5 ${isSyncingToCloud ? 'animate-spin' : ''}`} />
                          <span>{isSyncingToCloud ? '同步上傳中...' : '一鍵推播本機全部資料到當前帳號'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {firebaseSaveSuccess && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 已儲存
                          </span>
                        )}
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-lg font-bold transition-colors shadow-lg shadow-amber-500/25 cursor-pointer"
                        >
                          儲存 Firebase 設定
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Firebase Rules Helper */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cloud Firestore 各帳號獨立安全性規則 (Security Rules)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyRules}
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer"
                      >
                        {copiedRules ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>已複製到剪貼簿！</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>一鍵複製各帳號隔離規則</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      前往 Firebase 控制台 ➔ 點擊左側 <strong>Firestore Database</strong> ➔ 點選 <strong>Rules (規則)</strong> 標籤，貼上以下規則並發布。此規則確保<strong>只有登入者本人能讀寫自己的書籤與分類</strong>，完全保護各帳號隱私：
                    </p>
                    <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-amber-300/90 leading-relaxed overflow-x-auto">
{FIRESTORE_PER_USER_RULES}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  {/* Supabase Config Form */}
                  <form onSubmit={handleSaveSupabase} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Supabase 雲端資料庫設定</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        採用繁體中文資料表：<code className="text-indigo-300 font-mono">書籤情報</code>、<code className="text-indigo-300 font-mono">知識分類</code>
                      </span>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-400 mb-1">
                        Supabase 專案網址 (Project URL)
                      </label>
                      <input
                        type="text"
                        placeholder="https://your-project-id.supabase.co"
                        value={tempSupabaseUrl}
                        onChange={(e) => setTempSupabaseUrl(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-400 mb-1">
                        Supabase 匿名金鑰 (Anon Public Key)
                      </label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={tempSupabaseAnonKey}
                        onChange={(e) => setTempSupabaseAnonKey(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        提示：在 Vercel 專案設定 <code className="text-indigo-300 font-mono">SUPABASE_URL</code> 與 <code className="text-indigo-300 font-mono">SUPABASE_ANON_KEY</code>，手機與電腦即全自動免輸入！
                      </p>
                    </div>

                    {/* Status Feedback */}
                    {supabaseTestResult && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          supabaseTestResult.success
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        }`}
                      >
                        {supabaseTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div>{supabaseTestResult.message}</div>
                      </div>
                    )}

                    {syncToCloudResult && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                          syncToCloudResult.success
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{syncToCloudResult.message}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isTestingSupabase || !tempSupabaseUrl || !tempSupabaseAnonKey}
                          onClick={() => handleTestSupabase()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                          <span>{isTestingSupabase ? '測試中...' : '測試連線'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSyncingToCloud || !tempSupabaseUrl || !tempSupabaseAnonKey}
                          onClick={handlePushAllToCloud}
                          className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className={`w-3.5 h-3.5 ${isSyncingToCloud ? 'animate-spin' : ''}`} />
                          <span>{isSyncingToCloud ? '同步上傳中...' : '一鍵推播本機全部資料到 Supabase'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {supabaseSaveSuccess && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 已儲存
                          </span>
                        )}
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
                        >
                          儲存連線設定
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Supabase Schema SQL Setup Section */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-indigo-400" />
                        <span>繁體中文建表與 Realtime 廣播 SQL</span>
                      </div>
                      <button
                        onClick={handleCopySql}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>已複製到剪貼簿！</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>一鍵複製 Supabase 建表 SQL</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-slate-400 leading-relaxed">
                      若您是首次配置 Supabase 專案，請前往{' '}
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        Supabase 後台 <ExternalLink className="w-3 h-3 inline" />
                      </a>
                      ，點擊左側選單的 <strong>SQL Editor</strong>，點擊上方按鈕複製 SQL 腳本並貼上執行，即可自動建立繁體中文「書籤情報」與「知識分類」資料表，並啟用跨裝置秒級推播！
                    </p>

                    <div className="relative">
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto leading-relaxed">
                        {SUPABASE_SETUP_SQL}
                      </pre>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 2: AI Engine & Dynamic Models */}
          {activeTab === 'ai' && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI 分析引擎與模型調配</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Gemini 2.0 Flash • 多裝置自動同步
                </span>
              </div>

              <p className="text-slate-400 leading-relaxed text-xs">
                預設首選次世代 <code className="text-amber-300 font-mono">gemini-2.0-flash</code>（內建 1.5-flash 自動容錯降級）。在此處填寫或切換 AI 提供商與金鑰後，<strong>所有登入同帳號的裝置（手機、平板、電腦）將全自動即時同步</strong>！
              </p>

              <form onSubmit={handleSaveApiSettings} className="space-y-3 pt-1">
                <div>
                  <label className="block font-medium text-slate-400 mb-1">
                    選擇 AI 供應商
                  </label>
                  <select
                    value={tempProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none text-slate-200 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="gemini">Google Gemini (Vercel 伺服器代跑 / 個人金鑰)</option>
                    <option value="custom">自訂端點 (本地 Ollama / LM Studio / 自建代理)</option>
                    <option value="openai">OpenAI (GPT-4o / o1 / o3 系列)</option>
                    <option value="groq">Groq (Llama 3.3 70B 極速推論)</option>
                    <option value="openrouter">OpenRouter (海量大模型匯流代理)</option>
                    <option value="mock">內建本地智慧分析引擎 (無需 API Key，純本機零延遲)</option>
                  </select>
                </div>

                {/* Custom Base URL for Local Ollama / LM Studio */}
                {tempProvider === 'custom' && (
                  <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-medium text-indigo-400">
                          API 基礎網址 (Base URL)
                        </label>
                        <span className="text-[11px] text-slate-500">
                          例：http://localhost:11434/v1
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="http://localhost:11434/v1 或 http://localhost:1234/v1"
                        value={tempBaseUrl}
                        onChange={(e) => setTempBaseUrl(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                )}

                {/* API Key Input */}
                {tempProvider !== 'mock' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-slate-400">
                        API 金鑰 (API Key)
                      </label>
                      {tempProvider === 'gemini' && (
                        <span className="text-[11px] text-emerald-400">選填：未填寫時由 Vercel GEMINI_API_KEY 代跑</span>
                      )}
                      {tempProvider === 'custom' && (
                        <span className="text-[11px] text-slate-500">本地 Ollama / LM Studio 可留空</span>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder={
                        tempProvider === 'gemini'
                          ? '選填：AIzaSy...（填寫個人金鑰可動態抓取您帳號下的所有模型）'
                          : tempProvider === 'custom'
                          ? '選填，本地模型留空即可'
                          : 'sk-...'
                      }
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700/80 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                {/* DYNAMIC MODEL SELECT DROPDOWN / MANUAL INPUT */}
                {tempProvider !== 'mock' && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>AI 模型選擇</span>
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCustomModelInput(!isCustomModelInput)}
                          className="text-[11px] text-indigo-300 hover:text-indigo-200 hover:underline cursor-pointer transition-colors"
                        >
                          {isCustomModelInput ? '📋 切換清單選單' : '✏️ 手動填寫模型號'}
                        </button>
                        {!isCustomModelInput && (
                          <button
                            type="button"
                            disabled={isFetchingModels}
                            onClick={() => handleFetchModels(tempProvider, tempApiKey, tempBaseUrl)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                            <span>{isFetchingModels ? '正在偵測...' : '🔄 獲取/更新模型清單'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isCustomModelInput ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="例如：gemini-3.8-flash, gemini-3.8-pro, 或自訂/實驗模型"
                          value={tempModel}
                          onChange={(e) => setTempModel(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <p className="text-[11px] text-slate-500">
                          支援自由輸入 Google Gemini 或其他供應商之特殊/實驗型模型號。
                        </p>
                      </div>
                    ) : (
                      <select
                        value={tempModel}
                        onChange={(e) => setTempModel(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        {availableModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.id}
                          </option>
                        ))}
                      </select>
                    )}

                    {modelFetchMessage && !isCustomModelInput && (
                      <div
                        className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                          modelFetchMessage.type === 'success'
                            ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-800/40'
                            : 'text-amber-300 bg-amber-950/40 border border-amber-800/40'
                        }`}
                      >
                        {modelFetchMessage.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        )}
                        <span>{modelFetchMessage.text}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">
                      當前已選定：<code className="text-indigo-300 font-mono font-semibold">{tempModel || 'gemini-2.0-flash'}</code>
                      {tempProvider === 'gemini' && '（內建 2.0-flash ➔ 1.5-flash 自動容錯降級，已開啟跨裝置即時同步）'}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {saveSuccess ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 已成功儲存 AI 設定
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
                  >
                    儲存 AI 設定
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Backup & Export / Import */}
          {activeTab === 'backup' && (
            <div className="space-y-3">
              <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                <span>本機 JSON 備份與還原</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export JSON */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-200">匯出完整 JSON 備份</div>
                    <p className="text-slate-400 mt-0.5">
                      將目前的 {bookmarks.length} 筆收藏與所有分類完整打包下載。
                    </p>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載備份檔案 (.json)</span>
                  </button>
                </div>

                {/* Import JSON */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-200">匯入 JSON 備份</div>
                    <p className="text-slate-400 mt-0.5">
                      還原過往備份的情報庫檔案或與其他設備同步。
                    </p>
                  </div>
                  <label className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>選擇 JSON 檔案匯入</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {importError && (
                <div className="text-rose-300 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Reset to Seeds */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">重設為初始精選示範資料</div>
                  <p className="text-slate-400">將情報庫還原至初始推薦的 GitHub 與素材庫資料。</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('確定要將所有收藏與分類重設為初始示範資料嗎？現有新增的項目將會被重設。')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 border border-rose-800/60 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置範例</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
}
