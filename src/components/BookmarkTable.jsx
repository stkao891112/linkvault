import React from 'react';
import {
  ExternalLink,
  Star,
  Sparkles,
  Eye,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Tag
} from 'lucide-react';

export default function BookmarkTable({
  bookmarks,
  categories,
  onOpenDetail,
  onToggleFavorite,
  onToggleStatus,
  onDelete,
  onSelectTag
}) {
  const [copiedId, setCopiedId] = React.useState(null);

  const getCategory = (catId) => {
    return categories.find((c) => c.id === catId);
  };

  const handleCopyMarkdown = (e, b) => {
    e.stopPropagation();
    const cat = getCategory(b.categoryId);
    const md = `### [${b.title}](${b.url})\n\n**分類**: ${cat?.name || '未分類'}\n**筆記**: ${b.userNote || '無'}\n**AI重點**: ${b.aiSummary?.oneLiner || ''}`;
    navigator.clipboard.writeText(md);
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg shadow-black/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">⭐</th>
              <th className="py-3.5 px-4 min-w-[220px]">網站 / 專案名稱</th>
              <th className="py-3.5 px-4 w-32">分類</th>
              <th className="py-3.5 px-4 min-w-[200px]">個人備註</th>
              <th className="py-3.5 px-4 min-w-[240px]">AI 智能摘要</th>
              <th className="py-3.5 px-4 min-w-[140px]">標籤</th>
              <th className="py-3.5 px-4 w-28 text-center">狀態</th>
              <th className="py-3.5 px-4 w-28 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {bookmarks.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500">
                  查無符合條件的收藏資料
                </td>
              </tr>
            ) : (
              bookmarks.map((b) => {
                const cat = getCategory(b.categoryId);
                return (
                  <tr
                    key={b.id}
                    onClick={() => onOpenDetail(b)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Favorite Star */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(b.id);
                      }}
                    >
                      <button
                        className={`p-1 rounded-md transition-colors ${
                          b.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${b.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                    {/* Site Title & Domain */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <img
                          src={b.favicon}
                          alt=""
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          className="w-4 h-4 object-contain mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                            {b.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span>{b.domain}</span>
                            <a
                              href={b.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-500 hover:text-indigo-400 inline-flex items-center"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {b.githubStats?.stars && (
                              <span className="text-amber-400 font-medium">
                                ★ {(b.githubStats.stars / 1000).toFixed(1)}k
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      {cat && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                            border: `1px solid ${cat.color}40`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      )}
                    </td>

                    {/* User Note */}
                    <td className="py-3.5 px-4">
                      {b.userNote ? (
                        <div className="text-xs text-amber-200 bg-amber-950/30 border border-amber-800/40 rounded-md px-2.5 py-1 line-clamp-2">
                          {b.userNote}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">無備註</span>
                      )}
                    </td>

                    {/* AI Summary */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {b.aiSummary?.oneLiner || '已完成智慧分析'}
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(b.tags || []).slice(0, 2).map((t) => (
                          <button
                            key={t}
                            onClick={() => onSelectTag(t)}
                            className="text-[11px] bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-300 text-slate-400 px-1.5 py-0.5 rounded transition-colors border border-slate-700/60"
                          >
                            #{t}
                          </button>
                        ))}
                        {(b.tags || []).length > 2 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{b.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(b.id);
                      }}
                    >
                      <button
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          b.status === 'read'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                            : 'bg-violet-950/40 text-violet-400 border border-violet-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{b.status === 'read' ? '已掌握' : '待研讀'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleCopyMarkdown(e, b)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                          title="複製 Markdown"
                        >
                          {copiedId === b.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onOpenDetail(b)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 rounded-md transition-colors"
                          title="查看情報詳情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(b.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
