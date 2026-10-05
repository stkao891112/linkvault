# 🔮 LinkVault AI - 靈感網址整理與智能精摘

> **告別雜亂無章的傳統書籤欄。**  
> 看到有興趣的 GitHub 開源專案、素材庫或技術網站，貼上網址與隨手筆記，AI 快速為您提煉核心價值、特色亮點與分類標籤。

---

## ✨ 核心特色與架構亮點

- **🚀 舞台式 Hero 巨幕快速收錄**：首頁置頂懸浮發光輸入列，支援即時貼上網址、即開即用的熱門示範膠囊、展開個人筆記與多維設定。
- **🤖 雙軌 AI 智慧情報提煉**：
  - **預設在地智慧分析引擎**：0 延遲、免任何 API Key、100% 免費；自動連動 **GitHub Public REST API** 取得真實即時 Stars 數、主要語言、Topics 標籤與開源簡介。
  - **主流 LLM 無縫擴充**：支援在設定中接入真實 OpenAI (GPT-4o-mini)、Groq (Llama 3.3 70B) 或 OpenRouter 模型。
- **🎨 現代流體極客美學 (Tech-Forward UI)**：
  - 沉浸式深暗星空底色 (`bg-slate-950`) 搭配 Glassmorphism 毛玻璃微光質感。
  - 採用 **Framer Motion (`motion/react`)** 實現卡片彈簧淡入、懸浮位移與風琴式展開動態。
- **📱 全裝置 RWD 響應式適配**：
  - 手機端自動切換為單欄沉浸式瀑布流，自適應縮減內距提升資訊密度。
  - 分類膠囊支援手機原生慣性手勢左右滑動 (`touch-pan-x`)。
  - 按鈕觸控熱區 >= 38px，移除點擊閃光，深度適配 iPhone 底部安全區 (`env(safe-area-inset-bottom)`)。
- **📂 靈活知識分類與雙視圖切換**：
  - 自由自訂分類（專屬色盤與代表圖標）、標籤雲多維篩選、星標最愛與待讀狀態。
  - 提供**動態卡片視圖（Grid）**與**企業級清單表格視圖（Table）**一鍵切換。
- **📦 雙擊單檔即開即用 (Single-File Distribution)**：
  - 透過 `vite-plugin-singlefile` 將完整 React 應用打包為單一 HTML 檔案，不需伺服器環境，隨身碟與離線環境雙擊即可執行。
  - 支援完整 JSON 備份匯出 / 匯入，以及一鍵複製格式化 Markdown 筆記（相容 Obsidian / Notion）。

---

## 🛠️ 技術棧

- **前端框架**：React 19, Vite 8
- **樣式與主題**：Tailwind CSS v4
- **動態微互動**：Framer Motion (`motion`)
- **圖標庫**：Lucide React
- **打包最佳化**：Vite Singlefile Plugin
- **資料持久化**：Browser LocalStorage + JSON Export/Import

---

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動開發伺服器
```bash
npm run dev
```
瀏覽器開啟：`http://localhost:5173`

若要在手機或同區域網路裝置預覽：
```bash
npm run dev -- --host
```

### 3. 生產環境單檔打包
```bash
npm run build
```
打包產物位於 `dist/index.html`，為完全獨立的單一 HTML 檔案。

---

## 📄 授權條款

MIT License
