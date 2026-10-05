import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Folder,
  Layers,
  Palette,
  Sparkles,
  Code2,
  Wrench,
  BookOpen,
  Globe,
  Flame,
  Heart,
  Cpu,
  Check
} from 'lucide-react';
import { GithubIcon } from './Icons';

const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#ef4444', // red
  '#14b8a6', // teal
  '#64748b', // slate
];

const AVAILABLE_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'Layers', icon: Layers },
  { name: 'Github', icon: GithubIcon },
  { name: 'Palette', icon: Palette },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Code2', icon: Code2 },
  { name: 'Wrench', icon: Wrench },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Globe', icon: Globe },
  { name: 'Flame', icon: Flame },
  { name: 'Heart', icon: Heart },
  { name: 'Cpu', icon: Cpu },
];

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) {
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      setErrorMsg('請輸入分類名稱');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setErrorMsg('已有同名分類，請換個名稱');
      return;
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      color: selectedColor,
      icon: selectedIcon,
      isSystem: false,
    };

    onAddCategory(newCat);
    setCategoryName('');
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">知識庫自訂分類管理</h2>
            <p className="text-[11px] sm:text-xs text-slate-400">自訂適合你個人知識庫的專屬分類與配色標籤</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          
          {/* Create New Category Form */}
          <form onSubmit={handleCreate} className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              新增自訂分類
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                分類名稱
              </label>
              <input
                type="text"
                placeholder="例如：3D WebGL、行銷文案、資料庫工具..."
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700/80 rounded-lg outline-none text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                標識色彩
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative ring-1 ring-slate-700"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                代表圖標
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const IconC = item.icon;
                  const isSelected = selectedIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item.name)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-xs'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <IconC className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>建立並加入分類</span>
            </button>
          </form>

          {/* Existing Categories List */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              現有分類列表
            </div>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-200">{cat.name}</span>
                    {cat.isSystem && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
                        系統預設
                      </span>
                    )}
                  </div>

                  {!cat.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`確定要刪除「${cat.name}」分類嗎？原有該分類的收藏會轉為未分類`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors"
                      title="刪除自訂分類"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            完成
          </button>
        </div>

      </div>
    </div>
  );
}
