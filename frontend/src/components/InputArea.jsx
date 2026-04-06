/**
 * InputArea - 输入区域组件
 *
 * Textarea + 自动高度调整 + 发送按钮
 * Enter 发送 / Shift+Enter 换行
 */

import { html } from 'htm/react';
import { useState, useRef, useCallback } from 'react';

export function InputArea({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const hasContent = value.trim().length > 0;

  return html`
    <div class="input-area">
      <div class="input-wrapper">
        <textarea
          ref=${textareaRef}
          rows="1"
          placeholder="输入消息...  Shift+Enter 换行"
          value=${value}
          onChange=${(e) => { setValue(e.target.value); autoResize(); }}
          onKeyDown=${handleKeyDown}
          disabled=${disabled}
        />
        <button
          class="send-btn ${hasContent && !disabled ? 'active' : ''}"
          title="发送"
          onClick=${handleSend}
          disabled=${disabled || !hasContent}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  `;
}
