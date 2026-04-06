/**
 * HtmlWidget - HTML iframe 可视化组件
 *
 * 通过 sandboxed iframe 实时预览 HTML 内容，
 * 支持流式更新和全屏模式
 */

import { html } from 'htm/react';
import { useState, useEffect, useRef } from 'react';
import { WidgetContainer } from './WidgetContainer.jsx';

export function HtmlWidget({ html: htmlContent, onFullscreen }) {
  const iframeRef = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [status, setStatus] = useState('loading');

  // 初始化 iframe
  useEffect(() => {
    setIframeReady(false);
    setStatus('loading');
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  }, []);

  // iframe load 后写入内容
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handler = () => {
      setIframeReady(true);
      _writeHtml(iframe, htmlContent);
      setStatus('done');

      // 调整高度
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body) {
          const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 300);
          iframe.style.height = Math.min(h + 20, 1200) + 'px';
        }
      } catch (e) {}
    };

    iframe.addEventListener('load', handler);
    return () => iframe.removeEventListener('load', handler);
  }, [htmlContent]);

  // 追踪内容变化，定时重新写入（支持流式更新）
  useEffect(() => {
    if (!iframeReady || !htmlContent) return;
    const timer = setTimeout(() => {
      _writeHtml(iframeRef.current, htmlContent);
    }, 80);
    return () => clearTimeout(timer);
  }, [htmlContent, iframeReady]);

  const handleFullscreen = () => {
    if (htmlContent && onFullscreen) {
      onFullscreen(htmlContent);
    }
  };

  return html`
    <${WidgetContainer}
      badge="visualize"
      typeLabel=${status === 'loading' ? '正在生成可视化...' : '交互式可视化'}
      status=${status}
      onZoom=${handleFullscreen}
    >
      <iframe
        ref=${iframeRef}
        sandbox="allow-scripts allow-same-origin"
        style=${{ width: '100%', height: '460px', border: 'none', display: 'block' }}
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
  } catch (e) {}
}
