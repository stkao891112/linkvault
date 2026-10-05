# 🔮 LinkVault AI - 靈感網址整理與次世代智慧情報庫

<p align="center">
  <img src="./src/assets/hero.png" alt="LinkVault AI Hero Banner" width="100%" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini Native" />
  <img src="https://img.shields.io/badge/Supabase-Realtime_Sync-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase Realtime" />
  <img src="https://img.shields.io/badge/Single--File-HTML_App-F59E0B?style=flat-square&logo=html5&logoColor=white" alt="Single-File Dist" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License MIT" />
</p>

> **告別雜亂無章的傳統書籤欄，迎接矽谷頂級標準的個人知識情報中心。**  
> 看到高星 GitHub 開源專案、頂尖設計素材庫或深度技術文章，只要貼上網址與隨手筆記，LinkVault AI 立即為您提煉核心價值、關鍵亮點、推薦適用情境與多維標籤。透過非對稱 Bento Grid 便當盒佈局、游標感知微光、全域極客鍵盤流與 Supabase 秒級多端同步，讓靈感與情報真正為你所用。

---

## 🌟 矽谷最前沿 UI/UX (Silicon Valley Tier)

LinkVault AI 深度整合頂尖現代科技產品（如 Linear、Raycast、Vercel、Supabase）的設計語言與微互動哲學：

### 1. 🍱 Bento Grid 非對稱便當盒佈局
- **動態視覺權重升級**：只要網址被標記為 ⭐「最愛收藏」或 GitHub Stars 突破 500 顆，卡片自動擴展升級為 **雙欄巨幅焦點（`md:col-span-2`）**。
- **高資訊密度雙欄架構**：
  - **左欄**：展示網站識別、Favicon、網域膠囊、GitHub 即時 Stars/Language 數據、個人筆記備註與擴增標籤雲（最多顯示 6 個）。
  - **右欄**：以清楚視覺層次呈現 AI 核心觀點、條列式亮點清單與「💡 推薦應用場景」指引，打破傳統書籤千篇一律的卡片限制。
- **動態便當盒屬性徽章**：依據情報性質自動配發如 `🔥 熱門開源`、`⭐ 精選情報`、`🎨 設計靈感`、`📚 權威技術`、`⚡ AI 智能` 等專屬徽章。

### 2. 🔦 Spotlight 游標感知微光 (Cursor-Tracking Radial Glow)
- **實時游標軌跡計算**：卡片邊框與背景底層內建幾何微積分算法，動態感應滑鼠游標相對位置。
- **雙層光暈層次**：
  - **外層 400px 聚光邊框（`spotlightBorder`）**：隨游標位置動態顯現色彩高光。
  - **內層 350px 漫反射柔光（`spotlightFill`）**：產生細緻通透的暗夜微光質感。

### 3. 🌈 Border Beam 360° Conic 霓虹流光邊框
- **分析中動態儀式感**：在置頂 Hero 巨幕輸入網址並點擊提煉時，輸入框外框立即啟動 360° 旋轉 Conic Gradient 霓虹邊框（`@keyframes border-beam`）與外擴環境呼吸光暈（`@keyframes beam-pulse`）。
- 告別傳統沉悶的旋轉菊花 Loading，帶來極具未來感與科技感的非同步提煉動態反饋。

### 4. 🪟 Zero-Modal 右側毛玻璃滑出抽屜 (Slide-over Drawer)
- **非破壞性沉浸式檢視**：捨棄傳統打斷使用流程的遮擋全螢幕 Modal，採用右側高質感毛玻璃滑出抽屜（`sm:max-w-2xl`，`backdrop-blur-xl`）。
- **無縫連續瀏覽與編輯**：抽屜開啟時背景仍保留上下文，可透過頂部導航切換鈕或鍵盤即時在多篇情報間切換，支援即時編輯筆記、管理標籤、重新觸發 AI 分析與一鍵複製 Markdown 筆記。

### 5. 🎨 情境色彩感知 (Domain Context Tinting)
智慧解析目標網域與知識分類，自動為卡片注入專屬情境色調，涵蓋邊框、標籤光環、文字亮點與 Spotlight 聚光：
- **GitHub / Code**：紫色調（`#8b5cf6` Violet，象徵開源工程）
- **Design / Assets**：粉色調（`#ec4899` Pink，象徵創意設計 - Figma, Dribbble, Unsplash, Behance 等）
- **Tech / Documentation**：綠色調（`#10b981` Emerald，象徵權威技術文檔 - React, Vue, MDN, Dev.to 等）
- **AI / Intelligence**：青藍色調（`#06b6d4` Cyan，象徵智慧運算 - OpenAI, Anthropic, DeepSeek, Perplexity, v0 等）
- **General Web**：科技靛藍（`#6366f1` Indigo，標準通用型）

