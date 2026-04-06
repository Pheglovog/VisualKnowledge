/**
 * Application Entry Point
 *
 * 使用 React 18 createRoot API 挂载根组件。
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';

// ====== Error Boundary ======

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] React render error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: {
          padding: '24px', color: '#f87171', fontFamily: 'monospace',
          fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
          overflow: 'auto', height: '100vh', background: '#1c1917',
        }
      },
        React.createElement('h2', null, 'React Rendering Error'),
        React.createElement('p', null, this.state.error.toString()),
        React.createElement('pre', null, this.state.errorInfo?.componentStack || ''),
      );
    }
    return this.props.children;
  }
}

// ====== Bootstrap ======

console.log('[main] Loading app...');

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in DOM');
}

console.log('[main] Root element found, mounting React...');

createRoot(rootEl).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(AppProvider, null,
      React.createElement(App)
    )
  )
);

console.log('[main] App mounted successfully.');
