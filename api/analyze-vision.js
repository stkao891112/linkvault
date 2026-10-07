/**
 * Vercel Serverless Function: /api/analyze-vision
 * LinkVault Screenshot Intelligence Extractor
 * Powered by Gemini Vision Multimodal Fallback Chain
 */

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

    const { image, mimeType, model: requestedModel } = body || {};

    if (!image) {
      return res.status(400).json({ error: 'Image (base64) is required for vision analysis' });
    }

    const apiKey = process.env.GEMINI_API_KEY || body?.apiKey;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on Vercel environment',
      });
    }

    const cleanBase64 = image.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
    const detectedMime = mimeType || (image.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png');

    const visionPrompt = `你是一個頂尖的網頁情報與技術視覺識別專家。分析這張截圖中出現的所有網站、開源專案、線上工具或設計資源。
請辨識出截圖中包含的所有網站/工具項目（截圖中可能包含 1 個或多個不同網站，例如搜尋結果清單、書籤列表、社群貼文、GitHub 推薦、或網頁推薦列表）。

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

    // Format & validate items
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
  } catch (error) {
    console.error('Vercel analyze-vision function error:', error);
    return res.status(500).json({
      error: 'Internal server error while analyzing screenshot',
      message: error.message,
    });
  }
}
