// Silicon Valley Domain Context Tinting Definition
export function getDomainTheme(domain = '', categoryId = '') {
  const d = (domain || '').toLowerCase();
  const c = (categoryId || '').toLowerCase();

  if (d.includes('github') || d.includes('gitlab') || d.includes('bitbucket')) {
    return {
      type: 'github',
      name: 'GitHub / Code',
      badgeClass: 'text-violet-300 bg-violet-500/10 border-violet-500/30',
      activeBorderClass: 'group-hover:border-violet-500/40',
      spotlightFill: 'rgba(139, 92, 246, 0.15)',
      spotlightBorder: 'rgba(167, 139, 250, 0.55)',
      accentColor: '#8b5cf6',
      accentText: 'text-violet-400',
      bentoTag: '🔥 熱門開源',
    };
  }

  if (
    d.includes('figma') ||
    d.includes('ui8') ||
    d.includes('dribbble') ||
    d.includes('unsplash') ||
    d.includes('behance') ||
    d.includes('freepik') ||
    d.includes('pexels') ||
    c === 'cat-design'
  ) {
    return {
      type: 'design',
      name: 'Design / Assets',
      badgeClass: 'text-pink-300 bg-pink-500/10 border-pink-500/30',
      activeBorderClass: 'group-hover:border-pink-500/40',
      spotlightFill: 'rgba(236, 72, 153, 0.15)',
      spotlightBorder: 'rgba(244, 114, 182, 0.55)',
      accentColor: '#ec4899',
      accentText: 'text-pink-400',
      bentoTag: '🎨 設計靈感',
    };
  }

  if (
    d.includes('docs') ||
    d.includes('lucide') ||
    d.includes('dev') ||
    d.includes('react') ||
    d.includes('vue') ||
    d.includes('developer') ||
    c === 'cat-reading'
  ) {
    return {
      type: 'docs',
      name: 'Tech / Documentation',
      badgeClass: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
      activeBorderClass: 'group-hover:border-emerald-500/40',
      spotlightFill: 'rgba(16, 185, 129, 0.15)',
      spotlightBorder: 'rgba(52, 211, 153, 0.55)',
      accentColor: '#10b981',
      accentText: 'text-emerald-400',
      bentoTag: '📚 權威技術',
    };
  }

  if (
    d.includes('openai') ||
    d.includes('anthropic') ||
    d.includes('deepseek') ||
    d.includes('ai') ||
    d.includes('v0.dev') ||
    d.includes('perplexity') ||
    d.includes('huggingface') ||
    c === 'cat-ai'
  ) {
    return {
      type: 'ai',
      name: 'AI / Intelligence',
      badgeClass: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
      activeBorderClass: 'group-hover:border-cyan-500/40',
      spotlightFill: 'rgba(6, 182, 212, 0.18)',
      spotlightBorder: 'rgba(56, 189, 248, 0.6)',
      accentColor: '#06b6d4',
      accentText: 'text-cyan-400',
      bentoTag: '⚡ AI 智能',
    };
  }

  // Default Standard Theme
  return {
    type: 'general',
    name: 'General Web',
    badgeClass: 'text-slate-300 bg-slate-800/80 border-slate-700/60',
    activeBorderClass: 'group-hover:border-indigo-500/40',
    spotlightFill: 'rgba(99, 102, 241, 0.14)',
    spotlightBorder: 'rgba(129, 140, 248, 0.5)',
    accentColor: '#6366f1',
    accentText: 'text-indigo-400',
    bentoTag: '⭐ 精選情報',
  };
}
