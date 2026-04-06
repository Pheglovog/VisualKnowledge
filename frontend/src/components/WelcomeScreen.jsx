/**
 * WelcomeScreen - 空状态欢迎页
 */

import { html } from 'htm/react';

export function WelcomeScreen() {
  return html`
    <div class="welcome">
      <div class="icon">C</div>
      <h2>有什么可以帮你的？</h2>
      <p>支持交互式可视化 · HTML/Mermaid 图表 · 流式响应</p>
    </div>
  `;
}