### 6. ⌨️ 全域極客鍵盤流 (Geek-Grade Keyboard Workflow)
為追求極致效率的開發者與極客打造，雙手不離開鍵盤即可流暢操作所有功能：
- <kbd>⌘ K</kbd> 或 <kbd>Ctrl + K</kbd>：隨時隨地喚起全域指令調色盤
- <kbd>J</kbd> / <kbd>K</kbd>：情報上下篇輪巡無縫切換（Next / Prev）
- <kbd>Esc</kbd>：快速關閉滑出抽屜、設定彈窗或指令調色盤
- <kbd>F</kbd>：在抽屜中直接切換 ⭐ 最愛收藏狀態
- <kbd>/</kbd>：快速聚焦首頁搜尋輸入框
- <kbd>N</kbd>：快速打開新網址收錄對話框

### 7. ⌘K 全域指令調色盤 (Command Palette)
- 內建 Raycast 風格的快速指令視窗，支援全文與標籤模糊搜尋。
- 一鍵執行全域動作：收錄新網址、切換最愛篩選、切換待讀清單、切換 Bento 網格 / 表格視圖、快速開啟雲端設定等。

---

## 🤖 次世代 AI 知識引擎升級 (Next-Gen AI Engine)

### 1. ⚡ Google Gemini 原生旗艦支援
- 深度整合 Google Gemini 系列頂級模型：
  - `gemini-1.5-flash`（高性價比、速度極快、繁體中文理解力優秀）
  - `gemini-2.0-flash`（Google 最新次世代架構）
  - `gemini-2.5-flash` / `gemini-1.5-pro` / `gemini-2.0-flash-lite`
- 嚴格結構化 JSON Prompt，一鍵產出：**精煉標題**、**一語定乾坤 (oneLiner)**、**4 大核心亮點 (highlights)**、**最佳應用場景 (useCases)** 與 **推薦標籤 (suggestedTags)**。

### 2. ☁️ Vercel Serverless 雲端代跑 (`/api/analyze`)
- **免設定開箱即用**：部署在 Vercel 時，只需在專案環境變數填入 `GEMINI_API_KEY`。
- **手機與多裝置免輸金鑰**：手機、平板或公司電腦開啟網站時，後端 Serverless Function 自動使用雲端金鑰進行安全 AI 萃取，無需在每台裝置手動貼上 API Key！

### 3. 🔍 模型名稱動態抓取與下拉選單 (Dynamic Model Discovery)
- 告別手動死記硬背或打錯模型名稱！
- 在設定面板中點擊「**重新獲取可用模型清單**」，系統直接連線 Google Gemini、OpenAI、Groq 或 OpenRouter 端點，即時動態獲取帳號內所有可用模型並生成下拉選單。

### 4. 🏠 本地私有化模型支援 (Local LLM via Ollama / LM Studio)
- 完整相容 OpenAI API 規範，支援自訂 Base URL（如 `http://localhost:11434/v1` 或 `http://127.0.0.1:1234/v1`）與模型名稱（如 `llama3`, `deepseek-r1`, `qwen2.5`）。
- 讓私有研發筆記與機密資料 100% 留在本機，不外流任何 Token。

### 5. 🛠️ 內建在地智慧啟發式分析引擎 (Local Zero-Config Fallback)
- **100% 免金鑰、零網路延遲、離線完全可用**。
- 自動串接 **GitHub Public REST API** 即時取得 Stars 數、Forks 數、主要語言、Topics 標籤與開源簡介，在離線或無 API Key 時仍能提供豐富資訊。

---

## ⚡ Supabase 跨裝置雙向即時同步 (Cloud Realtime Sync)

### 1. 🇹🇼 100% 繁體中文原生資料庫架構
資料表與欄位採用 100% 純繁體中文設計，欄位語義一目瞭然：
- 資料表 `「書籤情報」`：`編號`、`網址`、`標題`、`網域`、`圖標`、`分類編號`、`個人筆記`、`AI摘要`、`標籤清單`、`是否最愛`、`閱讀狀態`、`建立時間`、`GitHub數據`。
- 資料表 `「知識分類」`：`編號`、`名稱`、`代表色`、`圖標名稱`、`是否系統預設`、`建立時間`。
- 內建前端 camelCase 與後端繁體中文資料表雙向零損映射轉換器（`toSupabaseBookmark`, `fromSupabaseBookmark`）。

### 2. 📡 Realtime 秒級雙向廣播
- 深度整合 Supabase Realtime Channels (`postgres_changes`)。
- 在電腦端收錄一篇網址，手機瀏覽器 1 秒內自動推播更新；在手機標記星標或刪除，電腦端無感即時同步！

### 3. 📋 一鍵複製 DDL 建表 SQL
- 設定面板內提供「一鍵複製 Supabase 建表 SQL」，包含建立繁中資料表、注入預設分類、Row Level Security (RLS) 安全策略與 `supabase_realtime` 廣播發布宣告，在 Supabase SQL Editor 貼上即可快速建置完成。

### 4. 🟢 即時連線狀態指示與環境變數支援
- 頂部導航列即時顯示雲端連線狀態燈號：
  - ⚪ `離線模式`（OFFLINE）
  - 🟡 `連線中`（CONNECTING）
  - 🔵 `已連線`（CONNECTED）
  - 🟢 `即時同步中`（SUBSCRIBED）
