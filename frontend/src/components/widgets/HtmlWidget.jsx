/**
 * HtmlWidget - HTML iframe 可视化组件
 *
 * 通过 sandboxed iframe 实时预览 HTML 内容，
 * 支持流式更新和全屏模式
 */

import { html } from 'htm/react';
import { useState, useEffect, useRef } from 'react';
import { WidgetContainer } from './WidgetContainer.jsx';

const IFRAME_TIMEOUT_MS = 10000;

export function HtmlWidget({ html: htmlContent, onFullscreen }) {
  const iframeRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const timerRef = useRef(null);
  const stableContentRef = useRef('');

  // 检测内容是否稳定（连续相同内容说明流结束了）
  useEffect(() => {
    if (!htmlContent) return;

    // 内容变化时重置状态
    if (htmlContent !== stableContentRef.current) {
      setStatus('loading');
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    stableContentRef.current = htmlContent;
  }, [htmlContent]);

  // iframe 初始化 + 写入内容
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlContent) return;

    let settled = false;

    const write = () => {
      _writeHtml(iframe, htmlContent);
      setStatus('done');
      settled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    // 首次加载或 src 变化时等待 load 事件
    const handler = () => {
      write();
    };

    // 超时保护：即使 load 事件没触发也强制写入
    timerRef.current = setTimeout(() => {
      if (!settled) {
        console.warn('[HtmlWidget] iframe load timeout, forcing write');
        write();
      }
    }, IFRAME_TIMEOUT_MS);

    iframe.addEventListener('load', handler);

    // 如果 iframe 已经加载完成，直接写入
    try {
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        write();
      }
    } catch (_) {
      // cross-origin or not ready yet, wait for load event
    }

    return () => {
      iframe.removeEventListener('load', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [htmlContent]);

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

    // 调整高度
    try {
      const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 300);
      iframe.style.height = Math.min(h + 20, 1200) + 'px';
    } catch (_) {}
  } catch (e) {
    console.warn('[HtmlWidget] write failed:', e);
  }
}
