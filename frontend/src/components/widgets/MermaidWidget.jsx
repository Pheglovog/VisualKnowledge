/**
 * MermaidWidget - Mermaid 图表渲染组件
 *
 * 异步调用 mermaidRenderer.renderMermaid(code)，
 * loading → 成功注入 SVG / 显示错误
 */

import { html } from 'htm/react';
import { useState, useEffect } from 'react';
import { WidgetContainer } from './WidgetContainer.jsx';
import { renderMermaid, getChartType } from '../../lib/mermaidRenderer.js';

export function MermaidWidget({ code, onZoom }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'done' | 'error'
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('图表');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setChartType(getChartType(code));

    renderMermaid(code).then(result => {
      if (cancelled) return;
      if (result.error) {
        setStatus('error');
        setError(result.error);
      } else {
        setStatus('done');
        setSvgContent(result.svg);
      }
    });

    return () => { cancelled = true; };
  }, [code]);

  const handleZoom = () => {
    if (svgContent && onZoom) {
      onZoom(svgContent, chartType);
    }
  };

  const bodyContent =
    status === 'loading' ? null :
    status === 'error' ?
      html`<div class="widget-error">图表渲染失败: ${error || '未知错误'}</div>` :
      html`<div dangerouslySetInnerHTML=${{ __html: svgContent }} />`;

  return html`
    <${WidgetContainer}
      badge="diagram"
      typeLabel=${status === 'loading' ? '正在渲染图表...' : chartType}
      status=${status}
      onZoom=${status === 'done' ? handleZoom : null}
    >
      ${bodyContent}
    </${WidgetContainer}>
  `;
}
