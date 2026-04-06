/**
 * App - Root Component
 *
 * 布局编排：TopBar + ChatArea(MessageList) + InputArea + FullscreenOverlay
 * 顶层聚合所有 Hooks，将数据通过 props 分发给子组件。
 */

import { html } from 'htm/react';
import { useAppState, ActionTypes } from './context/AppContext.jsx';
import { TopBar } from './components/TopBar.jsx';
import { ChatArea } from './components/ChatArea.jsx';
import { MessageList } from './components/MessageList.jsx';
import { InputArea } from './components/InputArea.jsx';
import { FullscreenOverlay } from './components/widgets/FullscreenOverlay.jsx';
import { useChat } from './hooks/useChat.js';
import { useTheme } from './hooks/useTheme.js';
import { useModels } from './hooks/useModels.js';

export function App() {
  const { state, dispatch } = useAppState();
  const { messages, isStreaming, sendMessage } = useChat();
  const { theme, toggleTheme } = useTheme();
  const { currentModel, models, setModel } = useModels();

  // 同步 theme 到 context
  React.useEffect(() => {
    if (state.theme !== theme) {
      dispatch({ type: ActionTypes.SET_THEME, theme });
    }
  }, [theme]);

  // 全屏 Widget 回调：通过 context dispatch 设置 fullscreenWidget
  const handleFullscreen = (widgetState) => {
    dispatch({ type: ActionTypes.SET_FULLSCREEN_WIDGET, widget: widgetState });
  };

  return html`
    <div className="app-container" style=${{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <${TopBar}
        theme=${theme}
        onThemeToggle=${toggleTheme}
        currentModel=${currentModel}
        models=${models}
        onModelChange=${setModel}
      />
      <${ChatArea}>
        <${MessageList} messages=${messages} isStreaming=${isStreaming} onFullscreen=${handleFullscreen} />
      </${ChatArea}>
      <${InputArea}
        onSend=${sendMessage}
        disabled=${isStreaming}
      />
      <${FullscreenOverlay}
        widget=${state.fullscreenWidget}
        onClose=${() => dispatch({ type: ActionTypes.SET_FULLSCREEN_WIDGET, widget: null })}
      />
    </div>
  `;
}
