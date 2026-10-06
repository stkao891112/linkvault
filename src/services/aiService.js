// AI Analysis and Site Metadata Extraction Service

/**
 * Extract clean domain name from URL
 */
export function getDomain(urlStr) {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

/**
 * Get favicon URL for domain
 */
export function getFaviconUrl(urlStr) {
  const domain = getDomain(urlStr);
  if (domain.includes('github.com')) {
    return 'https://github.githubassets.com/favicons/favicon.svg';
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Parse GitHub repo details if URL is github.com
 */
export function parseGitHubUrl(urlStr) {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    if (url.hostname.includes('github.com')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return {
          owner: parts[0],
          repo: parts[1].replace(/\.git$/, ''),
        };
      }
    }
  } catch {
    // Ignore invalid URL parsing
  }
  return null;
}

/**
 * Fetch GitHub repo info from public GitHub API (no token required for public repos)
 */
export async function fetchGitHubRepoDetails(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        description: data.description,
        topics: data.topics || [],
        homepage: data.homepage,
      };
    }
  } catch (err) {
    console.warn('GitHub API fetch failed or rate limited:', err);
  }
  return null;
}

/**
 * Comprehensive Smart Local AI Analyzer
 * Generates structured, high-value insights based on URL semantics, domain heuristics, and user input notes.
 */
export async function analyzeUrlWithAI({
  url,
  userNote = '',
  customApiKey = '',
  apiProvider = 'gemini',
  customBaseUrl = '',
  customModel = ''
}) {
  const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
  const domain = getDomain(cleanUrl);
  const ghInfo = parseGitHubUrl(cleanUrl);

  let ghDetails = null;
  if (ghInfo) {
    ghDetails = await fetchGitHubRepoDetails(ghInfo.owner, ghInfo.repo);
  }

  // 1. If user provided a real LLM API Key or local custom endpoint
  if ((customApiKey || apiProvider === 'custom') && apiProvider !== 'mock') {
    try {
      const result = await callExternalLLM({
        url: cleanUrl,
        domain,
        userNote,
        ghInfo,
        ghDetails,
        apiKey: customApiKey,
        provider: apiProvider,
        customBaseUrl,
        customModel,
      });
      if (result) return result;
    } catch (e) {
      console.warn('External LLM call failed, falling back to serverless or smart local AI extractor:', e);
    }
  }

  // 2. Default cloud execution: If no custom key is provided and provider is gemini,
  // call Vercel Serverless API (/api/analyze) powered by Vercel GEMINI_API_KEY
  if (!customApiKey && (apiProvider === 'gemini' || !apiProvider)) {
    try {
      const serverResult = await callServerlessAnalyze({
        url: cleanUrl,
        domain,
        userNote,
        ghInfo,
        ghDetails,
        model: customModel || 'gemini-3.8-flash',
      });
      if (serverResult) return serverResult;
    } catch (e) {
      console.warn('Vercel Serverless analyze failed or unavailable, falling back to smart local AI extractor:', e);
    }
  }

  // 3. Built-in Smart Local AI Extractor (graceful offline / non-Vercel fallback)
  return generateSmartHeuristicAnalysis({
    url: cleanUrl,
    domain,
    userNote,
    ghInfo,
    ghDetails,
  });
}

/**
 * Call Vercel Serverless API (/api/analyze)
 * Executes Gemini analysis in the cloud using Vercel's GEMINI_API_KEY environment variable.
 */
export async function callServerlessAnalyze({ url, domain, userNote, ghInfo, ghDetails, model = 'gemini-3.8-flash' }) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      domain,
      userNote,
      ghDetails,
      model,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Serverless API returned status ${response.status}: ${errorText.slice(0, 120)}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Serverless API returned non-JSON response (possibly SPA fallback)');
  }

  const data = await response.json();
  const parsed = data.data || data;

  if (!parsed || !parsed.title) {
    throw new Error('Invalid JSON payload returned by /api/analyze');
  }

  let categoryId = 'cat-tools';
  if (ghInfo) {
    categoryId = 'cat-github';
  }

  return {
    title: parsed.title || `${domain} - AI 分析網站`,
    domain,
    favicon: getFaviconUrl(url),
    categoryId,
    aiSummary: {
      oneLiner: parsed.oneLiner || '',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
      suggestedCategory: categoryId,
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ['AI整理'],
    },
    tags: Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0 ? parsed.suggestedTags : ['AI整理'],
    githubStats: ghDetails
      ? {
          owner: ghInfo.owner,
          repo: ghInfo.repo,
          stars: ghDetails.stars,
          forks: ghDetails.forks,
          language: ghDetails.language,
          topics: ghDetails.topics,
        }
      : undefined,
  };
}

