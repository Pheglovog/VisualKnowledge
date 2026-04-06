/**
 * UserMessage - 用户消息气泡
 */

import { html } from 'htm/react';
import { escapeHtml } from '../utils/escape.js';

export function UserMessage({ content }) {
  return html`
    <div class="message user">
      <div class="bubble">${escapeHtml(content)}</div>
    </div>
  `;
}
