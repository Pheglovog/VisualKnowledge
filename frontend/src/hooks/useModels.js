/**
 * useModels - 模型加载 Hook
 *
 * useEffect 中 fetch GET /api/models，
 * 解析响应后 dispatch SET_MODELS。
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppState, ActionTypes } from '../context/AppContext.jsx';

export function useModels() {
  const { state, dispatch } = useAppState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          const models = [...new Set(data.available || [data.current])];
          dispatch({
            type: ActionTypes.SET_MODELS,
            models,
            current: data.current,
          });
        }
      } catch (e) {
        console.error('Failed to load models:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dispatch]);

  const setModel = useCallback((model) => {
    dispatch({ type: ActionTypes.SET_MODELS, models: state.availableModels, current: model });
  }, [state.availableModels, dispatch]);

  return {
    currentModel: state.currentModel,
    models: state.availableModels,
    setModel,
    isLoading,
  };
}
