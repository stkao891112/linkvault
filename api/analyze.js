/**
 * Vercel Serverless Function: /api/analyze
 * LinkVault AI Intelligent Analyzer v2.0
 * Includes: Real Web Content Scraper (Direct HTML + Jina Reader Fallback) + Gemini 3.8 Flash Fallback Chain
 */

/**
 * Real Web Content Extractor
 * Attempts direct HTML parsing; on anti-bot/empty content, automatically falls back to keyless Jina Reader.
 */
async function extractWebContent(targetUrl) {
  let title = '';
  let description = '';
  let content = '';
  let source = 'none';

  // 1. Direct HTML fetch
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,ja;q=0.8,en;q=0.7',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      const tMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const titleCandidate = tMatch ? tMatch[1].trim() : '';

      // Check for common WAF / Cloudflare bot wall patterns
      const isBotBlocked =
        !titleCandidate ||
        /cloudflare|attention required|just a moment|access denied|robot|ddos|security check/i.test(
          titleCandidate
        );

      if (!isBotBlocked) {
        title = titleCandidate;

        // OG Title fallback
        const ogTitle =
          html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
        if (ogTitle && ogTitle[1]) title = ogTitle[1].trim();

        // Meta Description / OG Description
        const descMatch =
          html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
          html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
        if (descMatch && descMatch[1]) description = descMatch[1].trim();

        // Strip scripts, styles, svgs, noscripts, tags
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length > 80) {
          content = cleanText.slice(0, 2000);
          source = 'direct';
        }
      }
    }
  } catch (err) {
    // Direct fetch failed or timed out; will try Jina Reader
  }

  // 2. Jina Reader Fallback (Handles anti-bot, SPAs, Cloudflare)
  if (!content || !title || source === 'none') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const jinaUrl = 'https://r.jina.ai/' + targetUrl;
      const jRes = await fetch(jinaUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'text/plain',
          'User-Agent': 'LinkVault-Extractor/2.0',
        },
      });
      clearTimeout(timer);

      if (jRes.ok) {
        const jText = await jRes.text();
        const jTitleMatch = jText.match(/^Title:\s*(.+)$/m);
        if (jTitleMatch && jTitleMatch[1]) {
          title = jTitleMatch[1].trim();
        }

        const bodyPart = jText
          .replace(/^Title:[^\n]*\n/m, '')
          .replace(/^URL Source:[^\n]*\n/m, '')
          .replace(/^Markdown Content:\s*/m, '')
          .trim();

        if (bodyPart.length > 40) {
          content = bodyPart.slice(0, 2500);
          if (!description) {
            description = bodyPart
              .slice(0, 220)
              .replace(/[#*`[\]()]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          source = 'jina';
        }
      }
    } catch (jErr) {
      // Jina failed
    }
  }

  return { title, description, content, source };
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { url, domain, userNote, ghDetails, model: requestedModel, image, mimeType } = body || {};

    const apiKey = process.env.GEMINI_API_KEY || body?.apiKey;
    const preferredModel = (process.env.GEMINI_MODEL || requestedModel || 'gemini-2.0-flash').trim();
    const fallbackChain = Array.from(
      new Set([
        preferredModel,
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
      ].filter(Boolean))
    );

    // ==========================================
    // Branch A: Screenshot Vision Analysis (if image provided)
    // ==========================================
    if (image) {
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on Vercel environment',
        });
      }

      const cleanBase64 = image.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      const detectedMime = mimeType || (image.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png');

      const visionPrompt = `你是一個頂尖的網頁情報與技術視覺識別專家。分析這張截圖中出現的所有網站、開源專案、線上工具或設計資源。
請辨識出截圖中包含的所有網站/工具項目（截圖中可能包含 1 個或多個不同網站，例如搜尋結果清單、書籤列表、社群貼文或網頁推薦列表）。

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

      let visionError = null;
      let visionItems = null;
      let usedModel = preferredModel;

      for (const modelToTry of fallbackChain) {
        usedModel = modelToTry;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;

        try {
          const resp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: visionPrompt },
                    {
                      inlineData: {
                        mimeType: detectedMime,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            visionError = `Vision Model ${modelToTry} returned status ${resp.status}: ${errText}`;
            console.warn(`[Gemini Vision Fallback] ${modelToTry} failed (${resp.status}), trying next candidate...`);
            continue;
          }

          const data = await resp.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = rawText.match(/\[[\s\S]*\]/) || rawText.match(/\{[\s\S]*\}/);

          if (!jsonMatch) {
            visionError = `Vision Model ${modelToTry} returned non-JSON structure`;
            continue;
          }

          let parsed = JSON.parse(jsonMatch[0]);
          if (!Array.isArray(parsed)) {
            parsed = parsed.items || parsed.websites || [parsed];
          }

          visionItems = parsed;
          break;
        } catch (err) {
          visionError = `Vision Model ${modelToTry} exception: ${err.message}`;
          console.warn(`[Gemini Vision Exception] ${modelToTry}:`, err.message);
        }
      }

      if (!visionItems || visionItems.length === 0) {
        return res.status(502).json({
          error: 'Failed to extract website items from screenshot with Gemini Vision',
          details: visionError,
        });
      }

      // Sanitize and structure items
      const formattedItems = visionItems.map((item, idx) => {
        const title = item.title || `識別網站 #${idx + 1}`;
        let domainStr = item.domain || '';
        let guessedUrl = item.guessedUrl || '';

        if (!domainStr && guessedUrl) {
          try {
            domainStr = new URL(guessedUrl.startsWith('http') ? guessedUrl : `https://${guessedUrl}`).hostname.replace(/^www\./, '');
          } catch {}
        }
        if (!guessedUrl) {
          guessedUrl = domainStr ? `https://${domainStr}` : 'https://example.com';
        }

        return {
          title,
          guessedUrl,
          domain: domainStr || 'web',
          oneLiner: item.oneLiner || `${title} 核心特色`,
          highlights: Array.isArray(item.highlights) && item.highlights.length > 0 ? item.highlights : ['視覺識別萃取重點'],
          suggestedCategory: item.suggestedCategory || 'cat-tools',
          tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ['截圖辨識'],
        };
      });

      return res.status(200).json({
        success: true,
        modelUsed: usedModel,
        count: formattedItems.length,
        items: formattedItems,
      });
    }

    // ==========================================
    // Branch B: URL Web Analysis with Real Crawler
    // ==========================================
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cleanDomain = domain || '';
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    // 1. Run Real Web Content Scraper (Direct HTML + Jina Reader Fallback)
    const webContent = await extractWebContent(cleanUrl);

    // 2. Prepare Rich Grounded Prompt for Gemini
    const prompt = `你是一個專業的技術與設計網站情報分析師。分析以下真實抓取到的網頁內容與資訊：
網址：${cleanUrl}
網域：${cleanDomain}
真實網頁標題：${webContent.title || '無'}
真實網頁描述 (Meta/OG)：${webContent.description || '無'}
網頁真實內文摘要 (前 2,000 字)：
${webContent.content || '無'}
使用者補充備註：${userNote || '無'}
${ghDetails ? `GitHub 資訊：${ghDetails.description || ''}, Stars: ${ghDetails.stars || 0}, 語言: ${ghDetails.language || '未知'}` : ''}

請以繁體中文 (台灣) 嚴格根據上述真實內容，提煉出該網站的精確定位與核心亮點。
【重要規範】：
1. 嚴禁給出千篇一律的「實用效率工具站」、「高實用價值線上服務與效率工具」等樣板罐頭文字！
2. 必須具體指出該網站真正提供什麼產品、功能、社群或服務（例如若是日本 AI 繪圖投稿網站、特定向量圖標庫、特定前沿 AI 框架、開源設計系統等，請具體點名其核心業務與專屬特色）。
3. 輸出格式嚴格遵守下方 JSON，不要任何 Markdown 圍欄外的文字：
{
  "title": "精煉且真實的網站/專案標題",
  "oneLiner": "一句話說明核心價值或定位（50字內，具體明確）",
  "highlights": ["真實亮點1", "真實亮點2", "真實亮點3", "真實亮點4"],
  "useCases": ["適合場景1", "適合場景2", "適合場景3"],
  "suggestedCategory": "建議分類（限選一：cat-ai / cat-frontend / cat-assets / cat-tools / cat-github）",
  "suggestedTags": ["標籤1", "標籤2", "標籤3"]
}`;

    if (!apiKey) {
      // If no API key configured on Vercel environment, produce rich authentic fallback from webContent
      if (webContent.title || webContent.content) {
        const fallbackTitle = webContent.title || `${cleanDomain} - 網站情報`;
        const fallbackOneLiner =
          webContent.description ||
          (webContent.content
            ? webContent.content.slice(0, 95).replace(/\s+/g, ' ') + '...'
            : `收錄自 ${cleanDomain} 之專屬資源`);

        const rawHighlights = webContent.content
          ? webContent.content
              .split(/[。\n!！?？]/)
              .map((s) => s.trim())
              .filter((s) => s.length > 8 && s.length < 80)
              .slice(0, 4)
          : [];

        return res.status(200).json({
          success: true,
          fallback: true,
          notice: 'Live content extracted via scraper (GEMINI_API_KEY omitted on server)',
          scrapedSource: webContent.source,
          title: fallbackTitle,
          oneLiner: fallbackOneLiner,
          highlights: rawHighlights.length > 0 ? rawHighlights : ['即時抓取頁面真實資料', '深度解析網頁結構與內容'],
          useCases: ['日常開發與設計參考', '深度探訪與專案選型'],
          suggestedTags: [cleanDomain, '即時提取'],
        });
      }

      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on Vercel environment',
      });
    }

    let lastError = null;
    let successfulResult = null;
    let actualModelUsed = preferredModel;

    for (const modelToTry of fallbackChain) {
      actualModelUsed = modelToTry;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;

      try {
        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text().catch(() => '');
          lastError = `Model ${modelToTry} returned status ${geminiResponse.status}: ${errText}`;
          console.warn(`[Gemini Fallback] Model ${modelToTry} failed (${geminiResponse.status}), trying next candidate...`);
          continue;
        }

        const data = await geminiResponse.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          lastError = `Model ${modelToTry} returned non-JSON structure`;
          console.warn(`[Gemini Fallback] ${lastError}, trying next candidate...`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        successfulResult = parsed;
        break; // Successfully parsed structured JSON
      } catch (err) {
        lastError = `Model ${modelToTry} fetch error: ${err.message}`;
        console.warn(`[Gemini Fallback] Exception with ${modelToTry}:`, err.message);
      }
    }

    if (!successfulResult) {
      // If Gemini models failed but we have scraped real content, return authentic scraped fallback
      if (webContent.title || webContent.content) {
        const fallbackTitle = webContent.title || `${cleanDomain} - 網站情報`;
        const fallbackOneLiner =
          webContent.description ||
          (webContent.content
            ? webContent.content.slice(0, 95).replace(/\s+/g, ' ') + '...'
            : `收錄自 ${cleanDomain} 之專屬資源`);

        const rawHighlights = webContent.content
          ? webContent.content
              .split(/[。\n!！?？]/)
              .map((s) => s.trim())
              .filter((s) => s.length > 8 && s.length < 80)
              .slice(0, 4)
          : [];

        return res.status(200).json({
          success: true,
          fallback: true,
          notice: `Extracted via real content scraper (${webContent.source}) after Gemini fallback: ${lastError}`,
          scrapedSource: webContent.source,
          title: fallbackTitle,
          oneLiner: fallbackOneLiner,
          highlights: rawHighlights.length > 0 ? rawHighlights : ['即時抓取頁面真實資料', '已從內文提煉關鍵資訊'],
          useCases: ['日常開發與設計參考', '深度探訪與專案選型'],
          suggestedTags: [cleanDomain, '即時提取'],
        });
      }

      return res.status(502).json({
        error: 'Failed to analyze URL with Gemini models after fallback chain',
        details: lastError,
      });
    }

    return res.status(200).json({
      success: true,
      modelUsed: actualModelUsed,
      scrapedSource: webContent.source,
      title: successfulResult.title || webContent.title || `${cleanDomain} - 專屬情報`,
      oneLiner: successfulResult.oneLiner || webContent.description || '',
      highlights: Array.isArray(successfulResult.highlights) ? successfulResult.highlights : [],
      useCases: Array.isArray(successfulResult.useCases) ? successfulResult.useCases : [],
      suggestedCategory: successfulResult.suggestedCategory || 'cat-tools',
      suggestedTags: Array.isArray(successfulResult.suggestedTags) ? successfulResult.suggestedTags : [],
    });
  } catch (error) {
    console.error('Vercel analyze function error:', error);
    return res.status(500).json({
      error: 'Internal server error while analyzing URL',
      message: error.message,
    });
  }
}
