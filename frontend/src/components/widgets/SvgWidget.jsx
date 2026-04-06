/**
 * SvgWidget - SVG 可视化组件
 *
 * 从 SVG 标记字符串中提取完整 <svg>...</svg> 并渲染，
 * 支持放大查看
 */

import { html } from 'htm/react';
import { useMemo } from 'react';
import { WidgetContainer } from './WidgetContainer.jsx';

export function SvgWidget({ svg: svgBuffer, onZoom }) {
  const extractedSvg = useMemo(() => {
    return _extractSvg(svgBuffer);
  }, [svgBuffer]);

  const hasSvg = !!extractedSvg;

  const handleZoom = () => {
    if (extractedSvg && onZoom) {
      onZoom(extractedSvg);
    }
  };

  const bodyContent = hasSvg
    ? html`<div dangerouslySetInnerHTML=${{ __html: extractedSvg }} />`
    : html`<div class="widget-error">SVG 内容解析失败</div>`;

  return html`
    <${WidgetContainer}
      badge="visualize"
      typeLabel="SVG 可视化"
      status=${hasSvg ? 'done' : 'error'}
      onZoom=${hasSvg ? handleZoom : null}
    >
      ${bodyContent}
    </${WidgetContainer}>
  `;
}

/**
 * 从文本中提取完整的 <svg>...</svg> 标签
 */
function _extractSvg(text) {
  if (!text) return null;
  const start = text.indexOf('<svg');
  if (start === -1) return null;
  let depth = 0;
  let i = start;
  for (; i < text.length; i++) {
    if (text.substring(i, i + 4) === '<svg') depth++;
    if (text.substring(i, i + 6) === '</svg>') {
      depth--;
      if (depth === 0) { i += 6; break; }
    }
  }
  if (depth !== 0) return text.substring(start);
  return text.substring(start, i);
}
