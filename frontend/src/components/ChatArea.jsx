/**
 * ChatArea - 滚动容器组件
 *
 * 自动滚动到底部（当 messages 变化或 isStreaming 变化时）
 */

import { html } from 'htm/react';
import { useRef, useEffect } from 'react';

export function ChatArea({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [children]);

  return html`<div className="chat-area" ref=${containerRef}>${children}</div>`;
}
