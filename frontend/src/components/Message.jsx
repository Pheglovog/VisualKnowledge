/**
 * Message - 消息分发组件
 *
 * 根据 role 渲染 UserMessage 或 AssistantMessage
 */

import { html } from 'htm/react';
import { UserMessage } from './UserMessage.jsx';
import { AssistantMessage } from './AssistantMessage.jsx';

export function Message({ message, isStreaming, onFullscreen }) {
  if (message.role === 'user') {
    return html`<${UserMessage} content=${message.content} />`;
  }
  return html`<${AssistantMessage} message=${message} isStreaming=${isStreaming} onFullscreen=${onFullscreen} />`;
}
