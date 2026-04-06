/**
 * useTheme - 主题切换 Hook
 *
 * 读取/写入 localStorage('claude-chat-theme')，
 * 切换时更新 document.documentElement.dataset.theme。
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'claude-chat-theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'dark'; }
    catch { return 'dark'; }
  });

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, [theme]);

  // 初始化：设置 DOM 主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return { theme, toggleTheme };
}
