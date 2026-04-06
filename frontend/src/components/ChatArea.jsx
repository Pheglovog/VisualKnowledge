/**
 * ChatArea - 滚动容器组件
 *
 * 智能自动滚动：仅在用户处于底部附近时自动跟随，
 * 用户向上滚动时保持位置不被拉回。
 */

import { html } from 'htm/react';
import { useRef, useEffect } from 'react';

const STICKY_THRESHOLD = 80;

export function ChatArea({ children }) {
  const containerRef = useRef(null);
  const userScrolledUp = useRef(false);

  // 监听用户手动滚动
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledUp.current = distFromBottom > STICKY_THRESHOLD;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 内容变化时：仅在用户没有主动上滑时自动滚到底部
  useEffect(() => {
    const el = containerRef.current;
    if (!el || userScrolledUp.current) return;
    el.scrollTop = el.scrollHeight;
  }, [children]);

  return html`<div className="chat-area" ref=${containerRef}>${children}</div>`;
}
