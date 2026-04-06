/**
 * Mermaid Renderer
 *
 * 封装 Mermaid 初始化和图表渲染逻辑。
 * 依赖 ESM 模块: mermaid（通过 importmap 加载）
 */

const darkConfig = {
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#78350f',
    primaryTextColor: '#fafaf9',
    primaryBorderColor: '#d97706',
    lineColor: '#60a5fa',
    secondaryColor: '#292524',
    tertiaryColor: '#1c1917',
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    fontSize: '14px',
    nodeTextColor: '#fafaf9',
  },
  flowchart: { htmlLabels: true, curve: 'basis' },
  sequence: { mirrorActors: false },
  mindmap: { padding: 20 },
};

const lightConfig = {
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#fef3c7',
    primaryTextColor: '#1c1917',
    primaryBorderColor: '#d97706',
    lineColor: '#2563eb',
    secondaryColor: '#f5f5f4',
    tertiaryColor: '#fafaf9',
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    fontSize: '14px',
    nodeTextColor: '#1c1917',
  },
  flowchart: { htmlLabels: true, curve: 'basis' },
  sequence: { mirrorActors: false },
  mindmap: { padding: 20 },
};

let _mermaidModule = null;

/**
 * 动态加载 Mermaid ESM 模块（懒加载）
 * @returns {Promise<object>} Mermaid 模块
 */
async function _getMermaid() {
  if (_mermaidModule) return _mermaidModule;
  _mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
  return _mermaidModule;
}

/**
 * 根据 Mermaid 代码首行判断图表类型
 * @param {string} code - Mermaid 源代码
 * @returns {string} 中文类型名称
 */
export function getChartType(code) {
  const first = code.trim().split('\n')[0].trim().toLowerCase();
  const map = {
    graph: '流程图', flowchart: '流程图',
    sequence: '序列图', class: '类图', state: '状态图',
    er: 'ER图', gantt: '甘特图', pie: '饼图',
    journey: '用户旅程图', mindmap: '思维导图', timeline: '时间线',
    gitgraph: 'Git图', sankey: '桑基图', xychart: 'XY图表',
    block: '块图',
  };
  for (const [key, label] of Object.entries(map)) {
    if (first.startsWith(key)) return label;
  }
  return '图表';
}

/**
 * 渲染 Mermaid 图表为 SVG
 *
 * @param {string} code - Mermaid 源代码
 * @param {boolean} isLight - 是否浅色主题
 * @returns {Promise<{svg: string|null, error: string|null}>}
 */
export async function renderMermaid(code, isLight = false) {
  const id = 'm_' + Math.random().toString(36).substr(2, 9);

  try {
    const mermaid = await _getMermaid();

    // 每次渲染前用正确的主题重新初始化
    mermaid.initialize(isLight ? lightConfig : darkConfig);
    const { svg } = await mermaid.render(id, code);
    return { svg, error: null };
  } catch (e) {
    return { svg: null, error: e.message || String(e) };
  }
}
