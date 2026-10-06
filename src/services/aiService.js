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
 * Helper to compress image client-side to ensure rapid upload and avoid Vercel 4.5MB payload limit
 */
export async function compressImageForVision(dataUrl, maxDimension = 1600, quality = 0.85) {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for optimal payload size
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Multimodal Screenshot Vision Analysis Service
 * Recognizes all websites/tools in screenshot and returns structured array
 */
export async function analyzeScreenshotWithVision({
  imageBase64,
  customApiKey = '',
  apiProvider = 'gemini',
  customModel = '',
}) {
  if (!imageBase64) {
    throw new Error('請提供截圖資料 (Base64)');
  }

  // 1. Client-side image compression
  const compressedImage = await compressImageForVision(imageBase64);
  const cleanBase64 = compressedImage.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
  const detectedMime = compressedImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

  const visionPrompt = `你是一個頂尖的網頁情報與技術視覺識別專家。分析這張截圖中出現的所有網站、開源專案、線上工具或設計資源。
請辨識出截圖中包含的所有網站/工具項目（截圖中可能包含 1 個或多個不同網站，例如搜尋結果清單、書籤列表、社群貼文、GitHub 專案推薦、或網頁推薦列表）。

對每個辨識出的項目，推論並提供其名稱、官網或 GitHub 網址、網域名稱、一句話核心亮點說明、關鍵特色亮點清單、建議分類（限選一：cat-ai, cat-frontend, cat-assets, cat-tools, cat-github）以及 2-4 個建議標籤。

必須嚴格以繁體中文 (台灣) 輸出 JSON 陣列，格式如下，不要任何 Markdown 圍欄外文字：
[
  {
    "title": "網站或專案完整名稱",
    "guessedUrl": "https://... (推測之官方首頁或 GitHub 倉庫 URL)",
    "domain": "網域名稱 (例如 github.com 或 figma.com)",
    "oneLiner": "一句話核心價值或定位（50字內，精確具體，嚴禁泛泛而談）",
    "highlights": ["核心亮點1", "核心亮點2", "核心亮點3"],
    "suggestedCategory": "cat-tools",
    "tags": ["標籤1", "標籤2", "標籤3"]
  }
]`;

  // 2. Direct client-side Gemini Vision call if user supplied custom API key
  if (customApiKey && apiProvider === 'gemini') {
    const modelToTry = customModel?.trim() || 'gemini-3.8-flash';
    const fallbackChain = Array.from(
      new Set([modelToTry, 'gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].filter(Boolean))
    );

    let lastError = null;
    for (const m of fallbackChain) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${customApiKey.trim()}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: visionPrompt },
                  { inlineData: { mimeType: detectedMime, data: cleanBase64 } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          lastError = `Gemini Vision ${m} 回應 ${res.status}: ${errText}`;
          continue;
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\[[\s\S]*\]/) || rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        let parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) {
          parsed = parsed.items || parsed.websites || [parsed];
        }

        return {
          success: true,
          count: parsed.length,
          modelUsed: m,
          items: formatVisionItems(parsed),
        };
      } catch (err) {
        lastError = err.message;
      }
    }
    throw new Error(lastError || '直接調用 Gemini Vision 辨識失敗');
  }

  // 3. Cloud Serverless Execution (/api/analyze-vision with fallback to /api/analyze)
  let visionResponse = null;
  let visionErrorDetails = null;

  try {
    visionResponse = await fetch('/api/analyze-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: compressedImage,
        mimeType: detectedMime,
        model: customModel || 'gemini-3.8-flash',
      }),
    });
  } catch (err) {
    visionErrorDetails = err.message;
  }

  // Fallback to /api/analyze if /api/analyze-vision is not reachable
  if (!visionResponse || visionResponse.status === 404) {
    try {
      visionResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compressedImage,
          mimeType: detectedMime,
          model: customModel || 'gemini-3.8-flash',
        }),
      });
    } catch (err) {
      visionErrorDetails = err.message;
    }
  }

  if (visionResponse && visionResponse.ok) {
    const data = await visionResponse.json();
    if (data.items && Array.isArray(data.items)) {
      return {
        success: true,
        count: data.items.length,
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        items: formatVisionItems(data.items),
      };
    }
  }

  if (visionResponse && !visionResponse.ok) {
    const errorData = await visionResponse.json().catch(() => ({}));
    const errText = errorData.error || errorData.details || `狀態碼 ${visionResponse.status}`;
    console.warn('[Vision Serverless Error]', errorData);
    throw new Error(`視覺辨識伺服器回傳錯誤: ${errText}`);
  }

  throw new Error(`無法連接視覺辨識伺服器 (${visionErrorDetails || '請確認網路連線'})`);
}

/**
 * Standardize and clean detected vision items
 */
