/**
 * MermaidWidget - Mermaid 图表渲染组件
 *
 * 异步调用 mermaidRenderer.renderMermaid(code)，
 * loading → 成功注入 SVG / 显示错误
 */

import { html } from 'htm/react';
import { useState, useEffect, useRef } from 'react';
import { WidgetContainer } from './WidgetContainer.jsx';
import { renderMermaid, getChartType } from '../../lib/mermaidRenderer.js';

const RENDER_TIMEOUT_MS = 15000;

export function MermaidWidget({ code, onZoom }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'done' | 'error'
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('图表');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setSvgContent('');
    setChartType(getChartType(code));

    // 超时保护
    timerRef.current = setTimeout(() => {
      if (!cancelled) {
        setStatus('error');
        setError('渲染超时（' + (RENDER_TIMEOUT_MS / 1000) + 's），可能是图表过于复杂');
      }
    }, RENDER_TIMEOUT_MS);

    renderMermaid(code).then(result => {
      if (cancelled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (result.error) {
        setStatus('error');
        setError(result.error);
      } else {
        setStatus('done');
        setSvgContent(result.svg);
      }
    }).catch(err => {
      if (cancelled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      console.error('[MermaidWidget] Render failed:', err);
      setStatus('error');
      setError(err.message || String(err));
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
