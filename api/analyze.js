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

    const { url, domain, userNote, ghDetails } = body || {};

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || body?.apiKey;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on Vercel environment'
      });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
      const errText = await geminiResponse.text();
      console.error('Gemini API Error:', geminiResponse.status, errText);
      return res.status(geminiResponse.status).json({
        error: `Gemini API returned status ${geminiResponse.status}`,
        details: errText,
      });
    }

    const data = await geminiResponse.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(502).json({
        error: 'Failed to extract structured JSON from Gemini response',
        rawText,
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      title: parsed.title,
      oneLiner: parsed.oneLiner,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
    });
  } catch (error) {
    console.error('Vercel analyze function error:', error);
    return res.status(500).json({
      error: 'Internal server error while analyzing URL',
      message: error.message,
    });
  }
}