function formatVisionItems(items) {
  return items.map((item, idx) => {
    const title = (item.title || `收錄網站 #${idx + 1}`).trim();
    let domainStr = (item.domain || '').trim();
    let guessedUrl = (item.guessedUrl || '').trim();

    if (!domainStr && guessedUrl) {
      try {
        domainStr = new URL(guessedUrl.startsWith('http') ? guessedUrl : `https://${guessedUrl}`).hostname.replace(/^www\./, '');
      } catch {}
    }

    if (!guessedUrl) {
      guessedUrl = domainStr ? `https://${domainStr}` : 'https://example.com';
    } else if (!guessedUrl.startsWith('http')) {
      guessedUrl = `https://${guessedUrl}`;
    }

    return {
      title,
      guessedUrl,
      domain: domainStr || getDomain(guessedUrl),
      favicon: getFaviconUrl(guessedUrl),
      oneLiner: item.oneLiner || `${title} 核心亮點與特色`,
      highlights: Array.isArray(item.highlights) && item.highlights.length > 0 ? item.highlights : ['視覺識別多模態提煉亮點'],
      suggestedCategory: item.suggestedCategory || 'cat-tools',
      tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ['截圖辨識'],
      userNote: item.userNote || '來自截圖智能辨識',
    };
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
    const errorData = await response.json().catch(() => null);
    const errDetail = errorData?.error || errorData?.details || (await response.text().catch(() => ''));
    console.error(`[LinkVault AI] /api/analyze 回傳錯誤 (${response.status}):`, errDetail);
    throw new Error(`Serverless API 回傳狀態 ${response.status}: ${errDetail.slice(0, 160)}`);
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

  console.info(`[LinkVault AI] 分析成功：${parsed.title} (來源: ${parsed.scrapedSource || 'web'}, 模型: ${parsed.modelUsed || model})`);

  let categoryId = parsed.suggestedCategory || 'cat-tools';
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
  // 5. AI Art / Anime Illustration / Creative Communities (e.g. chichi-pui, pixiv, civitai)
  else if (
    domain.includes('chichi-pui') ||
    domain.includes('civitai') ||
    domain.includes('pixiv') ||
    domain.includes('artstation') ||
    domain.includes('danbooru') ||
    domain.includes('prompthero') ||
    lowerUrl.includes('illust') ||
    lowerUrl.includes('anime') ||
    lowerNote.includes('繪圖') ||
    lowerNote.includes('插畫') ||
    lowerNote.includes('prompt')
  ) {
    categoryId = 'cat-ai';
    const siteRaw = domain.replace(/\.[a-z.]+$/, '');
    const siteName = siteRaw === 'chichi-pui' ? 'ちちぷい (Chichi-Pui)' : siteRaw.toUpperCase();
    title = `${siteName} - AI 圖像創作與動漫繪圖社群`;
    oneLiner = userNote
      ? `${userNote}（收錄自 ${siteName}）`
      : `專注於 AI 生成動漫插畫、模型咒語 (Prompt) 分享與創作者互動的專業視覺社群。`;

    tags.push('AI繪圖', '插畫社群', 'Prompt靈感', '動漫視覺');

    highlights.push(
      '聚集大量高精度 AI 生成插畫作品，提供豐富的 Prompt 提示詞與模型參數參考。',
      '具備熱絡的創作者社群互動機制，定期舉辦主題繪圖企劃與人氣排行。',
      userNote ? `個人筆記：${userNote}` : '便於探索新一代圖像生成模型的風格表現與微調應用。',
      '介面專為插畫檢索優化，支援依標籤、風格與模型快速篩選瀏覽。'
    );

    useCases.push(
      'AI 繪圖提示詞 (Prompt Engineering) 靈感發想與風格借鏡',
      '探索角色設計、動漫風格與前沿生成模型視覺效果',
      '關注日本與全球新一代 AI 繪師創作生態'
    );
  }
  // 6. Generic Intelligent Domain Heuristics (Eliminates boilerplate canned text)
  else {
    categoryId = 'cat-tools';
    const siteRaw = domain.replace(/\.[a-z.]+$/, '');
    const capitalizedName = siteRaw.charAt(0).toUpperCase() + siteRaw.slice(1);
    
    // Extract domain clues
    let domainFocus = '線上服務與專案資源';
    if (lowerUrl.includes('blog') || lowerUrl.includes('read')) domainFocus = '深度技術部落格與知識閱讀';
    else if (lowerUrl.includes('docs') || lowerUrl.includes('api')) domainFocus = '技術文檔與開發者手冊';
    else if (lowerUrl.includes('app')) domainFocus = '雲端應用程式與協作平台';
    else if (lowerUrl.includes('cloud')) domainFocus = '雲端基礎設施與部署服務';
    else if (lowerUrl.includes('lab') || lowerUrl.includes('research')) domainFocus = '前沿技術實驗與研究成果';

    title = userNote
      ? `${capitalizedName} - ${userNote.slice(0, 36)}`
      : `${capitalizedName} - ${domainFocus}`;

    oneLiner = userNote
      ? `${userNote}（存取自 ${domain}）`
      : `收錄自 ${domain}，專注於 ${domainFocus} 的精選網路情報。`;

    tags.push(capitalizedName, '精選收錄');
    if (domainFocus.includes('閱讀') || domainFocus.includes('文檔')) tags.push('開發文件');
    else tags.push('雲端資源');

    highlights.push(
      `專屬網域情報（${domain}），具備明確的主題聚焦與線上功能。`,
      userNote ? `核心備註：${userNote}` : `收錄作為日常研究、工作流程或專案開發的重要參考錨點。`,
      '頁面架構清晰，提供現代網頁標準的存取與即時互動體驗。',
      '已建立智能情報索引，可隨時透過全局搜尋快速檢索。'
    );

    useCases.push(
      '技術選型評估與日常工作流程參考',
      '團隊知識庫沉澱與跨專案靈感借鏡',
      '個人數位情報百寶箱快速調用'
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
