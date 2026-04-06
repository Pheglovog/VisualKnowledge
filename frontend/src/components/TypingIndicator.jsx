/**
 * TypingIndicator - 三点跳动动画
 */

import { html } from 'htm/react';

export function TypingIndicator() {
  return html`
    <div class="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
}
