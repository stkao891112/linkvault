export const INITIAL_CATEGORIES = [
  { id: 'cat-all', name: '全部收藏', color: '#3b82f6', icon: 'Layers', isSystem: true },
  { id: 'cat-github', name: 'GitHub 開源專案', color: '#10b981', icon: 'Github', isSystem: false },
  { id: 'cat-assets', name: '設計與素材庫', color: '#f59e0b', icon: 'Palette', isSystem: false },
  { id: 'cat-ai', name: 'AI 輔助與模型', color: '#8b5cf6', icon: 'Sparkles', isSystem: false },
  { id: 'cat-frontend', name: '前端組件與動畫', color: '#06b6d4', icon: 'Code2', isSystem: false },
  { id: 'cat-tools', name: '效能與實用工具', color: '#ec4899', icon: 'Wrench', isSystem: false },
];

export const INITIAL_BOOKMARKS = [
  {
    id: 'bm-1',
    url: 'https://github.com/shadcn-ui/ui',
    title: 'shadcn/ui - Beautifully designed components',
    domain: 'github.com',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    categoryId: 'cat-frontend',
    userNote: '目前最火紅的前端 UI 設計模式，複製程式碼到專案裡自由度極高，後續重構新專案必備。',
    aiSummary: {
      oneLiner: '不是傳統 NPM 套件庫，而是可直接複製貼上並完全自定義的 Radix UI + Tailwind 元件架構。',
      highlights: [
        '代碼直接存放在自己專案內，擁有 100% 程式碼控制權與樣式修改自由。',
        '採用 Radix Primitives 確保最高規格的無障礙性 (Accessibility / a11y)。',
        '原生支援 Tailwind CSS v4 與 CSS 變數，暗黑模式與主題切換極度流暢。',
        '社群生態系蓬勃，擁有大量第三方擴充（表單、表格、日曆、動畫組件）。'
      ],
      useCases: ['新一代 SaaS 後台儀表板開發', '需要高度定制品牌風格的商業系統', '追求無障礙標準與設計系統規範的現代專案'],
      suggestedCategory: '前端組件與動畫',
      suggestedTags: ['React', 'TailwindCSS', 'RadixUI', 'DesignSystem', 'GitHub80k+']
    },
    tags: ['React', 'TailwindCSS', 'RadixUI', 'UI設計'],
    isFavorite: true,
    status: 'read',
    createdAt: '2026-03-28T10:15:00.000Z',
    githubStats: {
      owner: 'shadcn-ui',
      repo: 'ui',
      stars: 84200,
      language: 'TypeScript',
      topics: ['components', 'design-system', 'radix-ui', 'react', 'tailwind']
    }
  },
  {
    id: 'bm-2',
    url: 'https://lucide.dev',
    title: 'Lucide - Beautiful & consistent icons',
    domain: 'lucide.dev',
    favicon: 'https://lucide.dev/favicon.ico',
    categoryId: 'cat-assets',
    userNote: 'Feather Icons 的社群繼承者，圖標風格簡約統一，提供 React、Vue、Svelte、Web Components 完整綁定。',
    aiSummary: {
      oneLiner: '開源社群維護的現代向量圖標庫，擁有超過 1500+ 個筆畫均勻、高延展性的高品質 SVG 圖標。',
      highlights: [
        '筆觸寬度 (stroke-width) 與尺寸可透過 React props 自由調整，細緻度高。',
        '嚴格統一的 24x24 格線設計規範，所有圖標在同一頁面上視覺重量高度均衡。',
        '樹搖優化 (Tree-shaking) 極佳，只打包有引入的圖標，不灌水 bundle 體積。',
        '搜尋系統支援語意標籤與同義字檢索，找圖標極快。'
      ],
      useCases: ['現代 Web/SaaS 產品 UI 介面設計', '儀表板導航列與狀態指示器', '行動端與桌面跨平台應用程式'],
      suggestedCategory: '設計與素材庫',
      suggestedTags: ['Icons', 'SVG', 'React', 'OpenSource', 'DesignAssets']
    },
    tags: ['Icons', 'SVG', '設計素材', 'UI'],
    isFavorite: true,
    status: 'read',
    createdAt: '2026-03-29T14:30:00.000Z',
    githubStats: {
      owner: 'lucide-icons',
      repo: 'lucide',
      stars: 18400,
      language: 'TypeScript',
      topics: ['feather-icons', 'icons', 'react-icons', 'svg']
    }
  },
  {
    id: 'bm-3',
    url: 'https://ui8.net',
    title: 'UI8 - Curated Design Assets & UI Kits',
    domain: 'ui8.net',
    favicon: 'https://ui8.net/favicon.ico',
    categoryId: 'cat-assets',
    userNote: '付費與免費頂級 3D 素材、Figma 設計系統、SaaS 儀表板 UI 套件庫，找設計靈感第一站。',
    aiSummary: {
      oneLiner: '全球設計師首選的高質感商業設計市集，提供海量 Figma UI Kit、3D 插畫、原型動效與成套設計系統。',
      highlights: [
        '精選頂尖設計工作室出品，非氾濫的劣質範本，設計語言具備當前矽谷一線水準。',
        '提供完整 Auto-layout 與 Design Tokens 的 Figma 原始檔，工程師還原度高。',
        '涵蓋豐富的科技、Web3、Fintech、AI 等熱門產業專案範例。',
        '每週更新免費專區 (Freebies)，適合小型 side project 快速取得高質感素材。'
      ],
      useCases: ['專案前期快速搭建 MVP 高保真原型', '找尋現代科技感配色與排版靈感', '採購精美 3D 渲染圖與抽象幾何背景'],
      suggestedCategory: '設計與素材庫',
      suggestedTags: ['Figma', 'UIKits', '3DAssets', 'Inspiration', 'SaaS']
    },
    tags: ['Figma', '設計靈感', 'UI套件', '3D素材'],
    isFavorite: false,
    status: 'unread',
    createdAt: '2026-04-01T08:20:00.000Z'
  },
  {
    id: 'bm-4',
    url: 'https://ollama.com',
    title: 'Ollama - Get up and running with large language models locally',
    domain: 'ollama.com',
    favicon: 'https://ollama.com/public/icon-64x64.png',
    categoryId: 'cat-ai',
    userNote: '本地跑開源大型語言模型（Llama 3、DeepSeek、Mistral、Qwen）最方便的工具，支援終端機一鍵執行與 REST API。',
    aiSummary: {
      oneLiner: '輕量且功能強大的本地大語言模型 (LLM) 運行環境，封裝了 GGUF 權重管理、量化調度與 OpenAI 相容介面。',
      highlights: [
        '一行指令即可下載並啟動模型（例：ollama run llama3 / deepseek-r1）。',
        '原生內建 11434 埠 OpenAI 相容 API，第三方 UI 與程式碼幾乎零修改即可無縫切換。',
        '支援 GPU 自動卸載 (Metal, CUDA, ROCm)，在 Mac 與 Windows 皆能極致榨乾硬體效能。',
        'Modelfile 架構允許輕鬆客製化 System Prompt 與溫度參數。'
      ],
      useCases: ['本機離線隱私敏感資料分析', '低成本開發與測試 AI Agent 系統', '建置本地知識庫與 RAG 企業內部助理'],
      suggestedCategory: 'AI 輔助與模型',
      suggestedTags: ['LLM', 'LocalAI', 'DeepSeek', 'Llama', 'OpenAI-API']
    },
    tags: ['AI模型', '本地部署', 'LLM', '工具'],
    isFavorite: true,
    status: 'read',
    createdAt: '2026-04-02T16:45:00.000Z',
    githubStats: {
      owner: 'ollama',
      repo: 'ollama',
      stars: 121000,
      language: 'Go',
      topics: ['llm', 'llama', 'ai', 'inference', 'local-first']
    }
  },
  {
    id: 'bm-5',
    url: 'https://ui.aceternity.com',
    title: 'Aceternity UI - Make your websites look 10x better',
    domain: 'ui.aceternity.com',
    favicon: 'https://ui.aceternity.com/favicon.ico',
    categoryId: 'cat-frontend',
    userNote: '現代網站最驚豔的動態特效組件庫，包含 3D 卡片、發光邊框、流體光效、文字打字動畫，搭配 Framer Motion。',
    aiSummary: {
      oneLiner: '專注於高互動視覺衝擊的現代前端元件庫，將複雜的 Framer Motion + Tailwind CSS 動畫封裝為即用代碼。',
      highlights: [
        '收錄矽谷獨角獸官網常見的動態效果（例如 3D Pin, Sparkles, Lamp effect, Hero Parallax）。',
        '無需安裝龐大套件，支援一鍵複製貼上原始碼，客製彈性高。',
        '與 Next.js 和現代 React 伺服器組件 (RSC) 架構完美整合。',
        '解決前端工程師不擅長寫複雜 WebGL 或 CSS Keyframe 視覺動效的痛點。'
      ],
      useCases: ['SaaS 產品首頁 Landing Page 製作', '個人作品集 (Portfolio) 視覺加分', '行銷宣傳與活動頁面的高吸睛動態區塊'],
      suggestedCategory: '前端組件與動畫',
      suggestedTags: ['FramerMotion', 'Animations', 'React', 'Tailwind', 'HeroSections']
    },
    tags: ['動畫特效', 'FramerMotion', 'LandingPage', '前端'],
    isFavorite: false,
    status: 'unread',
    createdAt: '2026-04-03T11:10:00.000Z'
  },
  {
    id: 'bm-6',
    url: 'https://github.com/astral-sh/uv',
    title: 'astral-sh/uv: An extremely fast Python package and project manager',
    domain: 'github.com',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    categoryId: 'cat-tools',
    userNote: '用 Rust 重寫的極速 Python 套件管理工具，完全取代 pip, pip-tools, virtualenv, poetry，速度快 10-100 倍！',
    aiSummary: {
      oneLiner: '由 Ruff 團隊打造的新一代極致速度 Python 專案與套件管理器，以單一執行檔整合環境管理與解析。',
      highlights: [
        '以 Rust 撰寫，套件下載與依賴解析速度比傳統 pip 快 10 至 100 倍以上。',
        '跨平台統一 CLI 體驗，支援管理多版本 Python 直譯器安裝與自動環境隔離。',
        '完全相容標準 pyproject.toml 規範，支援可重現的 uv.lock 鎖定檔。',
        '單一二進位執行檔零相依，極大幅度加速 CI/CD 流水線與 Docker 映像檔構建。'
      ],
      useCases: ['加速本地 Python 專案開發與依賴安裝', '提升 Docker 容器構建與 CI 測試執行效率', '團隊開發統一 Python 直譯器版本'],
      suggestedCategory: '效能與實用工具',
      suggestedTags: ['Rust', 'Python', 'DevTools', 'Performance', 'PackageManagement']
    },
    tags: ['Python', 'Rust', '開發工具', '效能優化'],
    isFavorite: true,
    status: 'read',
    createdAt: '2026-04-04T09:00:00.000Z',
    githubStats: {
      owner: 'astral-sh',
      repo: 'uv',
      stars: 43500,
      language: 'Rust',
      topics: ['python', 'packaging', 'rust', 'cli', 'pip-alternative']
    }
  }
];
