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

    const { url, domain, userNote, ghDetails, model: requestedModel } = body || {};

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || body?.apiKey;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on Vercel environment'
      });
    }

    const cleanDomain = domain || '';

    const prompt = `你是一個專業的技術與設計網站情報分析師。使用者提供了一個網址：${url}
網域：${cleanDomain}
使用者補充備註：${userNote || '無'}
${ghDetails ? `GitHub 資訊：${ghDetails.description || ''}, Stars: ${ghDetails.stars || 0}, 語言: ${ghDetails.language || '未知'}` : ''}

請以繁體中文 (台灣) 快速整理此網站重點，輸出格式嚴格遵守下方 JSON，不要任何 Markdown 圍欄外的文字：
{
  "title": "精煉的網站/專案標題",
  "oneLiner": "一句話說明核心價值或定位（50字內）",
  "highlights": ["亮點1", "亮點2", "亮點3", "亮點4"],
  "useCases": ["適合場景1", "適合場景2", "適合場景3"],
  "suggestedTags": ["標籤1", "標籤2", "標籤3"]
}`;

    const preferredModel = (process.env.GEMINI_MODEL || requestedModel || 'gemini-3.8-flash').trim();
    // 優雅降級候選序列：首選/指定模型 -> gemini-3.8-flash -> gemini-2.0-flash -> gemini-1.5-flash -> gemini-1.5-pro
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
              temperature: 0.3,
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
        break; // 成功解析結構化 JSON，跳出降級循環
      } catch (err) {
        lastError = `Model ${modelToTry} fetch error: ${err.message}`;
        console.warn(`[Gemini Fallback] Exception with ${modelToTry}:`, err.message);
      }
    }

    if (!successfulResult) {
      return res.status(502).json({
        error: 'Failed to analyze URL with Gemini models after fallback chain',
        details: lastError,
      });
    }

    return res.status(200).json({
      success: true,
      modelUsed: actualModelUsed,
      title: successfulResult.title,
      oneLiner: successfulResult.oneLiner,
      highlights: Array.isArray(successfulResult.highlights) ? successfulResult.highlights : [],
      useCases: Array.isArray(successfulResult.useCases) ? successfulResult.useCases : [],
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