/**
 * Smart Heuristic Analysis Engine
 */
function generateSmartHeuristicAnalysis({ url, domain, userNote, ghInfo, ghDetails }) {
  const lowerUrl = url.toLowerCase();
  const lowerNote = (userNote || '').toLowerCase();

  // Initial title detection
  let title = '';
  let categoryId = 'cat-tools';
  let oneLiner = '';
  const highlights = [];
  const useCases = [];
  const tags = [];

  // 1. GitHub Repositories
  if (ghInfo) {
    const repoName = `${ghInfo.owner}/${ghInfo.repo}`;
    title = ghDetails?.description
      ? `${repoName} - ${ghDetails.description.slice(0, 60)}`
      : `${repoName}: 熱門開源專案`;

    categoryId = 'cat-github';
    tags.push('GitHub', 'OpenSource');

    if (ghDetails?.language) {
      tags.push(ghDetails.language);
    }

    if (ghDetails?.topics && ghDetails.topics.length > 0) {
      tags.push(...ghDetails.topics.slice(0, 3));
    }

    const starCountStr = ghDetails?.stars ? `已獲得 ${ghDetails.stars.toLocaleString()} Stars` : '高活躍度專案';
    oneLiner = ghDetails?.description
      ? `${ghDetails.description}（${starCountStr}）。`
      : `由 ${ghInfo.owner} 維護的現代高品質開源軟體專案，具備良好的架構與活躍社群。`;

    highlights.push(
      `社群熱度高：GitHub ${starCountStr}，程式庫更新活躍。`,
      `主要技術棧：以 ${ghDetails?.language || '現代程式語言'} 構建，具備清晰的架構設計與模組化劃分。`,
      userNote
        ? `個人收藏重點：${userNote}`
        : '提供開箱即用的工具鏈與完整文件範例，易於二次開發與導入既有系統。',
      '具備嚴謹的開源授權與 CI 自動化測試，穩定性與長期維護性高。'
    );

    useCases.push(
      '技術選型評估與架構設計參考',
      '直接作為專案依賴庫或微服務模組導入生產環境',
      '研讀現代優秀工程師的程式碼實作與設計模式'
    );

    // Contextual fine-tuning based on keywords
    if (lowerUrl.includes('ui') || lowerUrl.includes('design') || lowerNote.includes('ui') || lowerNote.includes('元件')) {
      categoryId = 'cat-frontend';
      tags.push('UI元件', '前端');
    } else if (lowerUrl.includes('ai') || lowerUrl.includes('llm') || lowerUrl.includes('model') || lowerNote.includes('ai') || lowerNote.includes('模型')) {
      categoryId = 'cat-ai';
      tags.push('AI', 'LLM');
    }
  }
  // 2. Design & Asset Libraries (Icons, Illustrations, 3D, Figma, UI Kits, Wallpapers, Sound)
  else if (
    domain.includes('lucide') ||
    domain.includes('ui8') ||
    domain.includes('unsplash') ||
    domain.includes('freepik') ||
    domain.includes('figma') ||
    domain.includes('dribbble') ||
    domain.includes('behance') ||
    domain.includes('flaticon') ||
    domain.includes('icons8') ||
    domain.includes('pexels') ||
    domain.includes('svgrepo') ||
    lowerNote.includes('素材') ||
    lowerNote.includes('設計') ||
    lowerNote.includes('圖標') ||
    lowerNote.includes('3d') ||
    lowerNote.includes('插畫')
  ) {
    categoryId = 'cat-assets';
    const siteName = domain.split('.')[0].toUpperCase();
    title = `${siteName} - 精選設計資源與視覺素材平台`;
    oneLiner = `專門提供現代高質感視覺資產、UI 套件與設計素材的資源庫。`;

    tags.push('設計素材', 'UI/UX', '視覺資源');
    if (lowerUrl.includes('icon') || lowerNote.includes('icon') || lowerNote.includes('圖標')) tags.push('Icon庫', 'SVG');
    if (lowerUrl.includes('3d') || lowerNote.includes('3d')) tags.push('3D素材');
    if (lowerUrl.includes('figma') || lowerNote.includes('figma')) tags.push('Figma');

    highlights.push(
      '資源品質優良，設計語言符合當前主流科技與商業網頁美學。',
      '提供多種格式下載（SVG, PNG, Figma, WebP），方便設計師與工程師直接調用。',
      userNote ? `筆記註記：${userNote}` : '分類明確、檢索效率高，大幅縮短尋找配圖與圖標的時間。',
      '授權條款明確，適合商業專案、個人 Side Project 與提案簡報使用。'
    );

    useCases.push(
      '前端頁面切版與 UI 視覺豐富化',
      '提案簡報 (Pitch Deck) 與宣傳網站的高保真視覺渲染',
      '快速尋找統一風格的 Icon 向量套件'
    );
  }
  // 3. AI Tools & Models
  else if (
    domain.includes('huggingface') ||
    domain.includes('openai') ||
    domain.includes('anthropic') ||
    domain.includes('ollama') ||
    domain.includes('replicate') ||
    domain.includes('v0.dev') ||
    domain.includes('bolt.new') ||
    domain.includes('groq') ||
    domain.includes('deepseek') ||
    domain.includes('mistral') ||
    lowerNote.includes('ai') ||
    lowerNote.includes('llm') ||
    lowerNote.includes('模型') ||
    lowerNote.includes('智能')
  ) {
    categoryId = 'cat-ai';
    const siteName = domain.split('.')[0].toUpperCase();
    title = `${siteName} - 新一代 AI 開發與智能應用工具`;
    oneLiner = `聚焦於前沿人工智慧、大語言模型與自動化智慧工作流的創新生態工具。`;

    tags.push('AI', '大模型', '機器學習', '效率升級');

    highlights.push(
      '提供強大且快速推論的 AI 模型架構或即開即用的生成式介面。',
      '大幅降低從演算法到落地應用的技術門檻，加速原型驗證。',
      userNote ? `個人觀察：${userNote}` : '具備清晰的 API 介面規格，支援主流開發框架無縫對接。',
      '活躍的技術生態與社群演進，代表當前 AI 發展最新風向。'
    );

    useCases.push(
      '自動化文本處理、程式碼輔助生成與智能檢索 (RAG)',
      '企業內部 AI 代理人 (Agent) 與微服務架構搭建',
      '探索開源模型私有化部署與本地推論方案'
    );
  }
  // 4. Frontend Component & Animation Libraries
  else if (
    domain.includes('aceternity') ||
    domain.includes('radix') ||
    domain.includes('framer') ||
    domain.includes('tailwind') ||
    domain.includes('shadcn') ||
    domain.includes('mantine') ||
    domain.includes('chakra') ||
    domain.includes('nextjs') ||
    domain.includes('vue') ||
    domain.includes('react') ||
    lowerNote.includes('元件') ||
    lowerNote.includes('前端') ||
    lowerNote.includes('動畫') ||
    lowerNote.includes('css')
  ) {
    categoryId = 'cat-frontend';
    title = `${domain} - 現代前端互動與元件解決方案`;
    oneLiner = `專注於高品質互動動態、無障礙規範與極致使用者體驗的前端套件庫。`;

    tags.push('前端開發', 'React', 'CSS/動畫', 'UI組件');

    highlights.push(
      '精美細膩的微互動動效 (Micro-interactions)，提升產品視覺檔次。',
      '響應式設計友善，兼顧桌面端與行動端瀏覽器體驗。',
      userNote ? `筆記要點：${userNote}` : '代碼輕量且高度可定制，能輕鬆融入既有設計系統。',
      '符合現代 Web 效能標準，避免造成頁面掉幀與效能負擔。'
    );

    useCases.push(
      '打造高轉換率的官網 Landing Page 與產品形象頁',
      '為 Web 應用程式增添流暢的微動畫與過渡效果',
      '標準化企業 UI 元件庫規範'
    );
  }
  // 5. Generic Developer & Utility Tools
  else {
    categoryId = 'cat-tools';
    const siteName = domain.split('.')[0].toUpperCase();
    title = userNote ? `${siteName} - ${userNote.slice(0, 30)}` : `${domain} - 實用效率工具站`;
    oneLiner = userNote
      ? `${userNote}（收錄於 ${domain}）`
      : `收錄自 ${domain} 的高實用價值線上服務與效率工具。`;

    tags.push('實用工具', '效率提升', 'Web服務');

    highlights.push(
      '解決特定場景核心痛點，流程直覺、省去繁複操作步驟。',
      userNote ? `重點筆記：${userNote}` : '輕量便捷，無需複雜安裝即可在瀏覽器端立即發揮效益。',
      `網域來源可靠（${domain}），具備穩定的存取與服務品質。`,
      '適合收藏作為日常開發、工作排程或專案協作的秘密武器庫。'
    );

    useCases.push(
      '日常開發除錯、格式轉換或效能驗證',
      '優化團隊工作流程與知識積累',
      '隨時調用的雲端便利百寶箱'
    );
  }

  // Deduplicate tags
  const uniqueTags = Array.from(new Set(tags));

  return {
    title,
    domain,
    favicon: getFaviconUrl(url),
    categoryId,
    aiSummary: {
      oneLiner,
      highlights,
      useCases,
      suggestedCategory: categoryId,
      suggestedTags: uniqueTags,
    },
    tags: uniqueTags,
    githubStats: ghDetails
      ? {
          owner: ghInfo.owner,
          repo: ghInfo.repo,
          stars: ghDetails.stars,
          forks: ghDetails.forks,
          language: ghDetails.language,
          topics: ghDetails.topics,
        }
      : undefined,
  };
}

