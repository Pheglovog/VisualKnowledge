/**
 * WidgetContainer - 通用 Widget 外壳
 *
 * 渲染 header（badge + typeLabel + zoom 按钮）+ body（children）
 */

import { html } from 'htm/react';

export function WidgetContainer({ badge, typeLabel, status = 'done', children, onZoom }) {
  const uid = `wc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  return html`
    <div class="widget-container">
      <div class="widget-header">
        <div class="left">
          <span class="badge">${badge}</span>
          <span class="widget-type">${typeLabel}</span>
        </div>
        ${onZoom ? html`
          <button class="btn" id="zoom-${uid}" onClick=${onZoom}>⛶ 放大</button>
        ` : ''}
      </div>
      <div class="widget-body">
        ${status === 'loading' ? html`
          <div class="widget-loading">
            <div class="spinner"></div> 渲染中...
          </div>
        ` : children}
      </div>
    </div>
  `;
}
