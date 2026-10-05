import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Star,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  Eye,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  GitFork,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDomainTheme } from '../utils/domainTheme';

export default function BookmarkCard({
  bookmark,
  category,
  onOpenDetail,
  onToggleFavorite,
  onToggleStatus,
  onDelete,
  onSelectTag,
  isBento = false,
}) {
  const [copied, setCopied] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const theme = getDomainTheme(bookmark.domain, bookmark.categoryId);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCopyMarkdown = (e) => {
    e.stopPropagation();
    const md = `### [${bookmark.title}](${bookmark.url})\n\n**網域**: \`${bookmark.domain}\` | **分類**: ${category?.name || '未分類'}\n\n**個人筆記**: ${bookmark.userNote || '無'}\n\n**AI 提煉重點**:\n${bookmark.aiSummary?.oneLiner ? `> ${bookmark.aiSummary.oneLiner}\n\n` : ''}${
      (bookmark.aiSummary?.highlights || []).map((h) => `- ${h}`).join('\n')
    }\n\n**標籤**: ${(bookmark.tags || []).map((t) => `#${t}`).join(' ')}`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGitHub = !!bookmark.githubStats;
  const starsFormatted = bookmark.githubStats?.stars
    ? bookmark.githubStats.stars >= 1000
      ? `${(bookmark.githubStats.stars / 1000).toFixed(1)}k`
      : bookmark.githubStats.stars
    : null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetail(bookmark)}
      className={`group relative flex flex-col justify-between bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl border border-slate-800/90 ${theme.activeBorderClass} p-5 shadow-lg shadow-black/20 hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
        isBento ? 'md:col-span-2' : ''
      }`}
    >
      {/* 1. Dynamic Radial Spotlight Border & Surface Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${theme.spotlightBorder}, transparent 65%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${theme.spotlightFill}, transparent 80%)`,
        }}
      />

      {/* Card Content Stage */}
      <div className="relative z-10">
        
        {/* Top Header: Favicon + Domain pill + Category + Bento Badge + Quick Action buttons */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <div className="w-6 h-6 rounded-md bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 border border-slate-800">
              <img
                src={bookmark.favicon}
                alt=""
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border truncate ${theme.badgeClass}`}>
              {bookmark.domain}
            </span>
            {category && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 border"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                  borderColor: `${category.color}30`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {catNameClean(category.name)}
              </span>
            )}
            {/* Bento Asymmetric Badge */}
            {isBento && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase shadow-xs animate-pulse"
                style={{
                  backgroundColor: `${theme.accentColor}18`,
                  color: theme.accentColor,
                  borderColor: `${theme.accentColor}40`,
                }}
              >
                <Award className="w-3 h-3" />
                <span>{bookmark.isFavorite ? '⭐ 精選典藏' : theme.bentoTag}</span>
              </span>
            )}
          </div>

          {/* Quick Action Buttons: Favorite & Status */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleFavorite(bookmark.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                bookmark.isFavorite
                  ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={bookmark.isFavorite ? '取消最愛' : '加入最愛'}
            >
              <Star className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => onToggleStatus(bookmark.id)}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                bookmark.status === 'read'
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={bookmark.status === 'read' ? '標示為待研讀' : '標示為已掌握'}
            >
              <CheckCircle2 className={`w-4 h-4 ${bookmark.status === 'read' ? 'fill-emerald-950/60 text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bento Asymmetric Dual-Column Rhythm on md: screens */}
        {isBento ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
            {/* Left Column in Bento Card */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold text-slate-100 text-lg leading-snug group-hover:${theme.accentText} transition-colors line-clamp-2`}>
                  {bookmark.title}
                </h3>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`text-slate-500 hover:${theme.accentText} p-1 rounded-md hover:bg-slate-800 shrink-0 transition-colors`}
                  title="在新分頁開啟原始網頁"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* GitHub Stats Badge */}
              {isGitHub && (
                <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {starsFormatted} Stars
                  </span>
                  {bookmark.githubStats?.language && (
                    <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 border border-slate-700/60 text-[11px]">
                      {bookmark.githubStats.language}
                    </span>
                  )}
                  {bookmark.githubStats?.forks && (
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <GitFork className="w-3 h-3" />
                      {bookmark.githubStats.forks}
                    </span>
                  )}
                </div>
              )}

              {/* AI One-Liner Summary */}
              {bookmark.aiSummary?.oneLiner && (
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {bookmark.aiSummary.oneLiner}
                  </p>
                </div>
              )}

              {/* User Note */}
              {bookmark.userNote && (
                <div className="bg-amber-950/30 rounded-xl p-2.5 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-semibold text-amber-400 mr-1.5">心得備註:</span>
                    <span className="text-slate-300">{bookmark.userNote}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column in Bento Card: AI Highlights & Use Cases */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-2.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              {bookmark.aiSummary?.highlights && bookmark.aiSummary.highlights.length > 0 ? (
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${theme.accentText}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI 核心亮點</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {bookmark.aiSummary.highlights.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className={`${theme.accentText} font-bold shrink-0 mt-0.5`}>•</span>
                        <span className="line-clamp-2">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  點擊開啟以查看詳細情報與標籤設定
                </div>
              )}

              {/* Quick Tip / 推薦場景 */}
              {bookmark.aiSummary?.useCases && bookmark.aiSummary.useCases.length > 0 && (
                <div className="bg-indigo-950/40 rounded-lg px-2.5 py-1.5 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-1.5 mt-auto">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">推薦：{bookmark.aiSummary.useCases[0]}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Standard 1-Column Card Layout */
          <>
            {/* Title & Link */}
            <div className="space-y-1 mb-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold text-slate-100 text-base leading-snug group-hover:${theme.accentText} transition-colors line-clamp-2`}>
                  {bookmark.title}
                </h3>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`text-slate-500 hover:${theme.accentText} p-1 rounded-md hover:bg-slate-800 shrink-0 transition-colors`}
                  title="在新分頁開啟原始網頁"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* GitHub Stats Badge */}
              {isGitHub && (
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {starsFormatted}
                  </span>
                  {bookmark.githubStats?.language && (
                    <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 border border-slate-700/60 text-[11px]">
                      {bookmark.githubStats.language}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* AI One-Liner Summary */}
            {bookmark.aiSummary?.oneLiner && (
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-3">
                {bookmark.aiSummary.oneLiner}
              </p>
            )}

            {/* User Note */}
            {bookmark.userNote && (
              <div className="bg-amber-950/30 rounded-xl p-3 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2 mb-3">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold text-amber-400 mr-1.5">筆記備註:</span>
                  <span className="text-slate-300">{bookmark.userNote}</span>
                </div>
              </div>
            )}

            {/* Collapsible Key Highlights Accordion */}
            {bookmark.aiSummary?.highlights && bookmark.aiSummary.highlights.length > 0 && (
              <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setShowHighlights(!showHighlights)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/90 text-xs ${theme.accentText} transition-colors`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI 核心亮點 ({bookmark.aiSummary.highlights.length})</span>
                  </div>
                  {showHighlights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                  {showHighlights && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 overflow-hidden"
                    >
                      {bookmark.aiSummary.highlights.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className={`${theme.accentText} font-bold shrink-0`}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Quick Tip / 推薦場景 */}
            {bookmark.aiSummary?.useCases && bookmark.aiSummary.useCases.length > 0 && (
              <div className="bg-indigo-950/30 rounded-xl px-3 py-2 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2 mb-3">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">推薦：{bookmark.aiSummary.useCases[0]}</span>
              </div>
            )}
          </>
        )}

        {/* Tags Row */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" onClick={(e) => e.stopPropagation()}>
            {bookmark.tags.slice(0, isBento ? 6 : 4).map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-slate-200 px-2 py-0.5 rounded-md transition-colors border border-slate-700/60"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Footer Controls */}
      <div
        className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] text-slate-500 font-mono">
          {new Date(bookmark.createdAt).toLocaleDateString('zh-TW')}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-[11px]"
            title="複製 Markdown 筆記"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已複製</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenDetail(bookmark)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${theme.accentText} hover:bg-slate-800/80 font-medium transition-colors text-[11px]`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>情報詳情</span>
          </button>

          <button
            onClick={() => onDelete(bookmark.id)}
            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors ml-1"
            title="刪除此收藏"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </motion.div>
  );
}

function catNameClean(name = '') {
  return name.replace(/^[^\w\u4e00-\u9fa5]+/, '');
}
