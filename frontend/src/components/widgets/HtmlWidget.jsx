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
        style=${{ width: '100%', height: '0px', border: 'none', display: 'block' }}
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

    // 精确测量：只读 body.scrollHeight（documentElement 会返回视口最小高度）
    _fitHeight(iframe);

    // 延迟再测一次，捕获 JS 动态生成的内容（如 SVG）
    setTimeout(() => _fitHeight(iframe), 100);
  } catch (e) {
    console.warn('[HtmlWidget] write failed:', e);
  }
}

function _fitHeight(iframe) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc || !doc.body || !doc.body.parentNode) return;

    // 清除默认 margin/padding
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';

    // 只用 body.scrollHeight，不用 documentElement（它含视口最小高度）
    const h = doc.body.scrollHeight || 0;
    const current = parseInt(iframe.style.height) || 0;
    const target = Math.min(h, 1200);

    // 允许增长；允许缩小超过 20px 的差距
    if (target > current || target < current - 20) {
      iframe.style.height = target + 'px';
    }
  } catch (_) {}
}
