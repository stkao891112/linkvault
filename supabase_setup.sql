-- ========================================================
-- LinkVault AI - Supabase 繁體中文結構建表與即時推播腳本
-- 請在 Supabase 控制台的「SQL Editor」中貼上並點擊「Run」執行
-- ========================================================

-- 1. 建立「知識分類」資料表
create table if not exists public."知識分類" (
  "編號" text primary key,
  "名稱" text not null,
  "代表色" text default '#3b82f6',
  "圖標名稱" text default 'Layers',
  "是否系統預設" boolean default false,
  "建立時間" timestamptz default timezone('utc'::text, now()) not null
);

-- 2. 建立「書籤情報」資料表
create table if not exists public."書籤情報" (
  "編號" text primary key,
  "網址" text not null,
  "標題" text not null,
  "網域" text,
  "圖標" text,
  "分類編號" text,
  "個人筆記" text,
  "AI摘要" jsonb,
  "標籤清單" jsonb default '[]'::jsonb,
  "是否最愛" boolean default false,
  "閱讀狀態" text default 'unread',
  "建立時間" timestamptz default timezone('utc'::text, now()) not null,
  "GitHub數據" jsonb
);

-- 3. 預設寫入基礎知識分類
insert into public."知識分類" ("編號", "名稱", "代表色", "圖標名稱", "是否系統預設")
values
  ('cat-all', '全部收藏', '#3b82f6', 'Layers', true),
  ('cat-github', 'GitHub 開源專案', '#10b981', 'Github', false),
  ('cat-assets', '設計與素材庫', '#f59e0b', 'Palette', false),
  ('cat-ai', 'AI 輔助與模型', '#8b5cf6', 'Sparkles', false),
  ('cat-frontend', '前端組件與動畫', '#06b6d4', 'Code2', false),
  ('cat-tools', '效能與實用工具', '#ec4899', 'Wrench', false)
on conflict ("編號") do nothing;

-- 4. 啟用 Row Level Security (RLS) 並開放存取
alter table public."知識分類" enable row level security;
alter table public."書籤情報" enable row level security;

drop policy if exists "允許所有人讀寫 知識分類" on public."知識分類";
create policy "允許所有人讀寫 知識分類" on public."知識分類"
  for all using (true) with check (true);

drop policy if exists "允許所有人讀寫 書籤情報" on public."書籤情報";
create policy "允許所有人讀寫 書籤情報" on public."書籤情報"
  for all using (true) with check (true);

-- 5. 啟用 Supabase Realtime 即時推播廣播 (多裝置秒級同步)
alter publication supabase_realtime add table public."知識分類";
alter publication supabase_realtime add table public."書籤情報";
