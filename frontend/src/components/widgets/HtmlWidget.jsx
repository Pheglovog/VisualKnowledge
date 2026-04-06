/**
 * HtmlWidget - HTML iframe 可视化组件
 *
 * 通过 sandboxed iframe 实时预览 HTML 内容，
 * 支持流式更新和全屏模式
 */

import { html } from 'htm/react';
import { useEffect, useRef } from 'react';
import { WidgetContainer } from './WidgetContainer.jsx';

export function HtmlWidget({ html: htmlContent, onFullscreen }) {
  const iframeRef = useRef(null);

  // 流式写入：内容到达即写入 iframe
  useEffect(() => {
    if (!htmlContent) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    _writeHtml(iframe, htmlContent);
  }, [htmlContent]);

  const handleFullscreen = () => {
    if (htmlContent && onFullscreen) {
      onFullscreen(htmlContent);
    }
  };

  const hasContent = htmlContent && htmlContent.trim().length > 0;

  return html`
    <${WidgetContainer}
      badge="visualize"
      typeLabel=${hasContent ? '交互式可视化' : '正在生成可视化...'}
      status=${hasContent ? 'done' : 'loading'}
      onZoom=${handleFullscreen}
    >
      <iframe
        ref=${iframeRef}
        sandbox="allow-scripts allow-same-origin"
        style=${{ width: '100%', height: hasContent ? undefined : '0px', border: 'none', display: 'block' }}
      />
    </${WidgetContainer}>
  `;
}

function _writeHtml(iframe, content) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(content);
    doc.close();

    // 根据实际内容调整高度，随内容增长逐步扩大
    try {
      const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 0);
      iframe.style.height = Math.min(h + 16, 1200) + 'px';
    } catch (_) {}
  } catch (e) {
    console.warn('[HtmlWidget] write failed:', e);
  }
}
