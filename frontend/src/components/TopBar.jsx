/**
 * TopBar - 顶部导航栏
 *
 * Logo + "Claude Chat" 标题 + 主题切换按钮 + 模型选择器
 */

import { html } from 'htm/react';

export function TopBar({ theme, onThemeToggle, currentModel, models, onModelChange }) {
  return html`
    <div class="top-bar">
      <div class="left">
        <div class="logo">C</div>
        <h1>Claude Chat</h1>
      </div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button class="theme-toggle" title="切换主题" onClick=${onThemeToggle}>
          <svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <select class="model-select" value=${currentModel} onChange=${(e) => onModelChange(e.target.value)}>
          ${models.map(m => html`<option key=${m} value=${m}>${m}</option>`)}
        </select>
      </div>
    </div>
  `;
}
