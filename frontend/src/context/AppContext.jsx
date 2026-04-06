/**
 * AppContext - 全局状态管理
 *
 * 基于 React Context + useReducer 的单一数据源。
 * 管理对话消息、流式状态、主题、模型选择、全屏 Widget。
 */

import { createContext, useContext, useReducer } from 'react';

// ====== Action Types ======

export const ActionTypes = {
  ADD_USER_MESSAGE: 'ADD_USER_MESSAGE',
  START_ASSISTANT_MESSAGE: 'START_ASSISTANT_MESSAGE',
  APPEND_TO_SEGMENT: 'APPEND_TO_SEGMENT',
  FINALIZE_SEGMENTS: 'FINALIZE_SEGMENTS',
  SET_STREAMING_ERROR: 'SET_STREAMING_ERROR',
  SET_MODELS: 'SET_MODELS',
  SET_THEME: 'SET_THEME',
  SET_FULLSCREEN_WIDGET: 'SET_FULLSCREEN_WIDGET',
};

// ====== Initial State ======

const initialState = {
  messages: [],
  isStreaming: false,
  currentModel: '',
  availableModels: [],
  theme: (() => {
    try { return localStorage.getItem('claude-chat-theme') || 'dark'; }
    catch { return 'dark'; }
  })(),
  fullscreenWidget: null,
};

// ====== Reducer ======

function appReducer(state, action) {
  switch (action.type) {

    case ActionTypes.ADD_USER_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          role: 'user',
          content: action.content,
          segments: [{ id: `seg_txt_user_${Date.now()}`, type: 'text', content: action.content, renderedContent: null, renderStatus: 'done', renderError: null }],
          status: 'complete',
          error: null,
          timestamp: Date.now(),
        }],
      };

    case ActionTypes.START_ASSISTANT_MESSAGE:
      return {
        ...state,
        isStreaming: true,
        messages: [...state.messages, {
          id: action.messageId,
          role: 'assistant',
          content: '',
          segments: [],
          status: 'streaming',
          error: null,
          timestamp: Date.now(),
        }],
      };

    case ActionTypes.FINALIZE_SEGMENTS:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, segments: action.segments, content: _extractTextFromSegments(action.segments) }
            : msg
        ),
      };

    case ActionTypes.SET_STREAMING_ERROR:
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, status: 'error', error: action.error }
            : msg
        ),
      };

    // 流结束，标记消息完成
    case 'COMPLETE_STREAM':
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.map(msg =>
          msg.id === action.messageId && msg.status === 'streaming'
            ? { ...msg, status: 'complete' }
            : msg
        ),
      };

    case ActionTypes.SET_MODELS:
      return {
        ...state,
        availableModels: action.models,
        currentModel: action.current || state.currentModel,
      };

    case ActionTypes.SET_THEME:
      return { ...state, theme: action.theme };

    case ActionTypes.SET_FULLSCREEN_WIDGET:
      return { ...state, fullscreenWidget: action.widget };

    default:
      return state;
  }
}

// 从 segments 中提取纯文本（用于 conversationHistory）
function _extractTextFromSegments(segments) {
  return segments
    .filter(s => s.type === 'text')
    .map(s => s.content)
    .join('');
}

// ====== Context ======

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * 便捷 Hook：获取全局 state 和 dispatch
 */
export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