/**
 * Optional external LLM caller for users who want to supply an API Key or custom endpoint
 */
async function callExternalLLM({ url, domain, userNote, ghInfo, ghDetails, apiKey, provider, customBaseUrl, customModel }) {
  const prompt = `你是一個專業的技術與設計網站情報分析師。使用者提供了一個網址：${url}
網域：${domain}
使用者補充備註：${userNote || '無'}
${ghDetails ? `GitHub 資訊：${ghDetails.description}, Stars: ${ghDetails.stars}, 語言: ${ghDetails.language}` : ''}

請以繁體中文 (台灣) 快速整理此網站重點，輸出格式嚴格遵守下方 JSON，不要任何 Markdown 圍欄外的文字：
{
  "title": "精煉的網站/專案標題",
  "oneLiner": "一句話說明核心價值或定位（50字內）",
  "highlights": ["亮點1", "亮點2", "亮點3", "亮點4"],
  "useCases": ["適合場景1", "適合場景2", "適合場景3"],
  "suggestedTags": ["標籤1", "標籤2", "標籤3"]
}`;

  let parsed = null;

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const preferredModel = customModel?.trim() || 'gemini-3.8-flash';
    const fallbackChain = Array.from(
      new Set([
        preferredModel,
        'gemini-3.8-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ].filter(Boolean))
    );

    let lastError = null;
    for (const modelToTry of fallbackChain) {
      try {
        let endpoint = customBaseUrl?.trim()
          ? `${customBaseUrl.trim().replace(/\/$/, '')}/models/${modelToTry}:generateContent?key=${apiKey?.trim()}`
          : `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey?.trim()}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          lastError = `Gemini API returned ${response.status}: ${errText}`;
          console.warn(`[Gemini Direct Fallback] Model ${modelToTry} failed (${response.status}), trying next candidate...`);
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          break;
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`[Gemini Direct Fallback] Exception with ${modelToTry}:`, err.message);
      }
    }

    if (!parsed) {
      throw new Error(lastError || 'Invalid JSON returned by Gemini');
    }
  }
  // 2. OpenAI-compatible Providers (OpenAI, Groq, OpenRouter, Custom / Local Ollama / LM Studio)
  else {
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    let model = customModel?.trim() || 'gpt-4o-mini';

    if (provider === 'openrouter') {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      model = customModel?.trim() || 'anthropic/claude-3.5-haiku';
    } else if (provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      model = customModel?.trim() || 'llama-3.3-70b-versatile';
    } else if (provider === 'custom') {
      let base = (customBaseUrl || 'http://localhost:11434/v1').trim().replace(/\/$/, '');
      endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
      model = customModel?.trim() || 'llama3';
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API returned ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON returned by LLM');
    parsed = JSON.parse(jsonMatch[0]);
  }

  return {
    title: parsed.title || `${domain} - AI 分析網站`,
    domain,
    favicon: getFaviconUrl(url),
    categoryId: 'cat-tools',
    aiSummary: {
      oneLiner: parsed.oneLiner,
      highlights: parsed.highlights || [],
      useCases: parsed.useCases || [],
      suggestedCategory: 'cat-tools',
      suggestedTags: parsed.suggestedTags || ['AI整理'],
    },
    tags: parsed.suggestedTags || ['AI整理'],
    githubStats: ghDetails
      ? {
          owner: ghInfo.owner,
          repo: ghInfo.repo,
          stars: ghDetails.stars,
          forks: ghDetails.forks,
          language: ghDetails.language,
          topics: ghDetails.topics,
        }
      : undefined,
  };
}

// ==========================================
// 動態獲取與預設可用 AI 模型清單 (免手動輸入)
// ==========================================

export const DEFAULT_PROVIDER_MODELS = {
  gemini: [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (最新預設首選 / 超高速響應)' },
    { id: 'gemini-3.8-pro', name: 'Gemini 3.8 Pro (最新旗艦深度推理)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (次世代旗艦推薦)' },
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro (高階多模態思考)' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite (極速輕量)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (成熟穩定版)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (經典長文本深度版)' },
  ],
  custom: [
    { id: 'llama3', name: 'llama3 (本機推薦)' },
    { id: 'deepseek-r1', name: 'deepseek-r1 (推理思考模型)' },
    { id: 'qwen2.5', name: 'qwen2.5 (繁中優化)' },
    { id: 'mistral', name: 'mistral' },
    { id: 'gemma2', name: 'gemma2' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini (高性價比推薦)' },
    { id: 'gpt-4o', name: 'GPT-4o (旗艦多模態)' },
    { id: 'o3-mini', name: 'o3-mini (深度推理模型)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (推薦極速)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (最速回應)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  ],
  mock: [
    { id: 'built-in', name: 'LinkVault 內建在地智慧分析引擎' },
  ],
};

/**
 * 動態從服務商端點獲取最新模型清單
 */
export async function fetchAvailableModels({ provider = 'gemini', apiKey = '', baseUrl = '' }) {
  // 1. Google Gemini
  if (provider === 'gemini') {
    if (apiKey && apiKey.trim()) {
      const endpoint = baseUrl?.trim()
        ? `${baseUrl.trim().replace(/\/$/, '')}/models?key=${apiKey.trim()}`
        : `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API 回傳狀態 ${res.status}`);
      }
      const data = await res.json();
      const rawList = data.models || [];
      const filtered = rawList
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => {
          const id = m.name.replace(/^models\//, '');
          const label = m.displayName ? `${m.displayName} (${id})` : id;
          return { id, name: label };
        })
        .sort((a, b) => {
          // gemini-3.8-flash 最優先置頂推薦
          if (a.id === 'gemini-3.8-flash') return -1;
          if (b.id === 'gemini-3.8-flash') return 1;
          // 3.8 系列優先於其他系列
          const aIs38 = a.id.includes('3.8');
          const bIs38 = b.id.includes('3.8');
          if (aIs38 && !bIs38) return -1;
          if (!aIs38 && bIs38) return 1;
          // 2.0 系列優先於 1.5 系列
          const aIs20 = a.id.includes('2.0');
          const bIs20 = b.id.includes('2.0');
          if (aIs20 && !bIs20) return -1;
          if (!aIs20 && bIs20) return 1;
          // Flash 優先於非 Flash
          if (a.id.includes('flash') && !b.id.includes('flash')) return -1;
          if (!a.id.includes('flash') && b.id.includes('flash')) return 1;
          return a.id.localeCompare(b.id);
        });

      if (filtered.length > 0) return filtered;
    }
    return DEFAULT_PROVIDER_MODELS.gemini;
  }

  // 2. 自訂端點 (Ollama / LM Studio / 本地代理)
  if (provider === 'custom') {
    const cleanBase = (baseUrl || 'http://localhost:11434/v1').trim().replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    // 優先調用標準 OpenAI 相容 /models 端點 (例如 http://localhost:11434/v1/models 或 LM Studio)
    const modelsUrl = cleanBase.endsWith('/models') ? cleanBase : `${cleanBase}/models`;
    let res = null;
    try {
      res = await fetch(modelsUrl, { headers });
    } catch {
      // 捕獲網路連線失敗
    }

    // 若標準 /v1/models 失敗且為預設 Ollama 端口，嘗試 Ollama 原生 /api/tags
    if (!res || !res.ok) {
      if (cleanBase.includes('11434')) {
        const ollamaBase = cleanBase.replace(/\/v1$/, '');
        try {
          const oRes = await fetch(`${ollamaBase}/api/tags`);
          if (oRes.ok) {
            const oData = await oRes.json();
            const models = (oData.models || []).map((m) => ({
              id: m.name,
              name: m.size ? `${m.name} (${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)` : m.name,
            }));
            if (models.length > 0) return models;
          }
        } catch {
          // 忽略
        }
      }
      throw new Error(`無法連接至本機端點 (${modelsUrl})，請確認 Ollama 或 LM Studio 是否已啟動`);
    }

    const data = await res.json();
    const list = (data.data || data.models || [])
      .map((m) => {
        const id = typeof m === 'string' ? m : (m.id || m.name);
        return { id, name: id };
      })
      .filter((m) => Boolean(m.id));

    if (list.length === 0) {
      throw new Error('本機端點已連線，但目前未偵測到已安裝的模型，請先於本機 pull 模型');
    }
    return list;
  }

  // 3. OpenAI
  if (provider === 'openai') {
    if (!apiKey || !apiKey.trim()) {
      return DEFAULT_PROVIDER_MODELS.openai;
    }
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (!res.ok) {
      throw new Error(`OpenAI API 回應錯誤 ${res.status}`);
    }
    const data = await res.json();
    const list = (data.data || [])
      .map((m) => ({ id: m.id, name: m.id }))
      .filter((m) => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
      .sort((a, b) => a.id.localeCompare(b.id));
    return list.length > 0 ? list : DEFAULT_PROVIDER_MODELS.openai;
  }

  // 4. Groq
  if (provider === 'groq') {
    if (!apiKey || !apiKey.trim()) {
      return DEFAULT_PROVIDER_MODELS.groq;
    }
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (!res.ok) {
      throw new Error(`Groq API 回應錯誤 ${res.status}`);
    }
    const data = await res.json();
    const list = (data.data || [])
      .map((m) => ({ id: m.id, name: m.id }))
      .sort((a, b) => a.id.localeCompare(b.id));
    return list.length > 0 ? list : DEFAULT_PROVIDER_MODELS.groq;
  }

  // 5. OpenRouter
  if (provider === 'openrouter') {
    const headers = {};
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }
    const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
    if (!res.ok) {
      throw new Error(`OpenRouter API 回應錯誤 ${res.status}`);
    }
    const data = await res.json();
    const list = (data.data || [])
      .slice(0, 80)
      .map((m) => ({
        id: m.id,
        name: m.name ? `${m.name} (${m.id})` : m.id,
      }));
    return list.length > 0 ? list : DEFAULT_PROVIDER_MODELS.openrouter;
  }

  return DEFAULT_PROVIDER_MODELS[provider] || [];
}
