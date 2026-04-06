/**
 * FullscreenOverlay - 全屏覆盖层
 *
 * 用于放大查看 Mermaid 图表或全屏查看 HTML 可视化
 * Escape 键关闭
 */

import { html } from 'htm/react';
import { useEffect } from 'react';

export function FullscreenOverlay({ widget, onClose }) {
  // 全局 Escape 键监听
  useEffect(() => {
    if (!widget) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [widget, onClose]);

  if (!widget) return null;

  return html`
    <div class="widget-fullscreen-overlay active">
      <div class="fs-header">
        <div class="left">
          <span style=${{ color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>${widget.widgetType === 'mermaid' ? 'diagram' : 'visualize'}</span>
          <span style=${{ color: 'var(--text-muted)', fontSize: '12px' }}>${widget.title}</span>
        </div>
        <button class="fs-close" onClick=${onClose}>✕ 关闭</button>
      </div>
      <div style=${{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: 'var(--bg-primary)',
      }} dangerouslySetInnerHTML=${{ __html: widget.content }} />
    </div>
  `;
}
