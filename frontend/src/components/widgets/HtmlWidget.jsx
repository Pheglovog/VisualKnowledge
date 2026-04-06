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
        style=${{ width: '100%', height: '0px', border: 'none', display: 'block', overflow: 'hidden' }}
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

    // 紧凑高度：移除 body 默认 margin，只保留最小 padding
    try {
      doc.body.style.margin = '0';
      doc.body.style.padding = '0';
      const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 0);
      // 只在内容更高时才增大，不缩小（避免抖动）
      const current = parseInt(iframe.style.height) || 0;
      const target = Math.min(h + 4, 1200);
      if (target > current || target < current - 20) {
        iframe.style.height = target + 'px';
      }
    } catch (_) {}
  } catch (e) {
    console.warn('[HtmlWidget] write failed:', e);
  }
}
