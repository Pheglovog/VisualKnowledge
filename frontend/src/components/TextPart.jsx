/**
 * TextPart - Markdown 文本段落组件
 *
 * 调用 markdownRenderer.renderMarkdown 生成 HTML，
 * 使用 dangerouslySetInnerHTML 注入 DOM，
 * useEffect 中触发 KaTeX 重新渲染。
 */

import { html } from 'htm/react';
import { useEffect, useRef } from 'react';
import { renderMarkdown } from '../lib/markdownRenderer.js';

export function TextPart({ content, isStreaming }) {
  const elRef = useRef(null);

  // 渲染 Markdown HTML
  const renderedHtml = renderMarkdown(content || '');

  // 内容更新后重新渲染 KaTeX
  useEffect(() => {
    if (elRef.current && typeof katex !== 'undefined') {
      try {
        // 重新扫描并渲染数学公式
        renderMathInElement(elRef.current, {
          delimiters: [
            { left: '$$', right: '$$', displayMode: true },
            { left: '$', right: '$', displayMode: false },
          ],
          throwOnError: false,
        });
      } catch (e) {
        // 静默失败
      }
    }
  }, [content]);

  return html`<div class="text-part" ref=${elRef} dangerouslySetInnerHTML=${{ __html: renderedHtml }} />`;
}

// 辅助：调用全局 renderMathInElement（katex 提供）
function renderMathInElement(element, options) {
  if (typeof window !== 'undefined' && window.renderMathInElement) {
    window.renderMathInElement(element, options);
  }
}
