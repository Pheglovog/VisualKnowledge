/**
 * MessageList - 消息列表
 *
 * 为空时显示 WelcomeScreen，否则遍历渲染 Message
 */

import { html } from 'htm/react';
import { Message } from './Message.jsx';
import { WelcomeScreen } from './WelcomeScreen.jsx';

export function MessageList({ messages, isStreaming, onFullscreen }) {
  if (!messages || messages.length === 0) {
    return html`<${WelcomeScreen} />`;
  }

  return html`
    <div class="messages">
      ${messages.map(msg =>
        html`<${Message} key=${msg.id} message=${msg} isStreaming=${isStreaming && msg.status === 'streaming'} onFullscreen=${onFullscreen} />`
      )}
    </div>
  `;
}
