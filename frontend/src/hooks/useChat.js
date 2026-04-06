/**
 * useChat - 核心对话 Hook
 *
 * 封装 SSE 流式连接和 StreamProcessor 协调逻辑。
 * 管理消息发送、流式接收、状态更新全生命周期。
 *
 * 返回: { messages, isStreaming, sendMessage }
 */

import { useState, useCallback, useRef } from 'react';
import { useAppState, ActionTypes } from '../context/AppContext.jsx';
import { StreamProcessor } from '../lib/streamProcessor.js';

export function useChat() {
  const { state, dispatch } = useAppState();
  const processorRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [localStreaming, setLocalStreaming] = useState(false);

  /**
   * 发送消息并启动流式接收
   */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || localStreaming) return;

    // 1. 添加用户消息
    const userMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: text,
      segments: [{ id: `seg_txt_user_${Date.now()}`, type: 'text', content: text, renderedContent: null, renderStatus: 'done', renderError: null }],
      status: 'complete',
      error: null,
      timestamp: Date.now(),
    };
    dispatch({ type: ActionTypes.ADD_USER_MESSAGE, content: text });
    setLocalMessages(prev => [...prev, userMsg]);

    // 2. 创建 AI 消息占位
    const assistantId = `msg_ast_${Date.now()}`;
    dispatch({ type: ActionTypes.START_ASSISTANT_MESSAGE, messageId: assistantId });
    setLocalStreaming(true);

    // 3. 初始化 StreamProcessor
    const processor = new StreamProcessor();
    processorRef.current = processor;

    // 4. 节流：限制 segments 更新频率（每 100ms 最多一次）
    let lastUpdate = 0;
    const THROTTLE_MS = 100;

    const scheduleUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate < THROTTLE_MS) return;
      lastUpdate = now;
      const segments = processor.getSegments();
      dispatch({
        type: ActionTypes.FINALIZE_SEGMENTS,
        messageId: assistantId,
        segments: JSON.parse(JSON.stringify(segments)), // deep clone for React re-render
      });
    };

    try {
      // 5. 发起 SSE 请求
      const conversationHistory = [...localMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          model: state.currentModel || undefined,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // 6. 读取 SSE 流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          let event;
          try { event = JSON.parse(data); } catch { continue; }

          if (event.type === 'text') {
            processor.feed(event.content);
            scheduleUpdate();
          } else if (event.type === 'error') {
            dispatch({
              type: ActionTypes.SET_STREAMING_ERROR,
              messageId: assistantId,
              error: event.message || 'Unknown error',
            });
            setLocalStreaming(false);
            return;
          }
        }
      }

      // 7. 流结束，finalize
      const finalSegments = processor.finalize();
      dispatch({
        type: ActionTypes.FINALIZE_SEGMENTS,
        messageId: assistantId,
        segments: finalSegments,
      });
      dispatch({ type: 'COMPLETE_STREAM', messageId: assistantId });

      // 更新本地 messages 列表
      const finalText = finalSegments
        .filter(s => s.type === 'text')
        .map(s => s.content)
        .join('');
      setLocalMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: finalText,
        segments: finalSegments,
        status: 'complete',
        error: null,
        timestamp: Date.now(),
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      dispatch({
        type: ActionTypes.SET_STREAMING_ERROR,
        messageId: assistantId,
        error: err.message || String(err),
      });
    }

    setLocalStreaming(false);
    processorRef.current = null;
  }, [localStreaming, state.currentModel, localMessages, dispatch]);

  return {
    messages: localMessages,
    isStreaming: localStreaming,
    sendMessage,
  };
}