- 支援透過 Vercel 環境變數 `SUPABASE_URL` 與 `SUPABASE_ANON_KEY` 配置，跨裝置開啟自動無感連線。

---

## 🖥️ 資料管理與極致生產力

| 功能維度 | 特色說明 |
| :--- | :--- |
| **雙視圖一鍵切換** | 視覺化非對稱 **Bento 卡片網格視圖** 與 高資訊密度企業級 **表格清單視圖** 自由切換。 |
| **多維度篩選雲** | 支援分類膠囊橫向滑動、自訂標籤雲過濾、⭐最愛快篩、待研讀（Unread）聚焦、多重關鍵字模糊檢索。 |
| **筆記軟體完美聯動** | 內建一鍵複製 Markdown 格式筆記，相容 **Obsidian**、**Notion**、**Logseq**，自動排版引用句與標籤。 |
| **Local-First 資料持久** | 預設以 LocalStorage 保障本地持久化，無網路環境亦可無痛運作，並具備完整 JSON 匯出與匯入備份。 |
| **📦 雙擊單檔即開即用** | 透過 `vite-plugin-singlefile` 將整個 React 應用程式與所有資源打包成單一獨立的 `dist/index.html` 檔案，隨身碟雙擊離線隨處可開！ |

---

## ⌨️ 全域快捷鍵一覽

| 快捷鍵 | 功能說明 | 適用場景 |
| :--- | :--- | :--- |
| <kbd>⌘ K</kbd> 或 <kbd>Ctrl + K</kbd> | 開啟全域指令調色盤 (Command Palette) | 任何頁面 |
| <kbd>J</kbd> | 切換查看**下一篇**情報（Next Bookmark） | 全域 / 抽屜開啟時 |
| <kbd>K</kbd> | 切換查看**上一篇**情報（Previous Bookmark） | 全域 / 抽屜開啟時 |
| <kbd>F</kbd> | 切換當前情報的 ⭐ 最愛收藏狀態 | 抽屜開啟時 |
| <kbd>/</kbd> | 快速聚焦搜尋輸入框 | 任何未聚焦輸入框的狀態 |
| <kbd>N</kbd> | 快速喚起新網址收錄對話框 | 任何未聚焦輸入框的狀態 |
| <kbd>Esc</kbd> | 快速關閉抽屜、彈窗或退出搜尋聚焦 | 任何狀態 |

---

## 🛠️ 技術棧規格

- **前端核心**：React 19.2 (`react`, `react-dom`)
- **構建工具**：Vite 8.3
- **CSS 樣式引擎**：Tailwind CSS v4.3 + PostCSS
- **動態微互動**：Framer Motion (`motion/react` v14)
- **現代圖標庫**：Lucide React
- **雲端資料庫與推播**：Supabase (`@supabase/supabase-js` v2.117)
- **單檔打包優化**：`vite-plugin-singlefile`
- **無伺服器後端架構**：Vercel Serverless Function (`api/analyze.js`)
- **程式碼檢查器**：Oxlint

---

## 🚀 快速開始

### 1. 安裝環境與依賴
```bash
# Clone 專案
git clone https://github.com/stkao891112/linkvault.git
cd linkvault

# 安裝相依套件
npm install
```

### 2. 啟動本機開發伺服器
```bash
npm run dev
```
瀏覽器開啟：`http://localhost:5173`

若要在區域網路內以手機預覽：
```bash
npm run dev -- --host
```

### 3. 生產環境單檔打包 (Single-File Distribution)
```bash
npm run build
```
打包產生的 `dist/index.html` 為完全獨立的單一 HTML 檔案，包含所有編譯後的 CSS/JS，雙擊即可在離線環境獨立執行。

---

## ☁️ 雲端服務配置指南

### A. Vercel 環境變數（推薦，全裝置免手動配置）
在 Vercel 專案後台 **Settings -> Environment Variables** 加入以下變數：

| 變數名稱 | 說明 | 範例 |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API 金鑰（啟用手機免 Key 雲端分析） | `AIzaSy...` |
| `GEMINI_MODEL` | 預設 Gemini 模型（選填，預設 `gemini-1.5-flash`） | `gemini-2.0-flash` |
| `SUPABASE_URL` | Supabase 專案 URL（選填，啟用開啟即自動連線） | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Anon Key | `eyJhbGci...` |

### B. Supabase 繁體中文資料庫一鍵初始化
1. 前往 [Supabase](https://supabase.com) 註冊並建立專案。
2. 進入專案的「**SQL Editor**」。
3. 開啟 LinkVault AI 網站右上角「**⚙️ 設定**」->「**雲端即時同步**」分頁，點擊「**一鍵複製 Supabase 建表 SQL**」。
4. 貼上至 Supabase SQL Editor 並點擊「**Run**」執行。
5. 執行完成後即已建立繁體中文「`書籤情報`」與「`知識分類`」資料表，並自動啟用 Realtime 雙向秒級推播！

---

## 📄 授權條款

本專案採用 [MIT License](https://opensource.org/licenses/MIT) 授權發布。歡迎社群自由 Fork、貢獻 PR 與星標支持！

