/**
 * Application Entry Point
 *
 * 使用 React 18 createRoot API 挂载根组件。
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in DOM');
}

createRoot(rootEl).render(React.createElement(App));
